import chess
import numpy as np
import torch
from time import time
from math import exp
from badgyal_local.policy_index import policy_index
import re

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
    if ones:
        return np.append(planes, np.ones((1,8,8), dtype=np.float), axis=0)
    else:
        return np.append(planes, np.zeros((1,8,8), dtype=np.float), axis=0)

def board2planes(board_):

    print(f"In board2planes. Board is {board_}")
    exit()

    if not board_.turn:
        board = board_.mirror()
    else:
        board = board_

    retval = np.zeros((13, 8, 8), dtype=np.float)
    for row in range(8):
        for col in range(8):
            piece = str(board.piece_at(chess.SQUARES[row*8+col]))
            if piece != "None":
                #print(piece)
                DISPATCH[piece](retval, row, col)
                #print(retval)

    temp = np.copy(retval)
    for i in range(7):
        retval = np.append(retval, temp, axis=0)

    retval = append_plane(retval, bool(board.castling_rights & chess.BB_H1))
    retval = append_plane(retval, bool(board.castling_rights & chess.BB_A1))
    retval = append_plane(retval, bool(board.castling_rights & chess.BB_H8))
    retval = append_plane(retval, bool(board.castling_rights & chess.BB_A8))
    retval = append_plane(retval, not board_.turn)

    #a = np.full((1, 8, 8), board_.halfmove_clock, dtype=np.float)
    #retval = np.append(retval, a, axis=0)
    # half-move clock goes to zero
    retval = append_plane(retval, False)

    retval = append_plane(retval, False)
    retval = append_plane(retval, True)
    return(torch.from_numpy(np.expand_dims(retval, axis=0)).float())

def bulk_board2planes(boards):
    planes = []
    for b in boards:
        temp = board2planes(b)
        planes.append(temp)
    pl = tuple(planes)
    retval = torch.cat(pl, dim=0).contiguous()
    return retval

def policy2moves(board_, policy_tensor, softmax_temp = 1.61):
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
        p = policy[0][MOVE_MAP[fixed_uci]]
        retval[uci] = p
        if p > max_p:
            max_p = p
    total = 0.0
    for uci in retval:
        retval[uci] = exp((retval[uci]-max_p)/softmax_temp)
        total = total + retval[uci]

    if total > 0.0:
        for uci in retval:
            retval[uci] = retval[uci]/total
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
