import chess
import numpy as np
import torch
from time import time
from math import exp
from badgyal_local.policy_index import policy_index
import re

# --- Literally mapping all the moves "in order" with respect to their list index ---
MOVE_MAP = dict(list(zip(policy_index, range(len(policy_index)))))

WPAWN = chess.Piece(chess.PAWN, chess.WHITE)
WKNIGHT = chess.Piece(chess.KNIGHT, chess.WHITE)
WBISHOP = chess.Piece(chess.BISHOP, chess.WHITE)
WROOK = chess.Piece(chess.ROOK, chess.WHITE)
WQUEEN = chess.Piece(chess.QUEEN, chess.WHITE)
WKING = chess.Piece(chess.KING, chess.WHITE)
BPAWN = chess.Piece(chess.PAWN, chess.BLACK)
BKNIGHT = chess.Piece(chess.KNIGHT, chess.BLACK)
BBISHOP = chess.Piece(chess.BISHOP, chess.BLACK)
BROOK = chess.Piece(chess.ROOK, chess.BLACK)
BQUEEN = chess.Piece(chess.QUEEN, chess.BLACK)
BKING = chess.Piece(chess.KING, chess.BLACK)

def assign_piece(planes, piece_step, row, col):
    planes[piece_step][row][col] = 1

"""
Piece assignment to planes. Each plane is dedicated to its own piece type.
"""
DISPATCH = {}
DISPATCH[str(WPAWN)] = lambda retval, row, col: assign_piece(retval, 0, row, col)
DISPATCH[str(WKNIGHT)] = lambda retval, row, col: assign_piece(retval, 1, row, col)
DISPATCH[str(WBISHOP)] = lambda retval, row, col: assign_piece(retval, 2, row, col)
DISPATCH[str(WROOK)] = lambda retval, row, col: assign_piece(retval, 3, row, col)
DISPATCH[str(WQUEEN)] = lambda retval, row, col: assign_piece(retval, 4, row, col)
DISPATCH[str(WKING)] = lambda retval, row, col: assign_piece(retval, 5, row, col)
DISPATCH[str(BPAWN)] = lambda retval, row, col: assign_piece(retval, 6, row, col)
DISPATCH[str(BKNIGHT)] = lambda retval, row, col: assign_piece(retval, 7, row, col)
DISPATCH[str(BBISHOP)] = lambda retval, row, col: assign_piece(retval, 8, row, col)
DISPATCH[str(BROOK)] = lambda retval, row, col: assign_piece(retval, 9, row, col)
DISPATCH[str(BQUEEN)] = lambda retval, row, col: assign_piece(retval, 10, row, col)
DISPATCH[str(BKING)] = lambda retval, row, col: assign_piece(retval, 11, row, col)

MOVE_RE = re.compile(r"^([a-h])(\d)([a-h])(\d)(.*)$")

def dump(planes):
    for i in range(112):
        print(i)
        print(planes[0][i])

def mirrorMoveUCI(move):
    m = MOVE_RE.match(move)
    return "{}{}{}{}{}".format(m.group(1), 9-int(m.group(2)), m.group(3), 9-int(m.group(4)), m.group(5))

def mirrorMove(move):
    return chess.Move(chess.square_mirror(move.from_square), chess.square_mirror(move.to_square), move.promotion)

def append_plane(planes, ones):
    """
    Literally appends a plane of either all ones or all zeros
    """
    if ones:
        return np.append(planes, np.ones((1,8,8), dtype=np.float), axis=0)
    else:
        return np.append(planes, np.zeros((1,8,8), dtype=np.float), axis=0)

def board2planes(board_: chess.Board):

    if not board_.turn:
        board = board_.mirror()
    else:
        board = board_

    # --- (8 x 8 board, 6 pieces per side --> 12 pieces total ---
    # --- Not sure what the 13th channel is used for) ---
    retval = np.zeros((13, 8, 8), dtype=np.float)

    # Some bitwise integer format to compress chessboard
    # 11 --> 1011

    # --- TODO (optional but would be nice) ---
    # Write a @view Solidity conversion function from the
    # smart contract's internal board representation to the
    # representation that the neural net takes in

    # --- Step 1: Convert board to stack of indicator boards ---
    # For example, black pawns at the beginning of the game:
    # [
    #     [0, 0, 0, 0, 0, 0, 0, 0]
    #     [1, 1, 1, 1, 1, 1, 1, 1] --> just all of them in a row
    #     [0, 0, 0, 0, 0, 0, 0, 0]
    #     [0, 0, 0, 0, 0, 0, 0, 0]
    #     [0, 0, 0, 0, 0, 0, 0, 0]
    #     [0, 0, 0, 0, 0, 0, 0, 0]
    #     [0, 0, 0, 0, 0, 0, 0, 0]
    #     [0, 0, 0, 0, 0, 0, 0, 0]
    # ] * 13 (indicator boards for where each piece is)
    # --- See above (where DISPATCH is defined) for the piece/board ordering ---

    for row in range(8):
        for col in range(8):
            piece = str(board.piece_at(chess.SQUARES[row*8+col]))
            if piece != "None":
                #print(piece)
                DISPATCH[piece](retval, row, col)
                #print(retval)

    # --- Step 2: duplicate the entire thing 8 times and stack them ---
    # all on top of one another. 13 * 8 == 104
    temp = np.copy(retval)
    for i in range(7):
        retval = np.append(retval, temp, axis=0)

    # --- Step 3: Add castling and other indicators ---
    # Castling indicators: either all ones or all zeros based 
    # on whether that castling move is still legal, e.g.
    # [
    #     [1, 1, 1, 1, 1, 1, 1, 1]
    #     [1, 1, 1, 1, 1, 1, 1, 1]
    #     [1, 1, 1, 1, 1, 1, 1, 1]
    #     [1, 1, 1, 1, 1, 1, 1, 1]
    #     [1, 1, 1, 1, 1, 1, 1, 1]
    #     [1, 1, 1, 1, 1, 1, 1, 1]
    #     [1, 1, 1, 1, 1, 1, 1, 1]
    #     [1, 1, 1, 1, 1, 1, 1, 1]
    # ] OR 
    # [
    #     [0, 0, 0, 0, 0, 0, 0, 0]
    #     [0, 0, 0, 0, 0, 0, 0, 0]
    #     [0, 0, 0, 0, 0, 0, 0, 0]
    #     [0, 0, 0, 0, 0, 0, 0, 0]
    #     [0, 0, 0, 0, 0, 0, 0, 0]
    #     [0, 0, 0, 0, 0, 0, 0, 0]
    #     [0, 0, 0, 0, 0, 0, 0, 0]
    #     [0, 0, 0, 0, 0, 0, 0, 0]
    # ]

    # --- Append castling privileges + whose turn it is. 104 + 4 = 108 ---
    retval = append_plane(retval, bool(board.castling_rights & chess.BB_H1))
    retval = append_plane(retval, bool(board.castling_rights & chess.BB_A1))
    retval = append_plane(retval, bool(board.castling_rights & chess.BB_H8))
    retval = append_plane(retval, bool(board.castling_rights & chess.BB_A8))

    # --- Append whose turn it is (i.e. who Leela should play as) as an indicator "board"
    # 108 + 1 = 109
    retval = append_plane(retval, not board_.turn)

    # --- Their comments ---
    #a = np.full((1, 8, 8), board_.halfmove_clock, dtype=np.float)
    #retval = np.append(retval, a, axis=0)
    # half-move clock goes to zero
    # --- End their comments ---

    # --- Not sure what these things are... I'd just do exactly what they do here ---
    # 109 + 3 = 112
    retval = append_plane(retval, False) # --> Append an 8x8 of all zeros
    retval = append_plane(retval, False) # --> Append an 8x8 of all zeros
    retval = append_plane(retval, True) # --> Append an 8x8 of all ones

    # --- Final: (1, 112, 8, 8): (N, C, H, W) ---
    # --- Note that we actually need a flattened version of this, in
    # the format (C, W, H) for Nick's ZK stuff. I can explain that more
    # in detail if it doesn't make sense
    return(torch.from_numpy(np.expand_dims(retval, axis=0)).float())

def bulk_board2planes(boards):
    planes = []
    for b in boards:
        temp = board2planes(b)
        planes.append(temp)
    pl = tuple(planes)
    retval = torch.cat(pl, dim=0).contiguous()
    return retval

def policy2moves(board_: chess.Board, policy_tensor: torch.Tensor, softmax_temp = 1.61):
    if not board_.turn:
        board = board_.mirror()
    else:
        board = board_
    policy = policy_tensor.numpy()

    moves = list(board.legal_moves)
    retval = {}
    max_p = float("-inf")
    for m in moves:
        uci = m.uci()
        fixed_uci = uci
        #piece = str(board.piece_at(m.from_square))
        # fix the uci
        #if (piece == 'K') and (uci == "e1g1"):
        #    fixed_uci = "e1h1"
        #if (piece == 'K') and (uci == "e1c1"):
        #    fixed_uci = "e1a1"
        if (uci == "e1g1") and board.is_kingside_castling(m):
            fixed_uci = "e1h1"
        elif (uci == "e1c1") and board.is_queenside_castling(m):
            fixed_uci = "e1a1"
        if (uci[-1] == "n"):
            # we are promoting to knight, so trim the character
            fixed_uci = uci[0:-1]
        # now mirror the uci
        if not board_.turn:
            uci = mirrorMoveUCI(uci)

        # --- Looks like we literally go through the policy and find the associated "probability" ---
        p = policy[0][MOVE_MAP[fixed_uci]]
        retval[uci] = p
        if p > max_p:
            max_p = p

    # --- Eww a literal re-implementation of softmax for LEGAL moves ---
    # total = 0.0
    # for uci in retval:
    #     retval[uci] = exp((retval[uci]-max_p)/softmax_temp)
    #     total = total + retval[uci]

    # --- Normalization??? ---
    # if total > 0.0:
    #     for uci in retval:
    #         retval[uci] = retval[uci]/total
    return retval

if __name__ == "__main__":
    print(MOVE_MAP)

    board = chess.Board(fen="rnbqkb1r/ppp1pppp/5n2/3pP3/8/8/PPPP1PPP/RNBQKBNR w KQkq d6 0 3")

    start = time()
    REPS = 1

    for i in range(0,REPS):
        planes = board2planes(board)

    end = time()

    print(end-start)
    print((end-start)/REPS)
    print(planes.shape)
    #dump(planes)
