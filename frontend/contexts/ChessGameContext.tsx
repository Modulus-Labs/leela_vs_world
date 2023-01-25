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

  const getFen = () => {
    // const currGameState = getCurrentChessBoard().toString(16);
    const currGameState = "cbaedabc99999999000000000000000000000000000000001111111143265234";
    // const leelaColor = getLeelaColor;
    const leelaColor = false; //false [=] leela is black
    // const leelaTurn = getTurn;
    const leelaTurn = false; //false [=] not leela turn
    // const moveIndex = getMoveIndex;
    const moveIndex = 1;
    const currMove = leelaColor == leelaTurn? 'w': 'b';
    let ret = "";
    for(let c = 0; c<8;c++) {
      let numSpaces = 0;
      for(let r = 0; r<8;r++) {
        if(currGameState.charAt(c*8+r) != '0') {
          console.log(currGameState.charAt(c*8+r),numSpaces);
          if(numSpaces>0) {
            console.log(numSpaces);
            ret+=numSpaces.toString();
            numSpaces = 0;
          }
        } else {
          numSpaces+=1;
          continue;
        }
        switch(currGameState.charAt(c*8+r)) {
          case '1':
            ret+='P';
            break;
          case '2':
            ret+='B';
            break;
          case '3':
            ret+='N';
            break;
          case '4':
            ret+='R';
            break;
          case '5':
            ret+='K';
            break;
          case '6':
            ret+='Q';
            break;
          case '9':
            ret+='p';
            break;
          case 'a':
            ret+='b';
            break;
          case 'b':
            ret+='n';
            break;
          case 'c':
            ret+='r';
            break;
          case 'd':
            ret+='k';
            break;
          case 'e':
            ret+='q';
            break;
        }
      }
      if(numSpaces>0) {
        console.log(numSpaces);
        ret+=numSpaces.toString();
        numSpaces = 0;
      }
      ret+='/';
    }
    ret = ret.slice(0,-1);
    ret+=' '+currMove;
    // need to deal with enpassant
    ret+=' '+'-';
    ret+=' '+'-';
    ret+=' 0';
    ret+=' '+moveIndex.toString();
    console.log(ret.toString());
    return ret.toString();
  }

  const [currChessBoard, setCurrChessBoard] = useState<BoardState>({
    fen: getFen(),
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
    const rawcurrGameStateidMoves: Move[] = chess.moves({
      square,
      verbose: true,
    }) as Move[];

    const newChessBoard = {
      ...currChessBoard,
      moveState: MOVE_STATE.MOVING,
      moveFrom: square,
      validMoves: rawcurrGameStateidMoves.map((move) => move.to),
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
