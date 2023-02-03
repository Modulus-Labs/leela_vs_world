import { Chess, Square } from 'chess.js';
import clsx from 'clsx';
import Image from 'next/image';
import { FC } from 'react';
import { useChessGameContext } from '../../../contexts/ChessGameContext';

type ChessPieceOverlayProps = {
  x: number;
  y: number;
  square: Square;
};

export const ChessPieceOverlay: FC<ChessPieceOverlayProps> = ({
  x,
  y,
  square,
}) => {
  const { currChessBoard } = useChessGameContext();

  // FIXME: stop initializing so many Chess
  const chess = new Chess(currChessBoard.fen);
  const piece = chess.get(square);

  if (!piece) return null;

  return (
    <div
      className="absolute cursor-pointer"
      style={{
        left: 35 + x * 71,
        top: y * 71,
      }}
    >
      <div className="relative h-[65px] w-[65px]">
        <Image
          src={`/chessPieces/${piece.type}${piece.color}.svg`}
          alt=""
          fill
          className="object-contain"
        />
      </div>
    </div>
  );
};
