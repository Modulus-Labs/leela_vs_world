pragma solidity >=0.8.0;

interface IChess {
    function setBetting(address _betting) external;

    function initializeGame() external;

    function convertToCircuit() external returns (uint256[112] memory);

    function playMove(uint16 move) external;

    function checkMove(uint16 move) external view returns (bool);

    function verifyExecutePawnMove(
        uint256 gameState,
        uint16 move,
        uint32 playerState,
        uint32 opponentState
    ) external view returns (uint256 newGameState, uint32 newPlayerState);

    function verifyExecuteKnightMove(
        uint256 gameState,
        uint8 fromPos,
        uint8 toPos
    ) external view returns (uint256);

    function verifyExecuteBishopMove(
        uint256 gameState,
        uint8 fromPos,
        uint8 toPos
    ) external view returns (uint256);

    function verifyExecuteRookMove(
        uint256 gameState,
        uint8 fromPos,
        uint8 toPos
    ) external view returns (uint256);

    function verifyExecuteQueenMove(
        uint256 gameState,
        uint8 fromPos,
        uint8 toPos
    ) external view returns (uint256);

    function verifyExecuteKingMove(
        uint256 gameState,
        uint8 fromPos,
        uint8 toPos,
        uint32 playerState
    ) external view returns (uint256 newGameState, uint32 newPlayerState);

    function checkQueenValidMoves(
        uint256 gameState,
        uint8 fromPos,
        uint32 playerState
    )
        external
        view
        returns (
            bool,
            uint16[] memory,
            uint8
        );

    function checkBishopValidMoves(
        uint256 gameState,
        uint8 fromPos,
        uint32 playerState
    )
        external
        view
        returns (
            bool,
            uint16[] memory,
            uint8
        );

    function checkRookValidMoves(
        uint256 gameState,
        uint8 fromPos,
        uint32 playerState
    )
        external
        view
        returns (
            bool,
            uint16[] memory,
            uint8
        );

    function checkKnightValidMoves(
        uint256 gameState,
        uint8 fromPos,
        uint32 playerState
    )
        external
        view
        returns (
            bool,
            uint16[] memory,
            uint8
        );

    function checkPawnValidMoves(
        uint256 gameState,
        uint8 fromPos,
        uint32 playerState,
        uint32 opponentState
    )
        external
        view
        returns (
            bool,
            uint16[] memory,
            uint8
        );

    function checkKingValidMoves(
        uint256 gameState,
        uint8 fromPos,
        uint32 playerState
    )
        external
        view
        returns (
            bool,
            uint16[] memory,
            uint8
        );

    function searchPiece(
        uint256 gameState,
        uint32 playerState,
        uint32 opponentState,
        // uint8 color,
        uint16 pBitOffset,
        uint16 bitSize
    ) external view returns (bool);

    function checkEndgame() external view returns (uint8);

    function getInBetweenMask(uint8 fromPos, uint8 toPos)
        external
        pure
        returns (uint256);

    function getPositionMask(uint8 pos) external pure returns (uint256);

    function getHorizontalMovement(uint8 fromPos, uint8 toPos)
        external
        pure
        returns (uint8);

    function getVerticalMovement(uint8 fromPos, uint8 toPos)
        external
        pure
        returns (uint8);

    //change back to pure
    function checkForCheck(uint256 gameState, uint32 playerState)
        external
        view
        returns (bool);

    //change back to pure
    function pieceUnderAttack(uint256 gameState, uint8 pos)
        external
        view
        returns (bool);

    function commitMove(
        uint256 gameState,
        uint8 fromPos,
        uint8 toPos
    ) external pure returns (uint256 newGameState);

    function zeroPosition(uint256 gameState, uint8 pos)
        external
        pure
        returns (uint256);

    function setPosition(
        uint256 gameState,
        uint8 pos,
        uint8 piece
    ) external pure returns (uint256);

    function pieceAtPosition(uint256 gameState, uint8 pos)
        external
        view
        returns (uint8);

    function getLegalMoves() external returns (uint16[] memory);
}
