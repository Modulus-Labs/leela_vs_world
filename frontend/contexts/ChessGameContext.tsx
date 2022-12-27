import {
  createContext,
  Dispatch,
  ReactNode,
  SetStateAction,
  useContext,
  useEffect,
  useState,
} from 'react';
import {
  BOARD_0,
  BOARD_1,
} from '../pageElements/arcadeGame/ChessBoard/ChessBoardDefaults';
import { ChessBoardData, ChessPiece } from '../types/Chess.type';

interface ChessGameContextInterface {
  selectedChessBoard: ChessBoardData;

  canKeepGoingBackInHistory: () => boolean;
  goBackOneBoardInHistory: () => void;

  canKeepGoingForwardInHistory: () => boolean;
  goForwardOneBoardInHistory: () => void;
}

const ChessGameContext = createContext<ChessGameContextInterface | undefined>(
  undefined
);

export const ChessGameContextProvider = ({
  children,
}: {
  children: ReactNode;
}) => {
  const [currChessBoard, setCurrChessBoard] = useState<ChessBoardData>(BOARD_0);
  const [prevChessBoards, setPrevChessBoards] = useState<ChessBoardData[]>([
    BOARD_1,
  ]);

  // 0 = current chess board
  // 1,2,3,... = prev chess boards
  const [selectedChessBoardIndex, setSelectedChessBoardIndex] = useState(0);
  const [selectedChessBoard, setSelectedChessBoard] =
    useState<ChessBoardData>(currChessBoard);

  const [turnNum, setTurnNum] = useState(0);

  // When the selected board index changes, set the corresponding chess board data
  useEffect(() => {
    if (selectedChessBoardIndex === 0) {
      setSelectedChessBoard(currChessBoard);
    } else {
      setSelectedChessBoard(prevChessBoards[selectedChessBoardIndex - 1]);
    }
  }, [selectedChessBoardIndex]);

  // Move pawns up and down one space
  useEffect(() => {
    // 8 - 15 B_PAWN
    // 24 - 31 W_PAWN
    const movePawnInterval = setInterval(() => {
      let chessPieceNum = Math.floor(turnNum % 16);
      if (chessPieceNum % 2 === 0) {
        chessPieceNum = chessPieceNum / 2 + 8;
      } else {
        chessPieceNum = (chessPieceNum - 1) / 2 + 24;
      }
      const newCurrChessBoard = currChessBoard;
      const chosenChessPiece = newCurrChessBoard[chessPieceNum as ChessPiece];
      switch (chosenChessPiece.row) {
        case 2:
          chosenChessPiece.row = 3;
          break;
        case 3:
          chosenChessPiece.row = 2;
          break;
        case 6:
          chosenChessPiece.row = 7;
          break;
        case 7:
          chosenChessPiece.row = 6;
          break;
      }
      newCurrChessBoard[chessPieceNum as ChessPiece] = chosenChessPiece;
      setCurrChessBoard({ ...newCurrChessBoard });
      setTurnNum(turnNum + 1);
    }, 250);

    return () => clearInterval(movePawnInterval);
  });

  const canKeepGoingBackInHistory = (): boolean => {
    // (prevChessBoards.length + 1) == number of chess boards including current chess board
    return selectedChessBoardIndex < prevChessBoards.length + 1 - 1;
  };

  // Note going back one board in history means incrementing the index
  // This allows for index 0 to always be the current game being played
  const goBackOneBoardInHistory = () => {
    if (canKeepGoingBackInHistory()) {
      setSelectedChessBoardIndex(selectedChessBoardIndex + 1);
    }
  };

  const canKeepGoingForwardInHistory = (): boolean => {
    return selectedChessBoardIndex > 0;
  };

  // Note going forward one board in history means decrementing the index
  // This allows for index 0 to always be the current game being played
  const goForwardOneBoardInHistory = () => {
    if (canKeepGoingForwardInHistory()) {
      setSelectedChessBoardIndex(selectedChessBoardIndex - 1);
    }
  };

  return (
    <ChessGameContext.Provider
      value={{
        selectedChessBoard,

        canKeepGoingBackInHistory,
        goBackOneBoardInHistory,

        canKeepGoingForwardInHistory,
        goForwardOneBoardInHistory,
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
