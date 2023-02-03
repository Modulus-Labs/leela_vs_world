import { Square } from 'chess.js';
import clsx from 'clsx';
import { FC } from 'react';
import { useChessGameContext } from '../../../contexts/ChessGameContext';

type MoveFromOverlayProps = {
  x: number;
  y: number;
  square: Square;
};

export const MoveFromOverlay: FC<MoveFromOverlayProps> = ({ x, y, square }) => {
  const { currChessBoard } = useChessGameContext();

  return (
    <div
      className={clsx(
        'absolute h-[71px] w-[71px] cursor-pointer bg-yellow-200 opacity-50',
        currChessBoard.validMoves !== null &&
          currChessBoard.validMoves.some((move) => move === square) &&
          'cursor-pointer'
      )}
      style={{
        left: 35 + x * 71,
        top: y * 71,
      }}
    />
  );
};
