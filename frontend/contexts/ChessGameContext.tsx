import { BigNumber, Contract } from 'ethers';
import {
  createContext,
  Dispatch,
  ReactNode,
  SetStateAction,
  useContext,
  useEffect,
  useState,
} from 'react';
import { CHESS_TEST_CONTRACT_ADDRESS } from '../contracts/ContractAddresses';

import ChessTestArtifact from '../contracts/ChessTest.json';
import { useSigner } from 'wagmi';
import {
  BoardState,
  IdleBoardState,
  MovedBoardState,
  MOVE_STATE,
  MovingBoardState,
} from '../types/Chess.type';
import { Chess, Square, Move } from 'chess.js';

interface ChessGameContextInterface {
  currChessBoard: BoardState;
  startMove: (square: Square) => void;
  endMove: (square: Square) => void;
  resetMove: () => void;
}

const ChessGameContext = createContext<ChessGameContextInterface | undefined>(
  undefined
);

export const ChessGameContextProvider = ({
  children,
}: {
  children: ReactNode;
}) => {
  const { data: signer } = useSigner();

  const [currChessBoard, setCurrChessBoard] = useState<BoardState>({
    fen: 'rnbq1bnr/ppppkppp/4p3/8/8/4P3/PPPPKPPP/RNBQ1BNR w - - 2 3',
    moveState: MOVE_STATE.IDLE,
    moveFrom: null,
    moveTo: null,
    validMoves: null,
  });

  // Action to start a move
  const startMove = (square: Square) => {
    console.log('startMove', square);
    // FIXME: stop initializing so many Chess
    const chess = new Chess(currChessBoard.fen);
    const rawValidMoves: Move[] = chess.moves({
      square,
      verbose: true,
    }) as Move[];

    const newChessBoard = {
      ...currChessBoard,
      moveState: MOVE_STATE.MOVING,
      moveFrom: square,
      validMoves: rawValidMoves.map((move) => move.to),
    } as MovingBoardState;

    setCurrChessBoard({ ...newChessBoard });
  };

  // Action to end a move
  const endMove = (square: Square) => {
    const newChessBoard = {
      ...currChessBoard,
      moveState: MOVE_STATE.MOVED,
      validMoves: null,
      moveTo: square,
    } as MovedBoardState;

    setCurrChessBoard({ ...newChessBoard });
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

    setCurrChessBoard({ ...newChessBoard });
  };

  return (
    <ChessGameContext.Provider
      value={{
        currChessBoard,
        startMove,
        endMove,
        resetMove,
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
