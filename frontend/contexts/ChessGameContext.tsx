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
import { Chess, Square, Move, validateFen, Piece } from 'chess.js';
import { useContractInteractionContext } from './ContractInteractionContext';
import { convertUint16SquareToHumanRepr } from '../utils/helpers';

interface ChessGameContextInterface {
  // --- For stateful things ---
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
  useEffect(useCallback(() => {
    const chessStateRequest = getBoardStateFromChessContract();
    if (chessStateRequest !== null) {
      chessStateRequest.then(([boardState, whiteState, blackState, currentTurnBlack, gameIndex, moveIndex]) => {
        const fen = getFen(boardState.toHexString().substring(2), whiteState, blackState, currentTurnBlack, moveIndex + 1);
        console.log(`Got shenanigans: ${boardState.toHexString()}, ${whiteState}, ${blackState}, ${currentTurnBlack}, ${moveIndex}`);
        // console.log(`Successfully got fen ${fen} from the chess contract!`);
        // const newChessGame = new Chess(fen);
        // console.log(`New Chess game with FEN: ${newChessGame.fen()}`);
        // console.log(validateFen(fen));
        setCurrChessBoard({
          fen: fen,
          moveState: MOVE_STATE.IDLE,
          moveFrom: null,
          moveTo: null,
          validMoves: null,
          chessGame: new Chess(fen),
          moveIndex: moveIndex + 1,
        });

      }).catch((error: any) => {
        console.error(`Failed to get board state: ${error}`);
      });
    } else {
      console.error("Error: Board state from smart contract is null!");
    }
  }, []), []);

  // --- Set up listeners for when move is made ---
  useEffect(useCallback(() => {
    chessContract.removeAllListeners();
    chessContract.on(chessContract.filters.movePlayed(), (gameState, leelaState, worldState, leelaMove) => {
      const newFen = getFen(gameState.toHexString().substring(2), worldState, leelaState, !leelaMove, currChessBoard.moveIndex + 1);
      // console.log(`From listener got this FEN: ${newFen}`);
      // console.log(validateFen(newFen));
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

    // --- Hints ---
    // 07: Queenside rook at a1
    // 00: Kingside rook at h1
    // 03: King at e1
    // ff: Enpassant
    const whiteKingCorrectPos: boolean = ((whiteState >> 8) & 0xff) === 0x03;
    const whiteKingRookCorrectPos: boolean = ((whiteState >> 16) & 0xff) == 0x00;
    const whiteQueenRookCorrectPos: boolean = ((whiteState >> 24) & 0xff) == 0x07;

    // --- More hints ---
    // 3f: Queen-side rook at a8 position
    // 38: King-side rook at h8 position
    // 3b: King at e8 position
    // ff: En-passant at invalid position
    const blackKingCorrectPos = ((blackState >> 8) & 0xff) == 0x3b;
    const blackKingRookCorrectPos = ((blackState >> 16) & 0xff) == 0x38;
    const blackQueenRookCorrectPos = ((blackState >> 24) & 0xff) == 0x3f;

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
    let enPassant = (enPassantSquare == 0xff ? "-" : convertUint16SquareToHumanRepr(enPassantSquare));

    console.log(`Castling: ${castling} | En passant: ${enPassant}`);

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

    console.log(`Game state is: ${gameState}`);
    const remainder = 64 - gameState.length;
    // console.log(`Game state as hex is: ${Number.parseInt(gameState, 16)}`);

    // --- Processing the board itself ---
    let ret = "";
    for (let row = 0; row < 8; row++) {
      let numSpaces = 0;
      for (let col = 0; col < 8; col++) {

        // --- All the implicit zeroes ---
        if (row * 8 + col < remainder) {
          numSpaces += 1;
          if (numSpaces === 8) {
            ret += numSpaces.toString();
            numSpaces = 0;
          }
          continue;
        }

        // --- Regular shenanigans ---
        if (gameState.charAt(row * 8 + col - remainder) != '0' || numSpaces === 8) {
          if (numSpaces > 0) {
            ret += numSpaces.toString();
            numSpaces = 0;
          }
        } else {
          numSpaces += 1;
          continue;
        }

        // --- Piece stuff ---
        switch (gameState.charAt(row * 8 + col - remainder)) {
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
            ret += 'Q';
            break;
          case '6':
            ret += 'K';
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
            ret += 'q';
            break;
          case 'e':
            ret += 'k';
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
    console.log(`Ret so far 1: ${ret}`);

    // --- Whose turn it is ---
    const currMove = currentTurnBlack ? "b" : "w";
    ret += ' ' + currMove;
    console.log(`Ret so far 2: ${ret}`);

    // --- Castling privileges + enpassant square ---
    const [castling, enpassant] = computeCastlingAndEnPassant(whiteState, blackState, !currentTurnBlack);
    console.log(`Got this from computing: ${castling} | ${enpassant}`);
    ret += ' ' + castling;
    console.log(`Ret so far 3: ${ret}`);
    ret += ' ' + enpassant;
    console.log(`Ret so far 3.5: ${ret}`);

    // --- Halfmove clock ---
    // TODO(ryancao): Are we doing 50-move rule or not?
    ret += ' 0';
    console.log(`Ret so far 4: ${ret}`);

    // --- Fullmove index ---
    ret += ' ' + moveIndex.toString();

    console.log(`Ret so far 5: ${ret}`);
    return ret.toString();
  }

  const getInitialBoardState = () => {
    const initialGameState = "cbadeabc99999999000000000000000000000000000000001111111143256234";
    const initialWhiteState = 0x070003ff;
    const initialBlackState = 0x3f383bff;
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

  // --- Stateful things ---
  const [currChessBoard, setCurrChessBoard] = useState<BoardState>(getInitialBoardState);

  // --- The move index from the chess contract doesn't work ---
  // const [moveIndex, setMoveIndex] = useState<number>(1);

  /**
   * Determines whether we're diagonal to an enpassant square
   * @param attackerSquare 
   * @param enemySquare 
   * @returns 
   */
  const determineEnPassant = (attackerSquare: Square, enemySquare: Square): boolean => {
    return (Math.abs(attackerSquare.charCodeAt(0) - enemySquare.charCodeAt(0)) === 1 &&
      parseInt(attackerSquare.charAt(1)) === parseInt(enemySquare.charAt(1)));
  }

  const getEnPassantPawnDestSquare = (enemySquare: Square): Square => {
    return (enemySquare.charAt(0) + (parseInt(enemySquare.charAt(1)) + 1).toString()) as Square;
  }

  // Action to start a move
  const startMove = (square: Square) => {
    const rawcurrGameStateidMoves: Move[] = currChessBoard.chessGame.moves({
      square,
      verbose: true,
    }) as Move[];

    // --- En passant...? ---
    const whitePawn: Piece = {
      color: "w",
      type: "p",
    }
    const enPassantSquare = currChessBoard.fen.split(" ")[3];
    const pieceAtSquare = currChessBoard.chessGame.get(square);
    if (enPassantSquare !== "-" && pieceAtSquare.color === "w" && pieceAtSquare.type === "p" && determineEnPassant(square, enPassantSquare as Square)) {
      const enPassantMove: Move = {
        color: "w",
        from: square,
        to: getEnPassantPawnDestSquare(enPassantSquare as Square),
        piece: "p",
        flags: "",
        san: "",
      }
      console.log(enPassantMove);
      rawcurrGameStateidMoves.push(enPassantMove);
    }

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
