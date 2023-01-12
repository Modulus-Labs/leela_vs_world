import clsx from 'clsx';
import { FC } from 'react';
import { ChessRow, ChessColumn, ChessPiece } from '../../../types/Chess.type';

type ChessPieceOnBoardProps = {
  chessPiece: ChessPiece;
  row: ChessRow;
  column: ChessColumn;
};
export const ChessPieceOnBoard: FC<ChessPieceOnBoardProps> = ({
  chessPiece,
  row,
  column,
}) => {
  let rowCss = 'row-span-1 ';

  switch (row) {
    case 1:
      rowCss += 'row-start-1';
      break;
    case 2:
      rowCss += 'row-start-2';
      break;
    case 3:
      rowCss += 'row-start-3';
      break;
    case 4:
      rowCss += 'row-start-4';
      break;
    case 5:
      rowCss += 'row-start-5';
      break;
    case 6:
      rowCss += 'row-start-6';
      break;
    case 7:
      rowCss += 'row-start-7';
      break;
    case 8:
      rowCss += 'row-start-8';
      break;
  }

  let colCss = 'col-span-1 ';
  switch (column) {
    case 'A':
      colCss += 'col-start-1';
      break;
    case 'B':
      colCss += 'col-start-2';
      break;
    case 'C':
      colCss += 'col-start-3';
      break;
    case 'D':
      colCss += 'col-start-4';
      break;
    case 'E':
      colCss += 'col-start-5';
      break;
    case 'F':
      colCss += 'col-start-6';
      break;
    case 'G':
      colCss += 'col-start-7';
      break;
    case 'H':
      colCss += 'col-start-8';
      break;
  }

  let chessPieceColor = '';
  if (chessPiece > 5) {
    chessPieceColor = 'bg-off-black text-off-white';
  } else {
    chessPieceColor = 'bg-off-white text-off-black';
  }

  return (
    <div
      className={clsx(
        'mx-1 my-1 flex flex-row items-center justify-center font-bold',
        rowCss,
        colCss,
        chessPieceColor
      )}
    >
      {chessPiece}
    </div>
  );
};
