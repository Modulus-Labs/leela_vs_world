pragma solidity >=0.7.6;

contract LeelaBetting {

    address private owner;

    uint256 public poolSize;
    uint256 public minStake;
    uint public timerStart;
    bool public isEnd;
    bool public teamWorld;
    bool public teamLeela;
    uint256 public moveNumber = 0;
    uint256 private gameNumber = 0;
    mapping(address => uint256) accountStaked;
    mapping(uint256 => uint256) validMoves;
    mapping(address => uint256) private worldBets;
    mapping(address => uint256) private leelaBets;
    
    //Only owner can withraw from this contract
    modifier onlyOwner() {
        require(msg.sender == owner);
        _;
    }

    constructor() public {}

    function updateValidMoves() internal {}

    //Figure out how we want to verify sides
    function addStake(uint256 stake, bool isWorld, bool isLeela) internal {}

    //Figure out how we want to record moves
    //needs a variable type
    function makeVote() public {}

    function makeMoveHandler() internal {}

    function gameEndHandler() internal {}

    function checkTimerEnd(bool isEnd) internal {}

    function beginTimer() internal {}

    function checkTimerEnd() internal {}

    function payOut() public {}


}