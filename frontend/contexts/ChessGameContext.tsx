import { BigNumber, ethers } from 'ethers';
import {
  createContext,
  Dispatch,
  ReactNode,
  SetStateAction,
  useCallback,
  useContext,
  useEffect,
  useState,
} from 'react';
import {
  BoardState,
  IdleBoardState,
  MovedBoardState,
  MOVE_STATE,
  MovingBoardState,
} from '../types/Chess.type';
import { Chess, Square, Move, validateFen } from 'chess.js';
import { useContractInteractionContext } from './ContractInteractionContext';

interface ChessGameContextInterface {
  currChessBoard: BoardState;
  setCurrChessBoard: Dispatch<SetStateAction<BoardState>>;
  startMove: (square: Square) => void;
  endMove: (square: Square) => void;
  resetMove: () => void;

  // --- Public Functions ---
  getBoardStateFromChessContract: () => Promise<[BigNumber, number, number, boolean, number, number]>;
}

const ChessGameContext = createContext<ChessGameContextInterface | undefined>(
  undefined
);

export const ChessGameContextProvider = ({
  children,
}: {
  children: ReactNode;
}) => {

  // --- For contract-specific things ---
  const { chessContract } = useContractInteractionContext();

  // ------------------------ PUBLIC FUNCTIONS ------------------------
  /**
   * Calls the chess contract via ethers and reads the board state from it.
   */
  const getBoardStateFromChessContract = (): Promise<[BigNumber, number, number, boolean, number, number]> => {
    const chessGameStateRequest = chessContract.getChessGameState();

    // --- Grab result, feed back to caller ---
    return chessGameStateRequest;
  }

  // --- Load the actual board state in from the smart contract upon load ---
  useEffect(() => {
    const chessStateRequest = getBoardStateFromChessContract();
    if (chessStateRequest !== null) {
      chessStateRequest.then(([boardState, whiteState, blackState, currentTurnBlack, gameIndex, moveIndex]) => {
        const fen = getFen(boardState.toHexString().substring(2), whiteState, blackState, currentTurnBlack, moveIndex + 1);
        // console.log(`${boardState.toHexString()}, ${whiteState}, ${blackState}, ${currentTurnBlack}, ${moveIndex}`);
        // console.log(`Successfully got fen ${fen} from the chess contract!`);
        // const newChessGame = new Chess(fen);
        // console.log(`New Chess game with FEN: ${newChessGame.fen()}`);
        setCurrChessBoard({
          fen: fen,
          moveState: MOVE_STATE.IDLE,
          moveFrom: null,
          moveTo: null,
          validMoves: null,
          chessGame: new Chess(fen),
          moveIndex: moveIndex,
        });

      }).catch((error: any) => {
        console.error(`Failed to get board state: ${error}`);
      });
    } else {
      console.error("Error: Board state from smart contract is null!");
    }
  }, []);

  // --- Set up listeners for when move is made ---
  useEffect(useCallback(() => {
    chessContract.removeAllListeners();
    chessContract.on(chessContract.filters.movePlayed(), (gameState, leelaState, worldState, leelaMove) => {
      const newFen = getFen(gameState.toHexString().substring(2), worldState, leelaState, leelaMove, currChessBoard.moveIndex + 1);
      const newChessGame = new Chess(newFen);
      setCurrChessBoard((curChessBoard) => {
        return {
          fen: newFen,
          moveState: MOVE_STATE.IDLE,
          moveFrom: null,
          moveTo: null,
          validMoves: null,
          chessGame: newChessGame,
          moveIndex: curChessBoard.moveIndex + 1,
        }
      });
    })
  }, [chessContract]), [chessContract]);

  /**
   * Returns FEN string component representing castling privileges for black/white.
   * @param whiteState 
   * @param blackState 
   * @param currentTurnBlack 
   * @returns 
   */
  const computeCastlingAndEnPassant = (whiteState: number, blackState: number, currentTurnBlack: boolean): [string, string] => {
    const whiteKingCorrectPos: boolean = ((whiteState >> 8) & 0xff) === 0x04;
    const whiteKingRookCorrectPos: boolean = ((whiteState >> 16) & 0xff) == 0x07;
    const whiteQueenRookCorrectPos: boolean = ((whiteState >> 24) & 0xff) == 0x00;

    const blackKingCorrectPos = ((blackState >> 8) & 0xff) == 0x3c;
    const blackKingRookCorrectPos = ((blackState >> 16) & 0xff) == 0x3f;
    const blackQueenRookCorrectPos = ((blackState >> 24) & 0xff) == 0x38;

    let castling: string = "";
    if (whiteKingCorrectPos && whiteKingRookCorrectPos) {
      castling += "K";
    }
    if (whiteKingCorrectPos && whiteQueenRookCorrectPos) {
      castling += "Q";
    }
    if (blackKingCorrectPos && blackKingRookCorrectPos) {
      castling += "k";
    }
    if (blackKingCorrectPos && blackQueenRookCorrectPos) {
      castling += "q";
    }
    if (castling === "") {
      castling = "-";
    }

    let enPassantSquare: number = (currentTurnBlack ? blackState : whiteState) & 0xff;
    let enPassant = (enPassantSquare == 0xff ? "-" : enPassantSquare.toString(16));

    return [castling, enPassant];
  }

  /**
   * Returns the Forscythe-Edwards Notation for the current board state.
   * - 64 chars' worth of board state
   * - [b] or [w] based on whose turn it is
   * - Castling privileges KQkq (WHITE/black)
   * - En passant square
   * - Halfmove clock
   * - Fullmove number
   * @param gameState 
   * @param whiteState
   * @param blackState
   * @param currentTurnBlack
   * @param moveIndex
   * @returns 
   */
  const getFen = (gameState: string, whiteState: number, blackState: number, currentTurnBlack: boolean, moveIndex: number) => {

    // console.log(`Game state is: ${gameState}`);
    // console.log(`Game state as hex is: ${Number.parseInt(gameState, 16)}`);

    // --- Processing the board itself ---
    let ret = "";
    for (let c = 0; c < 8; c++) {
      let numSpaces = 0;
      for (let r = 0; r < 8; r++) {
        if (gameState.charAt(c * 8 + r) != '0') {
          if (numSpaces > 0) {
            ret += numSpaces.toString();
            numSpaces = 0;
          }
        } else {
          numSpaces += 1;
          continue;
        }
        switch (gameState.charAt(c * 8 + r)) {
          case '1':
            ret += 'P';
            break;
          case '2':
            ret += 'B';
            break;
          case '3':
            ret += 'N';
            break;
          case '4':
            ret += 'R';
            break;
          case '5':
            ret += 'K';
            break;
          case '6':
            ret += 'Q';
            break;
          case '9':
            ret += 'p';
            break;
          case 'a':
            ret += 'b';
            break;
          case 'b':
            ret += 'n';
            break;
          case 'c':
            ret += 'r';
            break;
          case 'd':
            ret += 'k';
            break;
          case 'e':
            ret += 'q';
            break;
        }
      }
      if (numSpaces > 0) {
        ret += numSpaces.toString();
        numSpaces = 0;
      }
      ret += '/';
    }
    ret = ret.slice(0, -1);

    // --- Whose turn it is ---
    const currMove = currentTurnBlack ? "b" : "w";
    ret += ' ' + currMove;

    // --- Castling privileges + enpassant square ---
    const [castling, enpassant] = computeCastlingAndEnPassant(whiteState, blackState, currentTurnBlack);
    ret += ' ' + castling;
    ret += ' ' + enpassant;

    // --- Halfmove clock ---
    // TODO(ryancao): Are we doing 50-move rule or not?
    ret += ' 0';

    // --- Fullmove index ---
    ret += ' ' + moveIndex.toString();

    return ret.toString();
  }

  const getInitialBoardState = () => {
    const initialGameState = "cbaedabc99999999000000000000000000000000000000001111111143265234";
    const initialWhiteState = 0x000704ff;
    const initialBlackState = 0x383f3cff;
    const initialFen = getFen(initialGameState, initialWhiteState, initialBlackState, false, 1);
    const ret: BoardState = {
      fen: initialFen,
      moveState: MOVE_STATE.IDLE,
      moveFrom: null,
      moveTo: null,
      validMoves: null,
      chessGame: new Chess(initialFen),
      moveIndex: 0,
    }
    return ret;
  };

  const [currChessBoard, setCurrChessBoard] = useState<BoardState>(getInitialBoardState);

  // Action to start a move
  const startMove = (square: Square) => {
    const rawcurrGameStateidMoves: Move[] = currChessBoard.chessGame.moves({
      square,
      verbose: true,
    }) as Move[];

    const newChessBoard = {
      ...currChessBoard,
      moveState: MOVE_STATE.MOVING,
      moveFrom: square,
      moveTo: null,
      validMoves: rawcurrGameStateidMoves.map((move) => move.to),
    } as MovingBoardState;

    setCurrChessBoard(newChessBoard);
  };

  // Action to end a move
  const endMove = (square: Square) => {
    const newChessBoard = {
      ...currChessBoard,
      moveState: MOVE_STATE.MOVED,
      validMoves: null,
      moveTo: square,
    } as MovedBoardState;

    setCurrChessBoard(newChessBoard);
  };

  // Action to reset the move
  const resetMove = () => {
    const newChessBoard = {
      ...currChessBoard,
      moveState: MOVE_STATE.IDLE,
      moveFrom: null,
      moveTo: null,
      validMoves: null,
    } as IdleBoardState;

    setCurrChessBoard(newChessBoard);
  };

  return (
    <ChessGameContext.Provider
      value={{
        currChessBoard,
        setCurrChessBoard,
        startMove,
        endMove,
        resetMove,
        getBoardStateFromChessContract
      }}
    >
      {children}
    </ChessGameContext.Provider>
  );
};

export const useChessGameContext = (): ChessGameContextInterface => {
  const context = useContext(ChessGameContext);
  if (context === undefined) {
    throw new Error('ChessGameContext must be within ChessGameContextProvider');
  }

  return context;
};
