pragma solidity >=0.8.0;
 
import {Ownable} from '../node_modules/@openzeppelin/contracts/access/Ownable.sol';
 
import "./leela.sol";
import "./chess.sol";
// SPDX-License-Identifier: UNLICENSED
/// @title BettingGame
/// @dev Betting game contract for Leela Chess Zero vs. World
///      This contract is an individual game engine that includes the betting & payout logic.
 
contract BettingGame is Ownable {
   /// NOTE: Variables are laid out in this particular order to pack them
   //        in as little storage slots as possible. This saves gas!
   //        See https://docs.soliditylang.org/en/v0.8.0/internals/layout_in_storage.html
   //
   //        slot 1: 256 + 16 + 8 + 8 + 8 + 16 + 16 (88 left)
   //        ...
 
   // INTER-GAME VARIABLES
 
   /// @dev Chess board contract
   Chess public chess;
 
   /// @dev Leela AI contract
   Leela public leela;
 
   /// @dev Minimum stake size.
   uint256 public minStake = 0.01 ether;
 
   uint16 public gameIndex = 0;
 
   uint16 public moveIndex = 0;
 
   /// @dev For reentrancy guard (use uint8 for gas saving & storage packing vs. bool).
   uint8 private locked = 0;
 
   /// @dev A map of addresses to their winnings across multiple games. Can be withdrawn from at any time, or stored to minimize gas costs.
   mapping(address => uint256) public accountsPayable; //#frontend
 
   /// @dev Stake period duration, default 60 mins
   uint256 public votePeriodDuration = 3600;
 
   /// Initial empty size of betting pools, used for the calculation of shares.
   uint256 public initVal;
 
   // INTRA-GAME VARIABLES
  
   /// @dev World / Leela pool size (uint128 for storage packing), #frontend
   uint256 public worldPoolSize;
   uint256 public leelaPoolSize;
 
   /// @dev User stakes on the World / Leela.
   mapping (uint16 => mapping(address => uint256)) public worldStakes;
   mapping (uint16 => mapping(address => uint256)) public leelaStakes;
 
   /// @dev User shares on the World / Leela.
   mapping (uint16 => mapping(address => uint256)) public worldShares;
   mapping (uint16 => mapping(address => uint256)) public leelaShares;
 
   /// @dev The total number of shares in the contract, used to calculate the payout.
   uint256 public totalLeelaShares;
   uint256 public totalWorldShares;
 
   /// @dev The color Leela is playing in this game -- true if white, false if black.
   bool public leelaColor;
  
   // INTRA-MOVE VARIABLES
 
   /// @dev Stake period deadline, reset at the beginning of each move voting period.
   uint256 public votePeriodEnd;
 
   /// @dev Leela's last move
   uint16 public leelaMove;
 
   /// @dev gameIndex => moveIndex => moves => number of staked votes.
   mapping (uint16 => mapping (uint16 => mapping(uint16 => uint256))) public movesToVotes;
 
   /// @dev gameIndex => moveIndex => list of all moves that have some votes.
   mapping (uint16 => mapping (uint16 => uint16[])) public registeredMoves;
 
   /// @dev gameIndex => moveIndex => voter address => move voted for
   mapping (uint16 => mapping(uint16 => mapping(address => uint16))) public voters;
 
   /// @dev gameIndex => "set" of voter addresses
   mapping (uint16 => mapping (address => bool)) public votersMap;
  
   /// @dev gameIndex => list of voter addresses
   mapping (uint16 => address[]) public votersList;//
  
   //EVENTS
 
   // A move was played.
   event movePlayed(uint16 worldMove, uint16 leelaMove);
   // Some player staked.
   event stakeMade(address player, bool leelaSide);
   // A vote was made with stake.
   event voteMade(address player, uint16 move);
   // The game started.
   event gameStart(bool leelaColor);
   // The game ended.
   event gameEnd(bool leelaWon);
 
   //MODIFIERS
 
   modifier nonReentrancy() {
       require(locked == 0, 'ReentrancyGuard: reentrant call');
       locked = 1;
       _;
       locked = 0;
   }
//     modifier onlyOwner() {
//       require(msg.sender == owner, "Not owner");
//       _;
//    }
   // CONSTRUCTOR AND VARIABLE SETTING FUNCTIONS
 
   constructor(address _chess, address _leela, uint256 initialPoolSize) {
       chess = Chess(_chess); // not sure if this is right
       chess.initializeGame();
       leela = Leela(_leela);
       registeredMoves[0][0] = leela.initializeLeela();
       leelaPoolSize = initialPoolSize;
       worldPoolSize = initialPoolSize;
       initVal = initialPoolSize;
       leelaColor = false;
       gameIndex = 0;
       moveIndex = 0;
   }
  
   function setChess(address _chess) public onlyOwner {//onlyOwner
       chess = Chess(_chess);
   }
 
    function setLeela(address _leela) public onlyOwner {//onlyOwner
       leela = Leela(_leela);
   }
 
   function setMinStake(uint256 _minStake) public onlyOwner {//onlyOwner
       minStake = _minStake;
   }
 
   function setPoolSize(uint256 _a) public onlyOwner {//onlyOwner
       require((leelaPoolSize == initVal) && (worldPoolSize == initVal), "Cannot modify pool size once pools are nonempty.");
       leelaPoolSize = _a;
       worldPoolSize = _a;
       initVal = _a;// dont  need require
   }
 
   /// @dev Modify staking duration.
   function setVotePeriod(uint256 d) public onlyOwner {//onlyOwner
       votePeriodDuration = d;
   }
 
   // ACTION FUNCTIONS
 
   /// @dev Check if the current timer has expired.
   function checkTimer() internal view returns (bool) {
       return (votePeriodEnd != 0 && block.timestamp > votePeriodEnd);
   }
 
   /// @dev Start staking period.
   function startVoteTimer() internal{
       votePeriodEnd = block.timestamp + votePeriodDuration;
   }
 
   /// @dev Stakes a bet on Leela or World for the game, called by user.
   function addStake(bool leelaSide) public payable nonReentrancy {
       require(msg.value >= minStake, 'Received ETH is less than min stake');
       if (!leelaSide) {
           unchecked {
               worldStakes[gameIndex][msg.sender] += msg.value;
               worldShares[gameIndex][msg.sender] += msg.value*initVal/worldPoolSize;
               totalWorldShares += msg.value*initVal/worldPoolSize;
               worldPoolSize += msg.value;
           }
       } else {
           unchecked {
               leelaStakes[gameIndex][msg.sender] += msg.value;
               leelaShares[gameIndex][msg.sender] += msg.value*initVal/leelaPoolSize;
               totalLeelaShares += msg.value*initVal/leelaPoolSize;
               leelaPoolSize += msg.value;
           }
       }
       if (!votersMap[gameIndex][msg.sender]){
           votersMap[gameIndex][msg.sender] = true;
           votersList[gameIndex].push(msg.sender);
       }
       emit stakeMade(msg.sender, leelaSide);
       bool timerOver= checkTimer();
       if (timerOver) {
           makeMove();
       }
   }
 
   /// @dev For voting on a move for the World
   function voteWorldMove(uint16 move) public nonReentrancy {
       // Skip if 0x1000, 0x2000, 0x3000 (request draw, accept draw, resign)
       require(move != 0, 'Invalid move'); // 0 == 0x0000
       require(voters[gameIndex][moveIndex][msg.sender] == 0, 'User already voted for this move index');
 
       if (move != 0x1000 && move != 0x2000 && move != 0x3000) {
           require(chess.checkMove(move), "Submitted invalid move.");
       }
 
       // Save the move if it's the first vote for the move
       if (movesToVotes[gameIndex][moveIndex][move] == 0) {
           registeredMoves[gameIndex][moveIndex].push(move);
       }
       // Increment vote count for the move
       movesToVotes[gameIndex][moveIndex][move] += worldStakes[gameIndex][msg.sender]+leelaStakes[gameIndex][msg.sender];
       voters[gameIndex][moveIndex][msg.sender] = move;
       emit voteMade(msg.sender, move);
       bool timerOver= checkTimer();
       if (timerOver) {
           makeMove();
       }
   }
 
   /// @dev allows anyone to call this function to play the next move(s) if the timer has ended.
   function callTimerOver() public {
       bool timerOver= checkTimer();
       if (timerOver) {
           makeMove();
       }
   }
 
   // /// @dev Commits Leela's move
   // function commitLeelaMove(uint16 move) public onlyOwner {
   //     leelaMoveUpdated = chess.moveIndex;
   //     leelaMove = move;
   // }
 
   /// @dev Get the most voted move for the World
   function getWorldMove() public view returns (uint16) {
       uint16 move; // default 0x0000
       // store vars in memory to minimize storage reads (SSLOAD)
       uint16[] memory registered = registeredMoves[gameIndex][moveIndex];
       uint256 maxVotes = 0;
       for (uint32 i = 0; i < registered.length;) {
           uint256 votes = movesToVotes[gameIndex][moveIndex][registered[i]];
           if (votes > maxVotes) {
               move = registered[i];
               maxVotes = votes;
           }
           unchecked {
               i++; // save gas since # of moves per moveIndex won't overflow 2^32-1
           }
       }
       return move;
   }
 
   /// @dev For executing the most voted move for the World
   function makeMove() internal nonReentrancy {
       uint16 worldMove = getWorldMove();
       uint16 _leelaMove = leela.getMove();
       leelaMove = _leelaMove;
       chess.playMove(
        worldMove
       );
       moveIndex++;
       uint8 isGameEnded = chess.checkEndgame();
       if (isGameEnded != 0){
           updateAccounts(false);
           emit movePlayed(worldMove, 0);
           emit gameEnd(false);
           resetGame();
           return;
       }
       chess.playMove(
           leelaMove
       );
       moveIndex++;
       emit movePlayed(worldMove, leelaMove);
       registeredMoves[gameIndex][moveIndex].push(worldMove);
       registeredMoves[gameIndex][moveIndex].push(leelaMove);
       isGameEnded = chess.checkEndgame();
       if (isGameEnded == 0){
           updateAccounts(true);
           resetGame();
           emit gameEnd(true);
           return;
       }
       startVoteTimer();
   }
  //TODO make the checkmove into a try function? chat with jdub
   /// @dev reset the game.
   function resetGame() internal{
       worldPoolSize = initVal;
       leelaPoolSize = initVal;
       gameIndex++;
       moveIndex = 0;
       leelaColor = !leelaColor;
       chess.initializeGame();
       leela.initializeLeela();
       emit gameStart(leelaColor);
       startVoteTimer();
   }
  
   function updateAccounts(bool leelaWon) internal {
       // TODO convert integers to floating numbers when appropriate
       mapping (address => uint256) storage winningAccounts = leelaWon ? leelaShares[gameIndex] : worldShares[gameIndex];
       uint256 totalShares = leelaWon? totalLeelaShares : totalWorldShares;
       address[] memory listVoters = votersList[gameIndex];
       for (uint i = 0;i<listVoters.length; i++){
           uint256 accountShares = winningAccounts[listVoters[i]];
           uint256 totalPayout = leelaPoolSize+worldPoolSize - 2*initVal;
           accountsPayable[msg.sender]+= accountShares* (totalPayout)/(totalShares);
       }
   }
   function claimPayout() public {
       // TODO not sure if this logic is correct
       uint payoutAmount;
       require(accountsPayable[msg.sender]>=payoutAmount);
       accountsPayable[msg.sender] -= payoutAmount;
       (bool sent, ) = msg.sender.call{value: payoutAmount}('');
       require(sent, 'Failed to send payout.');
       // don't need to emit an event bc the payout is sent over the blockchain
   }
 
   // for payable, leave as-is
   fallback() external payable {}
   receive() external payable {}
}
 

