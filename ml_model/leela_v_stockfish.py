import badgyal
import chess
import chess.engine
import os
from tqdm import tqdm

# from torchinfo import summary

# --------- General constants ---------
NUM_GAMES_PLAYED = 100

# --------- Stockfish stuff ---------
STOCKFISH_BINARY_PATH = os.path.join("./stockfish")
STOCKFISH_TARGET_ELO = 1850

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


def eval(net: badgyal.AbstractNet, board: chess.Board, model_name: str):
  # policy, value = net.eval(board, softmax_temp=1.61)
  policy, _ = net.eval(board, softmax_temp=1, name=model_name)
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
                   leela_model: badgyal.AbstractNet,
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


def get_stockfish_move(board: chess.Board,
                       stockfish_engine: chess.engine.SimpleEngine,
                       stockfish_target_elo: int,
                       verbose: bool = False):
  """
  Literally just an abstraction to avoid some duplicate code.
  """
  result = stockfish_engine.play(board, chess.engine.Limit(time=0.5))
  if verbose:
    print(f"Stockfish ({stockfish_target_elo} ELO) moves: {result.move}")
  return result.move


def play_game(leela_model: badgyal.AbstractNet,
              leela_model_name: str,
              stockfish_engine: chess.engine.SimpleEngine,
              stockfish_target_elo: int = STOCKFISH_TARGET_ELO,
              leela_move_first: bool = False,
              verbose: bool = False):
  """
  Plays a single game between Leela model and provided
  Stockfish engine and reports the winner.
  """
  board = chess.Board()
  move_number = 0

  # --- To store history ---
  move_history = list()
  white_move_history = list()
  black_move_history = list()

  while not board.is_game_over():

    # --- Game state ---
    if verbose:
      print("---" * 10 + f" MOVE {move_number} " + "---" * 10)
      print_leela_chessboard(board)

    # --- White moves ---
    white_move = None
    if leela_move_first:
      white_move = get_leela_move(board, leela_model, leela_model_name,
                                  verbose)
    else:
      white_move = get_stockfish_move(board, stockfish_engine,
                                      stockfish_target_elo, verbose)

    # --- Store the move ---
    board.push(white_move)
    move_history.append(white_move)
    white_move_history.append(white_move)

    if board.is_game_over():
      break

    # --- Black moves ---
    black_move = None
    if leela_move_first:
      black_move = get_stockfish_move(board, stockfish_engine,
                                      stockfish_target_elo, verbose)
    else:
      black_move = get_leela_move(board, leela_model, leela_model_name,
                                  verbose)

    # --- Store the move ---
    board.push(black_move)
    move_history.append(black_move)
    black_move_history.append(black_move)

    move_number += 1

  if verbose:
    print(f"Outcome: {board.outcome()}")
    print(f"Winner: " + board.outcome().result())
    print_leela_chessboard(board)

  return board, move_history, white_move_history, black_move_history


def report_results(all_outcomes: list[chess.Outcome], leela_model_name: str,
                   stockfish_target_elo: int):
  """
  Simple reporting for a set of games.
  """
  print(
      f"============ Results: Leela ({leela_model_name}) v Stockfish ({stockfish_target_elo}) for {len(all_outcomes)} games ============"
  )


def main():

  # -------- Stockfish stuff --------
  stockfish_engine = chess.engine.SimpleEngine.popen_uci(STOCKFISH_BINARY_PATH)
  stockfish_target_elo = STOCKFISH_TARGET_ELO
  stockfish_options = {
      "UCI_LimitStrength": True,
      "UCI_Elo": stockfish_target_elo,
      "Use NNUE": False,
  }
  stockfish_engine.configure(stockfish_options)

  # --- Leela shenanigans ---
  leela_model_name = "bgnet"
  leela_model = badgyal.BGNet(cuda=True)
  # model = badgyal.GGNet(cuda=False)
  # model = badgyal.LENet(cuda=False)
  # model = badgyal.BGTorchNet(cuda=False)
  # model = badgyal.BGXLTorchNet(cuda=False)
  # model = badgyal.LETorchNet(cuda=False)
  # model = badgyal.MENet(cuda=False)
  # model = badgyal.MGNet(cuda=False)

  # --- Run the main loop ---
  all_outcomes = list()
  all_move_histories = list()
  for game_number in tqdm(range(NUM_GAMES_PLAYED)):

    # --- Leela plays white for half and black for the other half of games ---
    leela_move_first = False
    if game_number < NUM_GAMES_PLAYED // 2:
      leela_move_first = True
    final_board, move_history, _, _ = play_game(leela_model, leela_model_name,
                                                stockfish_engine,
                                                stockfish_target_elo,
                                                leela_move_first)
    all_outcomes.append(final_board.outcome())
    all_move_histories.append(move_history)

  # --- Report results ---


if __name__ == "__main__":
  main()
