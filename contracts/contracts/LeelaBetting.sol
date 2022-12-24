pragma solidity >=0.7.6;


contract LeelaBetting {

    address private owner;

    uint256 public poolSize;
    uint256 public minStake;
    uint256 public timerStart;
    bool public isEnd;
    bool public teamWorld;
    bool public teamLeela;
    uint256 public moveNumber = 0;
    uint256 private gameNumber = 0;
    mapping(address => uint256) accountStaked;
    mapping(uint256 => uint256) validMoves;
    mapping(address => uint256) private worldBets;
    mapping(address => uint256) private leelaBets;

    constructor() public {}

    function updateValidMoves() internal {}

    //TODO: how do we want to verify sides?
    function addStake(uint256 stake, bool isWorld, bool isLeela) internal {}

    //TODO: how do we want to record moves? needs a variable type.
    function makeVote(bool _world, bool _leela) public {}

    function makeMoveHandler() internal {}

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