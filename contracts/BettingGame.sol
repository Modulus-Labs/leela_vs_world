pragma solidity >=0.8.0;

import {Ownable} from '@openzeppelin/contracts/access/Ownable.sol';

import "./chess.sol";
import "./Utils.sol";

/// @title BettingGame
/// @dev Betting game contract for Leela Chess Zero vs. World
///      This contract is an individual game engine that includes the betting & payout logic.
contract BettingGame is Ownable {
    /// NOTE: Variables are laid out in this particular order to pack them
    //        in as little storage slots as possible. This saves gas!
    //        See https://docs.soliditylang.org/en/v0.8.0/internals/layout_in_storage.html
    //
    //        slot 1: 96 + 16 + 8 + 8 + 8 + 16 + 16 (88 left)
    //        ...

    /// @dev Minimum stake for a bet
    uint96 public minStake = 0.01 ether;

    uint16 public moveNumber = 0;

    /// @dev For reentrancy guard (use uint8 for gas saving & storage packing vs. bool)
    uint8 private locked = 0;

    /// @dev Game ended flag (0 for false, 1 for true)
    uint8 public gameEnded = 0;

    /// @dev Game winner flag (0 for the World, 1 for Leela, default 0) (enum is uint8)
    Side public gameWinner = Side.World;

    /// @dev Leela's move
    uint16 public leelaMove;

    /// @dev Last chess.moveIndex when Leela's move was updated.
    ///      Used to enforce makeMove to be called only after Leela commits a move after the World's move.
    uint16 public leelaMoveUpdated;

    /// @dev Stake period deadline (uint256 for convenience when using block.timestamp)
    uint256 public stakePeriodEnd;

    /// @dev Stake period duration, default 60 mins
    uint256 public stakePeriodDuration = 3600;

    /// @dev Move period duration, default 5 mins
    uint256 public movePeriodDuration = 300;

    /// @dev World / Leela pool size (uint128 for storage packing)
    uint128 public worldPoolSize;
    uint128 public leelaPoolSize;

    /// @dev User bets on the World / Leela. Private to keep stake size only visible to each user.
    mapping(address => uint96) private worldBets;
    mapping(address => uint96) private leelaBets;

    // mapping(uint256 => uint256) validMoves; // not sure what this was intended for

    /// @dev Commited moves from the Chess contract, both the World & Leela.
    uint16[] public moves;

    /// @dev moveIndex maps to a mapping of key: move (uint16, valid only) & value: # of votes.
    ///      Limited to 2^16-1 = 65535 votes per move option per moveIndex.
    mapping(uint16 => mapping(uint16 => uint16)) public worldMoves;

    /// @dev moveIndex maps to a dynamic array of all moves voted for the World.
    ///      Used to iterate through worldMoves
    mapping(uint16 => uint16[]) registeredWorldMoves;

    /// @dev Keeping track of who voted on what move for the World.
    mapping(uint16 => mapping(address => uint16)) public worldMoveVoters;

    /// @dev Chess board contract
    Chess public chess;

    modifier nonReentrancy() {
        require(locked == 0, 'ReentrancyGuard: reentrant call');
        locked = 1;
        _;
        locked = 0;
    }

    modifier onlyDuringStakePeriod() {
        require(block.timestamp < stakePeriodEnd, 'Stake period has ended');
        _;
    }

    modifier onlyAfterStakingPeriod() {
        require(stakePeriodEnd != 0 && block.timestamp >= stakePeriodEnd, 'Stake period has not ended or initiated');
        _;
    }

    modifier onlyStaker() {
        require(worldBets[msg.sender] > 0 || leelaBets[msg.sender] > 0, 'Must stake some bet first');
        _;
    }

    modifier canPayout() {
        require(gameEnded, 'Game has not ended');
        _;
    }

    constructor(address _chess) {
        chess = Chess(_chess);
        chess.initializeGame();
    }

    /// @dev Modify staking duration.
    function setStakePeriod(uint256 d) public onlyOwner {
        stakePeriodDuration = d;
    }

    /// @dev Start staking period, can be called multiple times to delay the end of staking period.
    function startStake() public onlyOwner {
        stakePeriodEnd = block.timestamp + stakePeriodDuration;
    }

    /// @dev Stakes a bet on Leela or World for the game, called by user.
    ///      Only allows bet on one side for each user.
    /// @todo: Only ETH stake or any ERC-20 as well? Below impl is only ETH
    function addStake(Side side) public payable nonReentrancy onlyDuringStakePeriod {
        require(msg.value >= minStake, 'Received ETH is less than min stake');

        // Unchecked because user won't have enough ETH to overflow
        if (side == Side.World) {
            require(leelaBets[msg.sender] == 0, 'User already bet on other side');
            unchecked { 
                worldBets[msg.sender] += msg.value;
                worldPoolSize += msg.value;
            }
        } else {
            require(worldBets[msg.sender] == 0, 'User already bet on other side');
            unchecked {
                leelaBets[msg.sender] += msg.value;
                leelaPoolSize += msg.value;
            }
        }
    }

    /// @dev For voting on a move for the World
    /// TODO: Should we give more voting weight for users with more stake? (stake-dependent voting weight)
    ///       Should we let ONLY the users who staked on the World vote? (because Leela stakers are biased for Leela)
    function voteWorldMove(uint16 move) public nonReentrancy onlyStaker {
        require(move != 0, 'Invalid move'); // 0 == 0x0000
        require(worldMoveVoters[idx][msg.sender] == 0, 'User already voted for this move index');

        // Verify the move is valid, reverts if invalid.
        // Skip if 0x1000, 0x2000, 0x3000 (request draw, accept draw, resign)
        if (move != 0x1000 && move != 0x2000 && move != 0x3000) {
            verifyPlayMove(chess.gameState, move, chess.world_state, chess.leela_state, true);
        }

        uint16 idx = chess.moveIndex; // store in memory to reduce SSLOAD

        // Save the move if it's the first vote for the move
        if (worldMoves[idx][move] == 0) {
            registeredWorldMoves[idx].push(move);
        }

        // Increment vote count for the move
        worldMoves[idx][move] += 1;
        worldMoveVoters[idx][msg.sender] = move;
    }

    /// @dev Commits Leela's move
    function commitLeelaMove(uint16 move) public onlyOwner {
        leelaMoveUpdated = chess.moveIndex;
        leelaMove = move;
    }

    /// @dev Get the most voted move for the World
    function getWorldMove() public view returns (uint16) {
        uint16 move; // default 0x0000

        // store vars in memory to minimize storage reads (SSLOAD)
        uint16 idx = chess.moveIndex;
        uint16[] memory registeredMoves = registeredWorldMoves[idx];
        uint16 maxVotes = 0;

        for (uint32 i = 0; i < registeredMoves.length;) {
            uint16 votes = worldMoves[idx][registeredMoves[i]];
            if (votes > maxVotes) {
                move = registeredMoves[i];
                maxVotes = votes;
            } else if (votes == maxVotes) {
                // TODO: tie breaker logic
                // ...
            }
            unchecked {
                i++; // save gas since # of moves per moveIndex won't overflow 2^32-1
            }
        }

        // TODO: Find the mapping from Move index to the actual move accepted by the Chess contract

        // No need to check if move is valid here, since it's already been checked in voteWorldMove
        return move;
    }

    function getLeelaMove() public view returns (uint16) {
        require(leelaMoveUpdated >= chess.moveIndex, 'Leela has not committed a move yet');
        return leelaMove;
    }

    /// @dev For executing the most voted move for the World
    /// NOTE: side 0 is the World, 1 is Leela
    function makeMove(Side side) public nonReentrancy {
        bool isWorld = side == Side.World;
        uint16 move = isWorld ? getWorldMove() : getLeelaMove();

        // uint256 gameState, uint16 move, uint32 playerState, uint32 opponentState, bool currentPlayerLeela
        chess.playMove(
            chess.gameState,
            move,
            isWorld ? chess.world_state : chess.leela_state,
            isWorld ? chess.leela_state : chess.world_state,
            !isWorld
        );

        moves.push(move);

        if (chess.gameEnded) {
            endGame(chess.gameWinner);
        }
    }

    function endGame(Side winner) public onlyOwner {
        gameEnded = 1;
    }

    function claimPayout() public canPayout {
        uint payoutAmount;
        // Must cast to uint256 to avoid overflow when multiplying in uint128 or uint96
        if (gameWinner == Side.World) {
            require(worldBets[msg.sender] != 0, 'User did not bet on World');
            payoutAmount = uint(worldBets[msg.sender]) * uint(leelaPoolSize) / uint(worldPoolSize);
            worldBets[msg.sender] = 0;
        } else {
            require(leelaBets[msg.sender] != 0, 'User did not bet on Leela');
            payoutAmount = uint(leelaBets[msg.sender]) * uint(worldPoolSize) / uint(leelaPoolSize);
            leelaBets[msg.sender] = 0;
        }
        
        (bool sent, ) = msg.sender.call{value: payoutAmount}('');
        require(sent, 'Failed to send payout');
    }

    // for payable, leave as-is
    fallback() external payable {}
    receive() external payable {}
}
