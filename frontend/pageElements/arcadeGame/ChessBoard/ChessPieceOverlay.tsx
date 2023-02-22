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
