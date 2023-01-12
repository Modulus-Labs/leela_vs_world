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
import {
  BOARD_0,
  BOARD_1,
} from '../pageElements/arcadeGame/ChessBoard/ChessBoardDefaults';
import {
  ChessBoardData,
  ChessColumnMapping,
  ChessPiece,
  ChessPieceMapping,
  ChessRow,
} from '../types/Chess.type';
import ChessTestArtifact from '../contracts/ChessTest.json';
import { useSigner } from 'wagmi';

interface ChessGameContextInterface {
  selectedChessBoard: ChessBoardData;
  getChessBoardFromContract: () => Promise<void>;

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
  const { data: signer } = useSigner();

  const ChessTestContract = new Contract(
    CHESS_TEST_CONTRACT_ADDRESS,
    ChessTestArtifact.abi,
    signer || undefined
  );

  const [currChessBoard, setCurrChessBoard] = useState<ChessBoardData>(BOARD_0);
  const [prevChessBoards, setPrevChessBoards] = useState<ChessBoardData[]>([
    BOARD_0,
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

  useEffect(() => {
    if (signer) {
      getChessBoardFromContract();
    }
  }, [signer]);

  // Temporarily sets the test chess contract to be the most recent prev chess game
  const getChessBoardFromContract = async () => {
    try {
      const gameState = (await ChessTestContract.getGameState()) as BigNumber[];
      let newBoard: ChessBoardData = [];
      for (let i = 0; i < gameState.length; i++) {
        if (gameState[i].eq('0')) continue;
        const chessPiece = ChessPieceMapping[gameState[i].toString()];
        const row = (((Math.floor(i / 8) + 8) % 8) + 1) as ChessRow;
        const column = ChessColumnMapping[i % 8];
        newBoard.push({
          chessPiece,
          row,
          column,
        });
      }
      console.log(newBoard);
      console.log(gameState);
      const newPrevChessBoards = [...prevChessBoards];
      newPrevChessBoards[0] = newBoard;
      setPrevChessBoards([...newPrevChessBoards]);
    } catch (error) {
      console.log(error);
    }
  };

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

  // --- Simulations ---

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
      const chosenChessPiece = newCurrChessBoard[chessPieceNum];
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
      newCurrChessBoard[chessPieceNum] = chosenChessPiece;
      setCurrChessBoard([...newCurrChessBoard]);
      setTurnNum(turnNum + 1);
    }, 250);

    return () => clearInterval(movePawnInterval);
  });

  // --------------

  return (
    <ChessGameContext.Provider
      value={{
        selectedChessBoard,

        getChessBoardFromContract,

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
