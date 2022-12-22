// SPDX-License-Identifier: UNLICENSED

pragma solidity ^0.7.6;
import "../libraries/SafeMath.sol";
import "../libraries/Math.sol";

contract Chess {
    using SafeMath for uint256;

    uint8 constant empty_const  = 0x0;
    uint8 constant pawn_const   = 0x1; // 001
    uint8 constant bishop_const = 0x2; // 010
    uint8 constant knight_const = 0x3; // 011
    uint8 constant rook_const   = 0x4; // 100
    uint8 constant queen_const  = 0x5; // 101
    uint8 constant king_const   = 0x6; // 110
    uint8 constant type_mask_const   = 0x7;
    uint8 constant color_const  = 0x8;

    uint8 constant piece_bit_size = 4;
    uint8 constant piece_pos_shift_bit = 2;

    uint32 constant en_passant_const   = 0x000000ff;
    uint32 constant king_pos_mask      = 0x0000ff00;
    uint32 constant king_pos_zero_mask = 0xffff00ff;
    uint16 constant king_pos_bit       = 8;
    /**
        @dev For castling masks, mask only the last bit of an uint8, to block any under/overflows.
     */
    uint32 constant rook_king_side_move_mask = 0x00800000;
    uint16 constant rook_king_side_move_bit = 16;
    uint32 constant rook_queen_side_move_mask = 0x80000000;
    uint16 constant rook_queen_side_move_bit = 24;
    uint32 constant king_move_mask   = 0x80800000;

    uint16 constant pieces_left_bit = 32;



    uint8 constant king_white_start_pos = 0x04;
    uint8 constant king_black_start_pos = 0x3c;

    uint16 constant pos_move_mask     = 0xfff;

    uint16 constant request_draw_const = 0x1000;
    uint16 constant accept_draw_const  = 0x2000;
    uint16 constant resign_const       = 0x3000;

    uint8 constant inconclusive_outcome = 0x0;
    uint8 constant draw_outcome      = 0x1;
    uint8 constant white_win_outcome = 0x2;
    uint8 constant black_win_outcome = 0x3;

    uint256 constant game_state_start =
        0xcbaedabc99999999000000000000000000000000000000001111111143265234;

    uint256 constant full_long_word_mask =
        0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff;

    uint256 constant invalid_move_constant =
        0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff;

    /** @dev    Initial white state:
                0f: 15 (non-king) pieces left
                00: Queen-side rook at a1 position
                07: King-side rook at h1 position
                04: King at e1 position
                ff: En-passant at invalid position
    */
    uint32 constant initial_white_state = 0x000704ff;

    /** @dev    Initial black state:
                0f: 15 (non-king) pieces left
                38: Queen-side rook at a8 position
                3f: King-side rook at h8 position
                3c: King at e8 position
                ff: En-passant at invalid position
    */
    uint32 constant initial_black_state = 0x383f3cff;

    constructor ()
    { }


    function checkGameFromStart(uint16[] memory moves)
    public pure
    returns (uint8, uint256, uint32, uint32)
    {
        return checkGame(game_state_start, initial_white_state, initial_black_state, false, moves);
    }

    /**
        @dev Calculates the outcome of a game depending on the moves from a starting position.
             Reverts when an invalid move is found.
        @param startingGameState Game state from which start the movements
        @param startingPlayerState State of the first playing player
        @param startingOpponentState State of the other playing player
        @param startingTurnBlack Whether the starting player is the black pieces
        @param moves is the input array containing all the moves in the game
        @return outcome can be 0 for inconclusive, 1 for draw, 2 for white winning, 3 for black winning
     */
    function checkGame(uint256 startingGameState,
                        uint32 startingPlayerState,
                        uint32 startingOpponentState,
                        bool startingTurnBlack,
                        uint16[] memory moves)
    public pure
    returns (uint8 outcome, uint256 gameState, uint32 playerState, uint32 opponentState)
    {
        gameState = startingGameState;

        playerState = startingPlayerState;
        opponentState = startingOpponentState;

        outcome = inconclusive_outcome;

        bool currentTurnBlack = startingTurnBlack;

        require(moves.length > 0, "inv moves");

        if (moves[moves.length - 1] == accept_draw_const) {
            // Check
            require(moves.length >= 2, "inv draw");
            require(moves[moves.length - 2] == request_draw_const, "inv draw");
            outcome = draw_outcome;
        } else if (moves[moves.length - 1] == resign_const) {
            // Assumes that signatures have been checked and moves are in correct order
            outcome = ((moves.length % 2) == 1) != currentTurnBlack ? black_win_outcome : white_win_outcome;
        } else {
            // Check entire game            
            for (uint256 i = 0; i < moves.length; i++)
            {
                (gameState, opponentState, playerState) = verifyExecuteMove(gameState, moves[i], playerState, opponentState, currentTurnBlack);
                require (!checkForCheck(gameState, opponentState), "inv check");
                //require (outcome == 0 || i == (moves.length - 1), "Excesive moves");
                currentTurnBlack = !currentTurnBlack;
            }
            uint8 endgameOutcome = checkEndgame(gameState, playerState, opponentState);
            if (endgameOutcome == 2) {
                outcome = currentTurnBlack ? white_win_outcome : black_win_outcome;
            } else if (endgameOutcome == 1) {
                outcome = draw_outcome;
            }

        }
    }

    /**
        @dev Calculates the outcome of a single move given the current game state.
             Reverts for invalid movement.
        @param gameState current game state on which to perform the movement.
        @param move is the move to execute: 16-bit var, high word = from pos, low word = to pos
                move can also be: resign, request draw, accept draw.
        @param currentTurnBlack true if it's black turn
        @return newGameState the new game state after it's executed.
     */
    function verifyExecuteMove(uint256 gameState, uint16 move, uint32 playerState, uint32 opponentState, bool currentTurnBlack)
    public pure
    returns (uint256 newGameState, uint32 newPlayerState, uint32 newOpponentState)
    {
        // TODO: check resigns and other stuff first
        uint8 fromPos = (uint8)((move >> 6) & 0x3f);
        uint8 toPos   = (uint8)(move & 0x3f);
        // uint8 moveExtra   = (uint8)(move >> 12);
        require(fromPos != toPos, "inv move stale");
        uint8 fromPiece = pieceAtPosition(gameState, fromPos);
        require(((fromPiece & color_const) > 0) == currentTurnBlack, "inv move color");
        uint8 fromType = fromPiece & type_mask_const;
        newPlayerState = playerState;
        newOpponentState = opponentState;
        if (fromType == pawn_const)
        {
            (newGameState, newPlayerState) =
                verifyExecutePawnMove(gameState, fromPos, toPos, (uint8)(move >> 12), currentTurnBlack, playerState, opponentState);
        }
        else if (fromType == knight_const)
        {
            newGameState = verifyExecuteKnightMove(gameState, fromPos, toPos, currentTurnBlack);
        }
        else if (fromType == bishop_const)
        {
            newGameState = verifyExecuteBishopMove(gameState, fromPos, toPos, currentTurnBlack);
        }
        else if (fromType == rook_const)
        {
            newGameState = verifyExecuteRookMove(gameState, fromPos, toPos, currentTurnBlack);
            // Reset playerState if necessary when one of the rooks move
            if (fromPos == (uint8)(playerState >> rook_king_side_move_bit)) {
                newPlayerState =  playerState | rook_king_side_move_mask;
            } else if (fromPos == (uint8)(playerState >> rook_queen_side_move_bit)) {
                newPlayerState =  playerState | rook_queen_side_move_mask;
            }
        }
        else if (fromType == queen_const)
        {
            newGameState = verifyExecuteQueenMove(gameState, fromPos, toPos, currentTurnBlack);
        }
        else if (fromType == king_const)
        {
            (newGameState, newPlayerState) = verifyExecuteKingMove(gameState, fromPos, toPos, currentTurnBlack, playerState);
        }
        else
        {
            revert("inv move type");
        }
        require(newGameState != invalid_move_constant, "inv move");
        if ( toPos == (opponentState & en_passant_const) ) {
            if ( currentTurnBlack ) {
                newGameState = zeroPosition(newGameState, toPos + 8);
            } else {
                newGameState = zeroPosition(newGameState, toPos - 8);
            }
        }
        newOpponentState = opponentState | en_passant_const;
    }

    /**
        @dev Calculates the outcome of a single move of a pawn given the current game state.
             Returns invalid_move_constant for invalid movement.
        @param gameState current game state on which to perform the movement.
        @param fromPos is position moving from.
        @param toPos is position moving to.
        @param currentTurnBlack true if it's black turn
        @return newGameState the new game state after it's executed.
     */
    function verifyExecutePawnMove(uint256 gameState, uint8 fromPos, uint8 toPos, uint8 moveExtra, bool currentTurnBlack, uint32 playerState, uint32 opponentState)
    public pure
    returns (uint256 newGameState, uint32 newPlayerState)
    {
        newPlayerState = playerState;
        // require ((currentTurnBlack && (toPos < fromPos)) || (!currentTurnBlack && (fromPos < toPos)), "inv move");
        if (currentTurnBlack != (toPos < fromPos)) {
            // newGameState = invalid_move_constant;
            return (invalid_move_constant, 0x0);
        }
        uint8 diff = (uint8)(Math.max(fromPos, toPos) - Math.min(fromPos, toPos));
        uint8 pieceToPosition = pieceAtPosition(gameState, toPos);
        
        if (diff == 8 || diff == 16) {
            if (pieceToPosition != 0) {
                //newGameState = invalid_move_constant;
                return (invalid_move_constant, 0x0);
            }
            if (diff == 16) {
                if ((currentTurnBlack && ((fromPos >> 3) != 0x6)) ||
                        (!currentTurnBlack && ((fromPos >> 3) != 0x1))) {
                            return (invalid_move_constant, 0x0);
                        }
                uint8 posToInBetween = toPos > fromPos ? fromPos + 8 : toPos + 8;
                if (pieceAtPosition(gameState, posToInBetween) != 0) {
                    return (invalid_move_constant, 0x0);
                }
                newPlayerState = (newPlayerState & (~en_passant_const)) | (uint32)(posToInBetween);
            }
        } else if (diff == 7 || diff == 9) {
            if (getVerticalMovement(fromPos, toPos) != 1) {
                return (invalid_move_constant, 0x0);
            }
            if ((uint8)(opponentState & en_passant_const) != toPos) {
                if ((pieceToPosition == 0) || // Must be moving to occupied square
                    (currentTurnBlack == ((pieceToPosition & color_const) == color_const))  // Must be different color
                    ) {
                    return (invalid_move_constant, 0x0);
                }
            }
        } else return (invalid_move_constant, 0x0);

        newGameState = commitMove(gameState, fromPos, toPos);
        if ((currentTurnBlack && ((toPos >> 3) == 0x0)) || (!currentTurnBlack && ((toPos >> 3) == 0x7))) {
            // Promotion
            require ((moveExtra == bishop_const) || (moveExtra == knight_const) ||
                     (moveExtra == rook_const) || (moveExtra == queen_const), "inv prom");
            newGameState = setPosition(zeroPosition(newGameState, toPos), toPos, currentTurnBlack ? moveExtra | color_const : moveExtra);
        }

    }

    /**
        @dev Calculates the outcome of a single move of a knight given the current game state.
             Returns invalid_move_constant for invalid movement.
        @param gameState current game state on which to perform the movement.
        @param fromPos is position moving from.
        @param toPos is position moving to.
        @param currentTurnBlack true if it's black turn
        @return newGameState the new game state after it's executed.
     */
    function verifyExecuteKnightMove(uint256 gameState, uint8 fromPos, uint8 toPos, bool currentTurnBlack)
    public pure
    returns (uint256)
    {
        uint8 pieceToPosition = pieceAtPosition(gameState, toPos);
        if (pieceToPosition > 0) {
            if (((pieceToPosition & color_const ) == color_const) == currentTurnBlack ) {
                return invalid_move_constant;
            }
        }
        uint8 h = getHorizontalMovement(fromPos, toPos);
        uint8 v = getVerticalMovement(fromPos, toPos);
        if (!((h == 2 && v == 1) || (h == 1 && v == 2))) {
            return invalid_move_constant;
        }
        return commitMove(gameState, fromPos, toPos);
    }

    /**
        @dev Calculates the outcome of a single move of a bishop given the current game state.
             Returns invalid_move_constant for invalid movement.
        @param gameState current game state on which to perform the movement.
        @param fromPos is position moving from.
        @param toPos is position moving to.
        @param currentTurnBlack true if it's black turn
        @return newGameState the new game state after it's executed.
     */
    function verifyExecuteBishopMove(uint256 gameState, uint8 fromPos, uint8 toPos, bool currentTurnBlack)
    public pure
    returns (uint256)
    {
        uint8 pieceToPosition = pieceAtPosition(gameState, toPos);
        if (pieceToPosition > 0) {
            if ( ((pieceToPosition & color_const ) == color_const) == currentTurnBlack ) {
                return invalid_move_constant;
            }
        }
        uint8 h = getHorizontalMovement(fromPos, toPos);
        uint8 v = getVerticalMovement(fromPos, toPos);
        if (( h != v ) || ( (gameState & getInBetweenMask(fromPos, toPos)) != 0x00 )) {
            return invalid_move_constant;
        }
        return commitMove(gameState, fromPos, toPos);
    }

    /**
        @dev Calculates the outcome of a single move of a rook given the current game state.
             Returns invalid_move_constant for invalid movement.
        @param gameState current game state on which to perform the movement.
        @param fromPos is position moving from.
        @param toPos is position moving to.
        @param currentTurnBlack true if it's black turn
        @return newGameState the new game state after it's executed.
     */
    function verifyExecuteRookMove(uint256 gameState, uint8 fromPos, uint8 toPos, bool currentTurnBlack)
    public pure
    returns (uint256)
    {
        uint8 pieceToPosition = pieceAtPosition(gameState, toPos);
        if (pieceToPosition > 0) {
            if ( ((pieceToPosition & color_const ) == color_const) == currentTurnBlack ) {
                return invalid_move_constant;
            }
        }
        uint8 h = getHorizontalMovement(fromPos, toPos);
        uint8 v = getVerticalMovement(fromPos, toPos);
        if(((h > 0) == (v > 0)) || (gameState & getInBetweenMask(fromPos, toPos)) != 0x00) {
            return invalid_move_constant;
        }
        return commitMove(gameState, fromPos, toPos);
    }

    /**
        @dev Calculates the outcome of a single move of the queen given the current game state.
             Returns invalid_move_constant for invalid movement.
        @param gameState current game state on which to perform the movement.
        @param fromPos is position moving from.
        @param toPos is position moving to.
        @param currentTurnBlack true if it's black turn
        @return newGameState the new game state after it's executed.
     */
    function verifyExecuteQueenMove(uint256 gameState, uint8 fromPos, uint8 toPos, bool currentTurnBlack)
    public pure
    returns (uint256)
    {
        uint8 pieceToPosition = pieceAtPosition(gameState, toPos);
        if (pieceToPosition > 0) {
            if ( ((pieceToPosition & color_const ) == color_const) == currentTurnBlack ) {
                return invalid_move_constant;
            }
        }
        uint8 h = getHorizontalMovement(fromPos, toPos);
        uint8 v = getVerticalMovement(fromPos, toPos);
        if (((h != v) && (h != 0) && (v != 0)) || (gameState & getInBetweenMask(fromPos, toPos)) != 0x00) {
            return invalid_move_constant;
        }
        return commitMove(gameState, fromPos, toPos);
    }

    /**
        @dev Calculates the outcome of a single move of the king given the current game state.
             Returns invalid_move_constant for invalid movement.
        @param gameState current game state on which to perform the movement.
        @param fromPos is position moving from. Behavior is undefined for values >= 0x40.
        @param toPos is position moving to. Behavior is undefined for values >= 0x40.
        @param currentTurnBlack true if it's black turn
        @return newGameState the new game state after it's executed.
     */
    function verifyExecuteKingMove(uint256 gameState, uint8 fromPos, uint8 toPos, bool currentTurnBlack, uint32 playerState)
    public pure
    returns (uint256 newGameState, uint32 newPlayerState)
    {
        newPlayerState = (playerState | king_move_mask) & king_pos_zero_mask | ((uint32)(toPos) << king_pos_bit);
        uint8 pieceToPosition = pieceAtPosition(gameState, toPos);
        if (pieceToPosition > 0) {
            if ( ((pieceToPosition & color_const ) == color_const) == currentTurnBlack ) {
                return (invalid_move_constant, newPlayerState);
            }
        }
        if (toPos >= 0x40 || fromPos >= 0x40)
            return (invalid_move_constant, newPlayerState);
        uint8 h = getHorizontalMovement(fromPos, toPos);
        uint8 v = getVerticalMovement(fromPos, toPos);
        if ((h <= 1) && (v <= 1)) {
            return (commitMove(gameState, fromPos, toPos), newPlayerState);
        } else if ((h == 2) && (v == 0))
        {
            if (!pieceUnderAttack(gameState, fromPos)) {
                // TODO: must we check king's 'from' position?
                // Reasoning: castilngRookPosition resolves to an invalid toPos when the rook or the king have already moved.
                uint8 castilngRookPosition = (uint8)(playerState >> rook_queen_side_move_bit);
                if ( castilngRookPosition + 2 == toPos ) { // Queen-side castling
                    // Spaces between king and rook original positions must be empty
                    if ((getInBetweenMask(castilngRookPosition, fromPos) & gameState) == 0) {
                        // Move King 1 space to the left and check for attacks (there must be none)
                        newGameState = commitMove(gameState, fromPos, fromPos - 1);
                        if (!pieceUnderAttack(newGameState, fromPos - 1)) {
                            return (commitMove(commitMove(newGameState, fromPos - 1, toPos), castilngRookPosition, fromPos - 1), newPlayerState);
                        }
                    }
                } else {
                    castilngRookPosition = (uint8)(playerState >> rook_king_side_move_bit);
                    if ( castilngRookPosition - 1 == toPos ) { // King-side castling
                        // Spaces between king and rook original positions must be empty
                        if ((getInBetweenMask(castilngRookPosition, fromPos) & gameState) == 0) {
                            // Move King 1 space to the left and check for attacks (there must be none)
                            newGameState = commitMove(gameState, fromPos, fromPos + 1);
                            if (!pieceUnderAttack(newGameState, fromPos + 1)) {
                                return (commitMove(commitMove(newGameState, fromPos + 1, toPos), castilngRookPosition, fromPos + 1), newPlayerState);
                            }
                        }
                    }
                }
            }
        }
        return (invalid_move_constant, 0x00);
    }

    function checkQueenValidMoves(uint256 gameState, uint8 fromPos, uint32 playerState, bool currentTurnBlack)
    public pure
    returns (bool)
    {
        uint256 newGameState;
        uint256 newPlayerState;
        uint8 toPos;
        uint8 kingPos = (uint8)(playerState >> king_pos_bit); /* Kings position cannot be affected by Queen's movement */

        // Check left
        for ( toPos =  fromPos - 1; (toPos & 0x7) < (fromPos & 0x7); toPos-- ) {
            newGameState = verifyExecuteQueenMove(gameState, fromPos, toPos, currentTurnBlack);
            if ((newGameState != invalid_move_constant) && (!pieceUnderAttack(newGameState, kingPos))) {
                return true;
            }
            if (((gameState >> (toPos << piece_pos_shift_bit)) & 0xF) != 0) break;
        }

        // Check right
        for ( toPos =  fromPos + 1; (toPos & 0x7) > (fromPos & 0x7); toPos++ ) {
            newGameState = verifyExecuteQueenMove(gameState, fromPos, toPos, currentTurnBlack);
            if ((newGameState != invalid_move_constant) && (!pieceUnderAttack(newGameState, kingPos))) {
                return true;
            }
            if (((gameState >> (toPos << piece_pos_shift_bit)) & 0xF) != 0) break;
        }

        // Check up
        for ( toPos = fromPos + 8; toPos < 0x40; toPos += 8 ) {
            newGameState = verifyExecuteQueenMove(gameState, fromPos, toPos, currentTurnBlack);
            if ((newGameState != invalid_move_constant) && (!pieceUnderAttack(newGameState, kingPos))) {
                return true;
            }
            if (((gameState >> (toPos << piece_pos_shift_bit)) & 0xF) != 0) break;
        }

        // Check down
        for ( toPos = fromPos - 8; toPos < fromPos; toPos -= 8 ) {
            newGameState = verifyExecuteQueenMove(gameState, fromPos, toPos, currentTurnBlack);
            if ((newGameState != invalid_move_constant) && (!pieceUnderAttack(newGameState, kingPos))) {
                return true;
            }
            if (((gameState >> (toPos << piece_pos_shift_bit)) & 0xF) != 0) break;
        }

        // Check up-right
        for ( toPos = fromPos + 9; (toPos < 0x40) && ((toPos & 0x7) > (fromPos & 0x7)); toPos += 9 ) {
            newGameState = verifyExecuteQueenMove(gameState, fromPos, toPos, currentTurnBlack);
            if ((newGameState != invalid_move_constant) && (!pieceUnderAttack(newGameState, kingPos))) {
                return true;
            }
            if (((gameState >> (toPos << piece_pos_shift_bit)) & 0xF) != 0) break;
        }

        // Check up-left
        for ( toPos = fromPos + 7; (toPos < 0x40) && ((toPos & 0x7) < (fromPos & 0x7)); toPos += 7 ) {
            newGameState = verifyExecuteQueenMove(gameState, fromPos, toPos, currentTurnBlack);
            if ((newGameState != invalid_move_constant) && (!pieceUnderAttack(newGameState, kingPos))) {
                return true;
            }
            if (((gameState >> (toPos << piece_pos_shift_bit)) & 0xF) != 0) break;
        }
        
        // Check down-right
        for ( toPos = fromPos - 7; (toPos < fromPos) && ((toPos & 0x7) > (fromPos & 0x7)); toPos -= 7 ) {
            newGameState = verifyExecuteQueenMove(gameState, fromPos, toPos, currentTurnBlack);
            if ((newGameState != invalid_move_constant) && (!pieceUnderAttack(newGameState, kingPos))) {
                return true;
            }
            if (((gameState >> (toPos << piece_pos_shift_bit)) & 0xF) != 0) break;
        }

        // Check down-left
        for ( toPos = fromPos - 9; (toPos < fromPos) && ((toPos & 0x7) < (fromPos & 0x7)); toPos -= 9 ) {
            newGameState = verifyExecuteQueenMove(gameState, fromPos, toPos, currentTurnBlack);
            if ((newGameState != invalid_move_constant) && (!pieceUnderAttack(newGameState, kingPos))) {
                return true;
            }
            if (((gameState >> (toPos << piece_pos_shift_bit)) & 0xF) != 0) break;
        }

        return false;
    }

    function checkBishopValidMoves(uint256 gameState, uint8 fromPos, uint32 playerState, bool currentTurnBlack)
    public pure
    returns (bool)
    {
        uint256 newGameState;
        uint256 newPlayerState;
        uint8 toPos;
        uint8 kingPos = (uint8)(playerState >> king_pos_bit); /* Kings position cannot be affected by Bishop's movement */

        // Check up-right
        for ( toPos = fromPos + 9; (toPos < 0x40) && ((toPos & 0x7) > (fromPos & 0x7)); toPos += 9 ) {
            newGameState = verifyExecuteBishopMove(gameState, fromPos, toPos, currentTurnBlack);
            if ((newGameState != invalid_move_constant) && (!pieceUnderAttack(newGameState, kingPos))) {
                return true;
            }
            if (((gameState >> (toPos << piece_pos_shift_bit)) & 0xF) != 0) break;
        }
        
        // Check up-left
        for ( toPos = fromPos + 7; (toPos < 0x40) && ((toPos & 0x7) < (fromPos & 0x7)); toPos += 7 ) {
            newGameState = verifyExecuteBishopMove(gameState, fromPos, toPos, currentTurnBlack);
            if ((newGameState != invalid_move_constant) && (!pieceUnderAttack(newGameState, kingPos))) {
                return true;
            }
            if (((gameState >> (toPos << piece_pos_shift_bit)) & 0xF) != 0) break;
        }
        
        // Check down-right
        for ( toPos = fromPos - 7; (toPos < fromPos) && ((toPos & 0x7) > (fromPos & 0x7)); toPos -= 7 ) {
            newGameState = verifyExecuteBishopMove(gameState, fromPos, toPos, currentTurnBlack);
            if ((newGameState != invalid_move_constant) && (!pieceUnderAttack(newGameState, kingPos))) {
                return true;
            }
            if (((gameState >> (toPos << piece_pos_shift_bit)) & 0xF) != 0) break;
        }
        
        // Check down-left
        for ( toPos = fromPos - 9; (toPos < fromPos) && ((toPos & 0x7) < (fromPos & 0x7)); toPos -= 9 ) {
            newGameState = verifyExecuteBishopMove(gameState, fromPos, toPos, currentTurnBlack);
            if ((newGameState != invalid_move_constant) && (!pieceUnderAttack(newGameState, kingPos))) {
                return true;
            }
            if (((gameState >> (toPos << piece_pos_shift_bit)) & 0xF) != 0) break;
        }

        return false;
    }

    function checkRookValidMoves(uint256 gameState, uint8 fromPos, uint32 playerState, bool currentTurnBlack)
    public pure
    returns (bool)
    {
        uint256 newGameState;
        uint256 newPlayerState;
        uint8 toPos;
        uint8 kingPos = (uint8)(playerState >> king_pos_bit); /* Kings position cannot be affected by Rook's movement */

        // Check left
        for ( toPos =  fromPos - 1; (toPos & 0x7) < (fromPos & 0x7); toPos-- ) {
            newGameState = verifyExecuteRookMove(gameState, fromPos, toPos, currentTurnBlack);
            if ((newGameState != invalid_move_constant) && (!pieceUnderAttack(newGameState, kingPos))) {
                return true;
            }
            if (((gameState >> (toPos << piece_pos_shift_bit)) & 0xF) != 0) break;
        }

        // Check right
        for ( toPos =  fromPos + 1; (toPos & 0x7) > (fromPos & 0x7); toPos++ ) {
            newGameState = verifyExecuteRookMove(gameState, fromPos, toPos, currentTurnBlack);
            if ((newGameState != invalid_move_constant) && (!pieceUnderAttack(newGameState, kingPos))) {
                return true;
            }
            if (((gameState >> (toPos << piece_pos_shift_bit)) & 0xF) != 0) break;
        }

        
        // Check up
        for ( toPos = fromPos + 8; toPos < 0x40; toPos += 8 ) {
            newGameState = verifyExecuteRookMove(gameState, fromPos, toPos, currentTurnBlack);
            
            if ((newGameState != invalid_move_constant) && (!pieceUnderAttack(newGameState, kingPos))) {
                return true;
            }
            if (((gameState >> (toPos << piece_pos_shift_bit)) & 0xF) != 0) break;
        }

        // Check down
        for ( toPos = fromPos - 8; toPos < fromPos; toPos -= 8 ) {
            newGameState = verifyExecuteRookMove(gameState, fromPos, toPos, currentTurnBlack);
            if ((newGameState != invalid_move_constant) && (!pieceUnderAttack(newGameState, kingPos))) {
                return true;
            }
            if (((gameState >> (toPos << piece_pos_shift_bit)) & 0xF) != 0) break;
        }

        return false;
    }

    function checkKnightValidMoves(uint256 gameState, uint8 fromPos, uint32 playerState, bool currentTurnBlack)
    public pure
    returns (bool)
    {
        uint256 newGameState;
        uint8 toPos;
        uint8 kingPos = (uint8)(playerState >> king_pos_bit); /* Kings position cannot be affected by knight's movement */

        toPos =  fromPos + 6;
        newGameState = verifyExecuteKnightMove(gameState, fromPos, toPos, currentTurnBlack);
        if ((newGameState != invalid_move_constant) && (!pieceUnderAttack(newGameState, kingPos))) {
            return true;
        }

        toPos =  fromPos - 6;
        newGameState = verifyExecuteKnightMove(gameState, fromPos, toPos, currentTurnBlack);
        if ((newGameState != invalid_move_constant) && (!pieceUnderAttack(newGameState, kingPos))) {
            return true;
        }

        toPos =  fromPos + 10;
        newGameState = verifyExecuteKnightMove(gameState, fromPos, toPos, currentTurnBlack);
        if ((newGameState != invalid_move_constant) && (!pieceUnderAttack(newGameState, kingPos))) {
            return true;
        }

        toPos =  fromPos - 10;
        newGameState = verifyExecuteKnightMove(gameState, fromPos, toPos, currentTurnBlack);
        if ((newGameState != invalid_move_constant) && (!pieceUnderAttack(newGameState, kingPos))) {
            return true;
        }

        toPos =  fromPos - 17;
        newGameState = verifyExecuteKnightMove(gameState, fromPos, toPos, currentTurnBlack);
        if ((newGameState != invalid_move_constant) && (!pieceUnderAttack(newGameState, kingPos))) {
            return true;
        }

        toPos =  fromPos + 17;
        newGameState = verifyExecuteKnightMove(gameState, fromPos, toPos, currentTurnBlack);
        if ((newGameState != invalid_move_constant) && (!pieceUnderAttack(newGameState, kingPos))) {
            return true;
        }

        toPos =  fromPos + 15;
        newGameState = verifyExecuteKnightMove(gameState, fromPos, toPos, currentTurnBlack);
        if ((newGameState != invalid_move_constant) && (!pieceUnderAttack(newGameState, kingPos))) {
            return true;
        }

        toPos =  fromPos - 15;
        newGameState = verifyExecuteKnightMove(gameState, fromPos, toPos, currentTurnBlack);
        if ((newGameState != invalid_move_constant) && (!pieceUnderAttack(newGameState, kingPos))) {
            return true;
        }
        
        return false;
    }

    function checkPawnValidMoves(uint256 gameState, uint8 fromPos, uint32 playerState, uint32 opponentState, bool currentTurnBlack)
    public pure
    returns (bool)
    {
        uint256 newGameState;
        uint8 toPos;
        uint8 moveExtra = queen_const; /* Since this is supposed to be endgame, movement of promoted piece is irrelevant. */
        uint8 kingPos = (uint8)(playerState >> king_pos_bit); /* Kings position cannot be affected by pawn's movement */

        toPos = currentTurnBlack ? fromPos - 7 : fromPos + 7;
        (newGameState, ) = verifyExecutePawnMove(gameState, fromPos, toPos, moveExtra, currentTurnBlack, playerState, opponentState);
        if ((newGameState != invalid_move_constant) && (!pieceUnderAttack(newGameState, kingPos))) {
            return true;
        }

        toPos = currentTurnBlack ? fromPos - 8 : fromPos + 8;
        (newGameState, ) = verifyExecutePawnMove(gameState, fromPos, toPos, moveExtra, currentTurnBlack, playerState, opponentState);
        if ((newGameState != invalid_move_constant) && (!pieceUnderAttack(newGameState, kingPos))) {
            return true;
        }

        toPos = currentTurnBlack ? fromPos - 9 : fromPos + 9;
        (newGameState, ) = verifyExecutePawnMove(gameState, fromPos, toPos, moveExtra, currentTurnBlack, playerState, opponentState);
        if ((newGameState != invalid_move_constant) && (!pieceUnderAttack(newGameState, kingPos))) {
            return true;
        }

        toPos = currentTurnBlack ? fromPos - 16 : fromPos + 16;
        (newGameState, ) = verifyExecutePawnMove(gameState, fromPos, toPos, moveExtra, currentTurnBlack, playerState, opponentState);
        if ((newGameState != invalid_move_constant) && (!pieceUnderAttack(newGameState, kingPos))) {
            return true;
        }

        return false;
    }

    function checkKingValidMoves(uint256 gameState, uint8 fromPos, uint32 playerState, bool currentTurnBlack)
    public pure
    returns (bool)
    {
        uint256 newGameState;
        uint8 toPos;

        toPos =  fromPos - 9;
        (newGameState, ) = verifyExecuteKingMove(gameState, fromPos, toPos, currentTurnBlack, playerState);
        if ((newGameState != invalid_move_constant) && (!pieceUnderAttack(newGameState, toPos))) {
            return true;
        }
        
        toPos =  fromPos - 8;
        (newGameState, ) = verifyExecuteKingMove(gameState, fromPos, toPos, currentTurnBlack, playerState);
        if ((newGameState != invalid_move_constant) && (!pieceUnderAttack(newGameState, toPos))) {
            return true;
        }

        toPos =  fromPos - 7;
        (newGameState, ) = verifyExecuteKingMove(gameState, fromPos, toPos, currentTurnBlack, playerState);
        if ((newGameState != invalid_move_constant) && (!pieceUnderAttack(newGameState, toPos))) {
            return true;
        }

        toPos =  fromPos - 1;
        (newGameState, ) = verifyExecuteKingMove(gameState, fromPos, toPos, currentTurnBlack, playerState);
        if ((newGameState != invalid_move_constant) && (!pieceUnderAttack(newGameState, toPos))) {
            return true;
        }

        toPos =  fromPos + 1;
        (newGameState, ) = verifyExecuteKingMove(gameState, fromPos, toPos, currentTurnBlack, playerState);
        if ((newGameState != invalid_move_constant) && (!pieceUnderAttack(newGameState, toPos))) {
            return true;
        }

        toPos =  fromPos + 7;
        (newGameState, ) = verifyExecuteKingMove(gameState, fromPos, toPos, currentTurnBlack, playerState);
        if ((newGameState != invalid_move_constant) && (!pieceUnderAttack(newGameState, toPos))) {
            return true;
        }


        toPos =  fromPos + 8;
        (newGameState, ) = verifyExecuteKingMove(gameState, fromPos, toPos, currentTurnBlack, playerState);
        if ((newGameState != invalid_move_constant) && (!pieceUnderAttack(newGameState, toPos))) {
            return true;
        }

        toPos =  fromPos + 9;
        (newGameState, ) = verifyExecuteKingMove(gameState, fromPos, toPos, currentTurnBlack, playerState);
        if ((newGameState != invalid_move_constant) && (!pieceUnderAttack(newGameState, toPos))) {
            return true;
        }
        /* TODO: Check castling */

        return false;
    }

    /**
        @dev Performs one iteration of recursive search for pieces. 
        @param gameState Game state from which start the movements
        @param playerState State of the player
        @param opponentState State of the opponent
        @return returns true if any of the pieces in the current offest has legal moves
     */
    function searchPiece(uint256 gameState, uint32 playerState, uint32 opponentState, uint8 color, uint16 pBitOffset, uint16 bitSize)
    public pure
    returns (bool)
    {
        if (bitSize > piece_bit_size) {
            uint16 newBitSize = bitSize / 2;
            uint256 m = ~(full_long_word_mask << newBitSize);
            uint256 h = (gameState >> (pBitOffset + newBitSize)) & m;            
            if (h != 0) {
                if (searchPiece(gameState, playerState, opponentState, color, pBitOffset + newBitSize, newBitSize)) {
                    return true;
                }
            }
            uint256 l = (gameState >> pBitOffset) & m;
            if (l != 0) {
                if (searchPiece(gameState, playerState, opponentState, color, pBitOffset, newBitSize)) {
                    return true;
                }
            }
        }
        else {
            uint8 piece = (uint8)((gameState >> pBitOffset) & 0xF);
            
            if ((piece > 0) && ((piece & color_const) == color)) {
                uint8 pos = uint8(pBitOffset / piece_bit_size);
                bool currentTurnBlack = color != 0;
                uint8 pieceType = piece & type_mask_const;
                if ((pieceType == king_const) && checkKingValidMoves(gameState, pos, playerState, currentTurnBlack)) {
                    return true;
                }
                else if ((pieceType == pawn_const) && checkPawnValidMoves(gameState, pos, playerState, opponentState, currentTurnBlack)) {
                    return true;
                }
                else if ((pieceType == knight_const) && checkKnightValidMoves(gameState, pos, playerState, currentTurnBlack)) {
                    return true;
                }
                else if ((pieceType == rook_const) && checkRookValidMoves(gameState, pos, playerState, currentTurnBlack)) {
                    return true;
                }
                else if ((pieceType == bishop_const) && checkBishopValidMoves(gameState, pos, playerState, currentTurnBlack)) {
                    return true;
                }
                else if ((pieceType == queen_const) && checkQueenValidMoves(gameState, pos, playerState, currentTurnBlack)) {
                    return true;
                }
            }
        }
        return false;
    }

    /**
        @dev Checks the endgame state and determines whether the last user is checkmate'd or
             stalemate'd, or neither.
        @param gameState Game state from which start the movements
        @param playerState State of the player
        @return outcome can be 0 for inconclusive/only check, 1 stalemate, 2 checkmate
     */
    function checkEndgame(uint256 gameState, uint32 playerState, uint32 opponentState)
    public pure
    returns (uint8) {
        uint8 kingPiece = (uint8)(gameState >> ((uint8)(playerState >> king_pos_bit) << piece_pos_shift_bit)) & 0xF;
        assert((kingPiece & (~color_const)) == king_const);
        bool legalMoves = searchPiece(gameState, playerState, opponentState, color_const & kingPiece, 0, 256);
        // If the player is in check but also 
        if (checkForCheck(gameState, playerState)) {
            return legalMoves ? 0 : 2;
        }
        return legalMoves ? 0 : 1;
    }

    /**
        @dev Gets the mask of the in-between squares.
             Basically it performs bit-shifts depending on the movement.
             Down: >> 8
             Up: << 8
             Right: << 1
             Left: >> 1
             UpRight: << 9
             DownLeft: >> 9
             DownRight: >> 7
             UpLeft: << 7
             Reverts for invalid movement.
        @param fromPos is position moving from.
        @param toPos is position moving to.
        @return mask of the in-between squares, can be bit-wise-and with the game state to check squares
     */
    function getInBetweenMask(uint8 fromPos, uint8 toPos)
    public pure
    returns (uint256)
    {
        uint8 h = getHorizontalMovement(fromPos, toPos);
        uint8 v = getVerticalMovement(fromPos, toPos);
        require ((h == v) || (h == 0) || (v == 0), "inv move");
        // TODO: Remove this getPositionMask usage
        uint256 startMask = getPositionMask(fromPos);
        uint256 endMask = getPositionMask(toPos);
        int8 x = (int8)(toPos & 0x7) - (int8)(fromPos & 0x7);
        int8 y = (int8)(toPos >> 3) - (int8)(fromPos >> 3);
        uint8 s = 0;
        if ( ((x > 0) && (y > 0)) || ((x < 0) && (y < 0))) s = 9 * 4;
        else if ((x == 0) && (y != 0)) s = 8 * 4;
        else if (((x > 0) && (y < 0)) || ((x < 0) && (y > 0))) s = 7 * 4;
        else if ((x != 0) && (y == 0)) s = 1 * 4;
        uint256 outMask = 0x00;
        while (endMask != startMask) {
            if (startMask < endMask) {
                startMask <<= s;
            } else {
                startMask >>= s;
            }
            if (endMask != startMask) outMask |= startMask;
        }
        return outMask;
    }

    /**
        @dev Gets the mask (0xF) of a square
        @param pos square position.
        @return mask
     */
    function getPositionMask(uint8 pos)
    public pure
    returns (uint256)
    {
        return (uint256)(0xF) << (((pos >> 3) & 0x7) * 32) + ((pos & 0x7) * 4);
    }

    function getHorizontalMovement(uint8 fromPos, uint8 toPos)
    public pure
    returns (uint8)
    {
        return (uint8)(Math.max(fromPos & 0x7, toPos & 0x7) - Math.min(fromPos & 0x7, toPos & 0x7));
    }

    function getVerticalMovement(uint8 fromPos, uint8 toPos)
    public pure
    returns (uint8)
    {
        return (uint8)(Math.max(fromPos >> 3, toPos >> 3) - Math.min(fromPos >> 3, toPos >> 3));
    }

    function checkForCheck(uint256 gameState, uint32 playerState)
    public pure
    returns (bool) {
        uint8 kingsPosition = (uint8)(playerState >> king_pos_bit);
        assert(king_const == (pieceAtPosition(gameState, kingsPosition) & 0x7));
        return pieceUnderAttack(gameState, kingsPosition);
    }

    
    function pieceUnderAttack(uint256 gameState, uint8 pos)
    public pure
    returns (bool) {
        uint8 currPiece = (uint8)(gameState >> (pos * piece_bit_size)) & 0xf;

        uint8 enemyPawn = pawn_const | ((currPiece & color_const) > 0 ? 0x0 : color_const);
        uint8 enemyBishop = bishop_const | ((currPiece & color_const) > 0 ? 0x0 : color_const);
        uint8 enemyKnight = knight_const | ((currPiece & color_const) > 0 ? 0x0 : color_const);
        uint8 enemyRook = rook_const | ((currPiece & color_const) > 0 ? 0x0 : color_const);
        uint8 enemyQueen = queen_const | ((currPiece & color_const) > 0 ? 0x0 : color_const);
        uint8 enemyKing = king_const | ((currPiece & color_const) > 0 ? 0x0 : color_const);

        currPiece = 0x0;

        uint8 currPos;
        bool firstSq;
        // Check up
        firstSq = true;
        currPos = pos + 8;
        while (currPos < 0x40) {
            currPiece = (uint8)(gameState >> (currPos * piece_bit_size)) & 0xf;
            if (currPiece > 0) {
                if (currPiece == enemyRook || currPiece == enemyQueen || (firstSq && (currPiece == enemyKing)))
                    return true;
                break;
            }
            currPos += 8;
            firstSq = false;
        }

        // Check down
        firstSq = true;
        currPos = pos - 8;
        while (currPos < pos) {
            currPiece = (uint8)(gameState >> (currPos * piece_bit_size)) & 0xf;
            if (currPiece > 0) {
                if (currPiece == enemyRook || currPiece == enemyQueen || (firstSq && (currPiece == enemyKing)))
                    return true;
                break;
            }
            currPos -= 8;
            firstSq = false;
        }

        // Check right
        firstSq = true;
        currPos = pos + 1;
        while ((pos >> 3) == (currPos >> 3)) {
            currPiece = (uint8)(gameState >> (currPos * piece_bit_size)) & 0xf;
            if (currPiece > 0) {
                if (currPiece == enemyRook || currPiece == enemyQueen || (firstSq && (currPiece == enemyKing)))
                    return true;
                break;
            }
            currPos += 1;
            firstSq = false;
        }

        // Check left
        firstSq = true;
        currPos = pos - 1;
        while ((pos >> 3) == (currPos >> 3)) {
            currPiece = (uint8)(gameState >> (currPos * piece_bit_size)) & 0xf;
            if (currPiece > 0) {
                if (currPiece == enemyRook || currPiece == enemyQueen || (firstSq && (currPiece == enemyKing)))
                    return true;
                break;
            }
            currPos -= 1;
            firstSq = false;
        }

        // Check up-right
        firstSq = true;
        currPos = pos + 9;
        while ((currPos < 0x40) &&  ((currPos & 0x7) > (pos & 0x7))) {
            currPiece = (uint8)(gameState >> (currPos * piece_bit_size)) & 0xf;
            if (currPiece > 0) {
                if (currPiece == enemyBishop || currPiece == enemyQueen ||
                    (firstSq && ((currPiece == enemyKing) || ((currPiece == enemyPawn) && ((enemyPawn & color_const) == color_const)) ) ) )
                    return true;
                break;
            }
            currPos += 9;
            firstSq = false;
        }
        // Check up-left
        firstSq = true;
        currPos = pos + 7;
        while ((currPos < 0x40) &&  ((currPos & 0x7) < (pos & 0x7))) {
            currPiece = (uint8)(gameState >> (currPos * piece_bit_size)) & 0xf;
            if (currPiece > 0) {
                if (currPiece == enemyBishop || currPiece == enemyQueen ||
                    (firstSq && ((currPiece == enemyKing) || ((currPiece == enemyPawn) && ((enemyPawn & color_const) == color_const)) ) ) )
                    return true;
                break;
            }
            currPos += 7;
            firstSq = false;
        }
        // Check down-right
        firstSq = true;
        currPos = pos - 7;
        while ((currPos < 0x40) &&  ((currPos & 0x7) > (pos & 0x7))) {
            currPiece = (uint8)(gameState >> (currPos * piece_bit_size)) & 0xf;
            if (currPiece > 0) {
                if (currPiece == enemyBishop || currPiece == enemyQueen ||
                    (firstSq && ((currPiece == enemyKing) || ((currPiece == enemyPawn) && ((enemyPawn & color_const) == 0x0))) ))
                    return true;
                break;
            }
            currPos -= 7;
            firstSq = false;
        }
        // Check down-left
        firstSq = true;
        currPos = pos - 9;
        while ((currPos < 0x40) &&  ((currPos & 0x7) < (pos & 0x7))) {
            currPiece = (uint8)(gameState >> (currPos * piece_bit_size)) & 0xf;
            if (currPiece > 0) {
                if (currPiece == enemyBishop || currPiece == enemyQueen ||
                    (firstSq && ((currPiece == enemyKing) || ((currPiece == enemyPawn) && ((enemyPawn & color_const) == 0x0))) ))
                    return true;
                break;
            }
            currPos -= 9;
            firstSq = false;
        }
        // Check knights
        // 1 right 2 up
        currPos = pos + 17;
        if ((currPos < 0x40) && ((currPos & 0x7) > (pos & 0x7)) && (((uint8)(gameState >> (currPos * piece_bit_size)) & 0xf) == enemyKnight))
            return true;
        // 1 left 2 up
        currPos = pos + 15;
        if ((currPos < 0x40) && ((currPos & 0x7) < (pos & 0x7)) && (((uint8)(gameState >> (currPos * piece_bit_size)) & 0xf) == enemyKnight))
            return true;
        // 2 right 1 up
        currPos = pos + 10;
        if ((currPos < 0x40) && ((currPos & 0x7) > (pos & 0x7)) && (((uint8)(gameState >> (currPos * piece_bit_size)) & 0xf) == enemyKnight))
            return true;
        // 2 left 1 up
        currPos = pos + 6;
        if ((currPos < 0x40) && ((currPos & 0x7) < (pos & 0x7)) && (((uint8)(gameState >> (currPos * piece_bit_size)) & 0xf) == enemyKnight))
            return true;

        // 1 left 2 down
        currPos = pos - 17;
        if ((currPos < pos) && ((currPos & 0x7) < (pos & 0x7)) && (((uint8)(gameState >> (currPos * piece_bit_size)) & 0xf) == enemyKnight))
            return true;

        // 2 left 1 down
        currPos = pos - 10;
        if ((currPos < pos) && ((currPos & 0x7) < (pos & 0x7)) && (((uint8)(gameState >> (currPos * piece_bit_size)) & 0xf) == enemyKnight))
            return true;

        // 1 right 2 down
        currPos = pos - 15;
        if ((currPos < pos) && ((currPos & 0x7) > (pos & 0x7)) && (((uint8)(gameState >> (currPos * piece_bit_size)) & 0xf) == enemyKnight))
            return true;
        // 2 right 1 down
        currPos = pos - 6;
        if ((currPos < pos) && ((currPos & 0x7) > (pos & 0x7)) && (((uint8)(gameState >> (currPos * piece_bit_size)) & 0xf) == enemyKnight))
            return true;

        return false;
    }

    /**
        @dev Commits a move into the game state. Validity of the move is not checked.
        @param gameState current game state
        @param fromPos is the position to move a piece from.
        @param toPos is the position to move a piece to.
        @return newGameState
     */
    function commitMove(uint256 gameState, uint8 fromPos, uint8 toPos)
    public pure
    returns (uint256 newGameState) {
        uint8 bitpos = fromPos * piece_bit_size;

        uint8 piece = (uint8)((gameState >> bitpos) & 0xF);
        newGameState = gameState & ~(0xF << bitpos);

        newGameState = setPosition(newGameState, toPos, piece);
    }

    /**
        @dev Zeroes out a piece position in the current game state.
             Behavior is undefined for position values greater than 0x3f
        @param gameState current game state
        @param pos is the position to zero out: 6-bit var, 3-bit word, high word = row, low word = column.
        @return newGameState
     */
    function zeroPosition(uint256 gameState, uint8 pos)
    public pure
    returns (uint256)
    {
        return gameState & ~(0xF << (pos * piece_bit_size));
    }

    /**
        @dev Sets a piece position in the current game state.
             Behavior is undefined for position values greater than 0x3f
        @param gameState current game state
        @param pos is the position to set the piece: 6-bit var, 3-bit word, high word = row, low word = column.
        @param piece to set, including color
        @return newGameState
     */
    function setPosition(uint256 gameState, uint8 pos, uint8 piece)
    public pure
    returns (uint256)
    {
        uint8 bitpos = pos * piece_bit_size;
        return gameState & ~(0xF << bitpos) | ((uint256)(piece) << bitpos);
    }

    /**
        @dev Gets the piece at a given position in the current gameState.
             Behavior is undefined for position values greater than 0x3f
        @param gameState current game state
        @param pos is the position to get the piece: 6-bit var, 3-bit word, high word = row, low word = column.
        @return piece value including color
     */
    function pieceAtPosition(uint256 gameState, uint8 pos)
    public pure
    returns (uint8)
    {
        return (uint8)((gameState >> (pos * piece_bit_size)) & 0xF);
    }
}