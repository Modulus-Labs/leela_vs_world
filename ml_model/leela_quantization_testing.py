# import badgyal
from badgyal_local import *
import chess
import chess.engine
import sunfish
import os

print(sunfish.A1)

# --------- Leela stuff ---------
PIECE_REPLACEMENTS = {
    'R': '♜',
    'N': '♞',
    'B': '♝',
    'Q': '♛',
    'K': '♚',
    'P': '♟',
    'r': '♖',
    'n': '♘',
    'b': '♗',
    'q': '♕',
    'k': '♔',
    'p': '♙',
    '.': '·'
}


def print_leela_chessboard(board: chess.Board):
  board_repr = board.__str__()
  for (k, v) in PIECE_REPLACEMENTS.items():
    board_repr = board_repr.replace(k, v)
  print(board_repr)


def eval(net: badgyal_local.abstractnet.AbstractNet, board: chess.Board, model_name: str):
  # policy, value = net.eval(board, softmax_temp=1.61)
  policy, _ = net.eval(board, softmax_temp=1, name=model_name)
  print(policy)
  # print(value)
  # for (move, value) in policy.items():
  #   print(f"{move}: {value}")
  leela_move, leela_est_value = max(policy.items(), key=lambda x: x[1])
  return leela_move, leela_est_value


# --------- Human stuff ---------
def get_legal_move(legal_moves: list[chess.Move]):
  player_move = None
  while player_move is None:
    raw_input_move = input("Your move (h for help) -> ")
    if raw_input_move.lower() == "h":
      print(f"All legal moves:")
      for legal_move in legal_moves:
        print(legal_move.uci())
    else:
      try:
        player_move = chess.Move.from_uci(raw_input_move)
        if player_move not in legal_moves:
          print(f"Error: {player_move} is not a legal move! Try again.\n")
          player_move = None
      except TypeError as t:
        print(f"Error while trying to parse move: {t}")
        player_move = None
  print(f"Playing {player_move}...")
  return player_move


def get_leela_move(board: chess.Board,
                   leela_model: badgyal_local.abstractnet.AbstractNet,
                   leela_model_name: str,
                   verbose: bool = False):
  """
  Literally just an abstraction to avoid some duplicate code.
  """
  if verbose:
    print_leela_chessboard(board)
  leela_move, _ = eval(leela_model, board, leela_model_name)
  if verbose:
    print(f"Leela moves: {leela_move}\n")
  leela_uci_move = chess.Move.from_uci(leela_move)
  return leela_uci_move


def main():

  # --- Leela shenanigans ---
  leela_model_name = "bgnet"
  leela_model = badgyal_local.bgnet.BGNet(cuda=True)
  leela_model.net.quantize_parameters()
  print(dir(leela_model.net))
  leela_model.net.export_to_json_for_halo2()
  exit()
  # model = badgyal_local.GGNet(cuda=False)
  # model = badgyal_local.LENet(cuda=False)
  # model = badgyal_local.BGTorchNet(cuda=False)
  # model = badgyal_local.BGXLTorchNet(cuda=False)
  # model = badgyal_local.LETorchNet(cuda=False)
  # model = badgyal_local.MENet(cuda=False)
  # model = badgyal_local.MGNet(cuda=False)

  board = chess.Board()
  eval(leela_model, board, leela_model_name)

if __name__ == "__main__":
  main()
