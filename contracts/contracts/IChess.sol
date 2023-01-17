pragma solidity >=0.8.0;

interface IChess {
    function setBetting(address _betting) external;

    function initializeGame() external;

    function convertToCircuit() external returns(uint256 [][][] memory);

    function playMove(uint16 move) external;

    function checkMove(uint16 move) external view returns (bool);

    function verifyExecutePawnMove(uint256 gameState, uint16 move, bool currentTurnBlack, uint32 playerState, uint32 opponentState)
    external pure returns (uint256 newGameState, uint32 newPlayerState);

    function verifyExecuteKnightMove(uint256 gameState, uint8 fromPos, uint8 toPos, bool currentTurnBlack)
    external pure
    returns (uint256);

    function verifyExecuteBishopMove(uint256 gameState, uint8 fromPos, uint8 toPos, bool currentTurnBlack)
    external pure
    returns (uint256);

    function verifyExecuteRookMove(uint256 gameState, uint8 fromPos, uint8 toPos, bool currentTurnBlack)
    external pure
    returns (uint256);

    function verifyExecuteQueenMove(uint256 gameState, uint8 fromPos, uint8 toPos, bool currentTurnBlack)
    external pure
    returns (uint256);

    function verifyExecuteKingMove(uint256 gameState, uint8 fromPos, uint8 toPos, bool currentTurnBlack, uint32 playerState)
    external pure
    returns (uint256 newGameState, uint32 newPlayerState);

    function checkQueenValidMoves(uint256 gameState, uint8 fromPos, uint32 playerState, bool currentTurnBlack)
    external pure
    returns (bool);

    function checkBishopValidMoves(uint256 gameState, uint8 fromPos, uint32 playerState, bool currentTurnBlack)
    external pure
    returns (bool);

    function checkRookValidMoves(uint256 gameState, uint8 fromPos, uint32 playerState, bool currentTurnBlack)
    external pure
    returns (bool);

    function checkKnightValidMoves(uint256 gameState, uint8 fromPos, uint32 playerState, bool currentTurnBlack)
    external pure
    returns (bool);

    function checkPawnValidMoves(uint256 gameState, uint8 fromPos, uint32 playerState, uint32 opponentState, bool currentTurnBlack)
    external pure
    returns (bool);

    function checkKingValidMoves(uint256 gameState, uint8 fromPos, uint32 playerState, bool currentTurnBlack)
    external pure
    returns (bool);

    function searchPiece(uint256 gameState, uint32 playerState, uint32 opponentState, uint8 color, uint16 pBitOffset, uint16 bitSize)
    external pure
    returns (bool);

    function checkEndgame()
    external view
    returns (uint8);

    function getInBetweenMask(uint8 fromPos, uint8 toPos)
    external pure
    returns (uint256);

    function getPositionMask(uint8 pos)
    external pure
    returns (uint256);

    function getHorizontalMovement(uint8 fromPos, uint8 toPos)
    external pure
    returns (uint8);

    function getVerticalMovement(uint8 fromPos, uint8 toPos)
    external pure
    returns (uint8);

    function checkForCheck(uint256 gameState, uint32 playerState) external pure returns (bool);

    function pieceUnderAttack(uint256 gameState, uint8 pos) external pure returns (bool);

    function commitMove(uint256 gameState, uint8 fromPos, uint8 toPos) external pure returns (uint256 newGameState);

    function zeroPosition(uint256 gameState, uint8 pos) external pure returns (uint256);

    function setPosition(uint256 gameState, uint8 pos, uint8 piece) external pure returns (uint256);

    function pieceAtPosition(uint256 gameState, uint8 pos) external pure returns (uint8);


}

