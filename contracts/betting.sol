pragma solidity >=0.7.6;
import {verifyMove} from "./chess.sol";
import "./redblack.sol";
import "./redblack.sol";

contract betting {
    using RedBlackTree for RedBlackTree.Tree;
    using Chess for Chess;
    RedBlackTree.Tree Tree;
    address private owner;

    uint256 public poolSize;

    uint256 public minStake;

    uint256 public timerStart;

    uint256 public moveNumber = 0;
    uint256 private gameNumber = 0;

    mapping(address => uint256) accountsToStake;
    mapping(uint256 => uint256) movesToVotes;
    mapping(address => uint256) private worldBets; // why is this private?
    mapping(address => uint256) private leelaBets; // why is this private?
    mapping(uint256 => uint256[]) private votesToMoves;
    constructor() public {}

    function updateValidMoves() internal {

    }

    //TODO: how do we want to verify sides?
    function addStake(uint256 stake, bool isWorld, bool isLeela) internal {}

    //TODO: how do we want to record moves? needs a variable type.
    function makeVote(uint256 move) public {
        uint256 stake = accountsToStake[sender.address]; // solidity dictionaries initialie everything to 0
        require(stake>=minStake, "Please buy some stake in the game.");
        bool validMove = verifyMove(move);
        require(validMove, "Please submit a valid move.");
        uint256 formerVotes = movesToVotes[move];
        movesToVotes[move] += stake;
        uint256[] movesFormerVotes = votesToMoves[formerVotes];
        for (uint i=0; i<studentList.length; i++) {

        }
        bool moveEnd = checkTimerEnd();
        if (moveEnd){
            moveEndHandler();
        }
        return true;
    }

    function makeMoveHandler() internal {
        uint topVotes = Tree.first();
        uint topMoves = votesToMoves[topVotes];
        uint topMove = topMoves[0];
        Chess.playMove(topMove, false);
        // bool isEndGame = Chess.checkEndgame(); if the move is played we should assume it was safe to do so.
    }

    function gameEndHandler() internal {}

    function checkTimerEnd() internal returns (bool){
        //gets current timestamp
        uint256 currTimestamp = block.timestamp;
        //checks 30 min in sec from start of timer
        if(currTimestamp >= (60*30)+timerStart){
            return true;
        } else return false;
    }

    function beginTimer() internal returns (uint256){
        //gets current timestamp
        uint256 lastBlockTimestamp = block.timestamp;
        //sets timer var
        return timerStart = lastBlockTimestamp;
    }

    function payOut() public {}


}