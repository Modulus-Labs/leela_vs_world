import { Chess, Square } from 'chess.js';
import Image from 'next/image';
import { FC } from 'react';
import { useChessGameContext } from '../../../contexts/ChessGameContext';

type ValidMoveOverlayProps = {
  x: number;
  y: number;
  square: Square;
};

export const ValidMoveOverlay: FC<ValidMoveOverlayProps> = ({
  x,
  y,
  square,
}) => {
  const { currChessBoard } = useChessGameContext();

  // if (
  //   currChessBoard.validMoves === null ||
  //   !currChessBoard.validMoves.some((move) => move === square)
  // )
  //   return null;

  // FIXME: stop initializing so many Chess
  // const chess = new Chess(currChessBoard.fen);
  // const piece = chess.get(currChessBoard.moveFrom);

  // if (!piece) return null;

  const piece = currChessBoard.chessGame.get(square);

  return (
    <div
      className="absolute cursor-pointer"
      style={{
        left: 35 + x * 71,
        top: y * 71,
      }}
    >
      <div className="relative h-[65px] w-[65px]">
        {piece.type === "b" || piece.type === "k" || piece.type === "q" || piece.type === "r" || piece.type === "n" || piece.type === "p" ?
          <Image
            src={`/chessPieces/${piece.type}${piece.color}.svg`}
            alt=""
            fill
            className="object-contain opacity-30"
          /> : <></>
        }
      </div>
    </div>
  );
};
