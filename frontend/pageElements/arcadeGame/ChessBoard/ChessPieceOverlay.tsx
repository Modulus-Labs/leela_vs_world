import { Chess, Piece, Square } from 'chess.js';
import clsx from 'clsx';
import Image from 'next/image';
import { FC, useCallback, useEffect, useState } from 'react';
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
  const [piece, setPiece] = useState<Piece>(currChessBoard.chessGame.get(square));

  // --- Update the piece ---
  useEffect(useCallback(() => {
    setPiece(currChessBoard.chessGame.get(square));
  }, [currChessBoard]), [currChessBoard]);

  if (!piece) {
    // console.log(`No piece on square ${square}`);
    return null;
  }

  return (
    <div
      className="absolute cursor-pointer"
      style={{
        left: 27 + x * 50,
        top: 2 + y * 50,
      }}
    >
      <div className="relative h-[45px] w-[45px]">
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
