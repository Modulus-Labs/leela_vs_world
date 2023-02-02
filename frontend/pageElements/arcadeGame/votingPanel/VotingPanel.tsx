import { FC, MouseEventHandler, useState } from 'react';
import { motion, Variants } from 'framer-motion';
import clsx from 'clsx';
import { RetroButton } from './RetroButton';
import { RetroDropdown } from './RetroDropdown';
import { useBettingContext } from '../../../contexts/BettingContext';
import { BoardState, CHESS_PLAYER, MovedBoardState, MOVE_STATE } from '../../../types/Chess.type';
import { useChessGameContext } from '../../../contexts/ChessGameContext';
import { Move, Square, Chess } from 'chess.js';

const getAlgebraicNotation = (currChessBoard: BoardState, moveFrom: string | null, moveTo: string| null, fen: string) => {
  //function to replace number in fen with empty space
  const convertFenWithEmpty = () => {
    let pieces = fen.split(' ')[0];
    for(let i = 0; i<pieces.length; i++) {
      const nums = ['2','3','4','5','6','7','8'];
      if(nums.includes(pieces.charAt(i))) {
        let empty = '';
        for(let j = 0; j < parseInt(pieces.charAt(i)); j++) 
          empty += ' ';
        if(i==pieces.length-1)
          pieces = pieces.substring(0, i) + empty;
        else 
          pieces = pieces.substring(0, i) + empty + pieces.substring(i+1);
        i-=1;
      }
    }
    return pieces.split('/');
  };
  //function that gets the chess position based on the ith, jth square it is in
  const convertIntToPosition = (i: number,j: number) => {
    return String.fromCharCode(97+j) + (8-i).toString();
  }
  //function that gets all of the positions of a given piece, excluding the given one
  const getPositionOfPiece = (piece: string, fromPos: string) => {
    const piecesArr = convertFenWithEmpty();
    console.log(convertIntToPosition(0,0));
    let ret = [];
    for(let i = 0;i < piecesArr.length; i++) 
      for(let j = 0; j < 8; j++) 
        if(piecesArr[i].charAt(j) == piece) {
          var val = convertIntToPosition(i,j);
          if(val != fromPos)
            ret.push(convertIntToPosition(i,j));
        }
    return ret;
  }

  if(moveTo == null)
    return ' ';
  else if (moveFrom == null)
    return ' ';
  else {
    const piecesArr = convertFenWithEmpty();
    let fromPiece = piecesArr[8-parseInt(moveFrom.charAt(1))].charAt(moveFrom.charCodeAt(0)-97);
    if(fromPiece == "P")
      fromPiece = '';
    let toPiece = piecesArr[8-parseInt(moveTo.charAt(1))].charAt(moveTo.charCodeAt(0)-97);
    // todo: need to deal with moves that have multiple potential fromPieces
    //pseudo code
    const piecePositions = getPositionOfPiece(fromPiece, moveFrom);
    console.log(piecePositions);
    const chess = new Chess(currChessBoard.fen);
    // const rawcurrGameStateidMoves: Move[] = chess.moves({
    //   square,
    //   verbose: true,
    // }) as Move[];
    // remove the fromPiece. find each piece's valid moves from contract, and check if moveTo is there.
    // if moveTo is there, 
          //if pieces are not on same file 
              //add file
          //else if pieces are not on same row
              //add row
          //else add file and row
    if(toPiece==' ') 
      return fromPiece.toUpperCase()+moveTo;
    else {
      return fromPiece.toUpperCase()+'x'+moveTo;
    }
  }
}

export const VotingPanel: FC = () => {
  const { currChessBoard  } = useChessGameContext();
  const {
    playerOption,
    setPlayerOption,
    validMoves,
    selectedMoveIndex,
    setSelectedMoveIndex,
  } = useBettingContext();

  if (validMoves.length === 0) return null;

  return (
    <div className="relative h-full w-full bg-[url(/VotingDisplay.svg)] bg-contain bg-bottom bg-no-repeat">
      <div className="absolute left-[180px] bottom-[247.5px]">
      <RetroDropdown
          text={getAlgebraicNotation(currChessBoard, currChessBoard.moveFrom, currChessBoard.moveTo, currChessBoard.fen)}
          onClick={() => {
            //todo: get valid moves from betting contract, and make the next item be the next valid move. 
            // setSelectedMoveIndex((selectedMoveIndex + 1) % validMoves.length);
            //square = new selected move

            // const newChessBoard = {
            //   ...currChessBoard,
            //   moveState: MOVE_STATE.MOVED,
            //   validMoves: null,
            //   moveTo: square,
            // } as MovedBoardState;
        
            // setCurrChessBoard({ ...newChessBoard });
            // 
          }}
        />
      </div>
      <div className="absolute right-[100px] bottom-[247.5px]">
        
      </div>
      <div className="absolute bottom-[20px] left-[0px] right-[0px] flex flex-col items-center gap-y-3">
        <div className="h-[45px] w-[545px]">
          <RetroButton
            buttonImageUrl="bg-[url(/SubmitMoveButton.svg)]"
            onClick={() => {
              const moveFrom = currChessBoard.moveFrom;
              const moveTo = currChessBoard.moveTo;
              let moveFromInt = 0;
              let moveToInt = 0;
              if(moveFrom)
                moveFromInt = (moveFrom.charCodeAt(0)-97) + 8*(8-parseInt(moveFrom.charAt(1)));
              if(moveTo)
                moveToInt = 8*(moveTo.charCodeAt(0)-97) + parseInt(moveTo.charAt(1));
              const ret = moveFromInt<<6 + moveToInt;
              
              // call betting contract function voteWorldMove(ret)
            }}
          />
        </div>
        <div className="h-[45px] w-[545px]">
          <RetroButton
            buttonImageUrl="bg-[url(/BuyPowerButton.svg)]"
            onClick={() => {
              console.log('Buy Power');
            }}
          />
        </div>
        <div className="h-[45px] w-[545px]">
          <RetroButton
            buttonImageUrl="bg-[url(/ConnectWalletButton.svg)]"
            onClick={() => {
              //todo: connect the wallet from the user. 
              console.log('Connect Your Wallet');
            }}
          />
        </div>
      </div>
    </div>
  );
};
