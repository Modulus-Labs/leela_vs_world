import clsx from 'clsx';
import { motion, Variants } from 'framer-motion';
import Image from 'next/image';
import { FC, MouseEventHandler, useEffect, useState } from 'react';
import { useChessGameContext } from '../../../contexts/ChessGameContext';
import { ChessBoardData, ChessPiece } from '../../../types/Chess.type';
import { BOARD_0, BOARD_1 } from './ChessBoardDefaults';
import { ChessPieceOnBoard } from './ChessPieceOnBoard';

const ButtonVariants: Variants = {
  initial: {
    filter: 'brightness(100%)',
    scale: 1,
  },
  tap: {
    filter: 'brightness(85%)',
    scale: 0.975,
  },
};

type MoveButtonProps = {
  disabled: boolean;
  buttonImageUrl: string;
  onClick: MouseEventHandler<HTMLButtonElement>;
};

const MoveButton: FC<MoveButtonProps> = ({
  buttonImageUrl,
  onClick,
  disabled,
}) => {
  return (
    <motion.button
      variants={ButtonVariants}
      initial="initial"
      whileTap="tap"
      disabled={disabled}
      className="relative h-7 w-28 disabled:opacity-50"
      onClick={onClick}
    >
      <Image priority fill src={buttonImageUrl} alt="Left" />
    </motion.button>
  );
};

export const ChessBoard: FC = () => {
  const {
    selectedChessBoard,
    canKeepGoingBackInHistory,
    goBackOneBoardInHistory,
    canKeepGoingForwardInHistory,
    goForwardOneBoardInHistory,
  } = useChessGameContext();

  return (
    <div className="pr-[3.8rem]">
      <div className="grid-col-8 grid h-[17rem] w-full grid-rows-8 bg-[url(/ChessBoard.svg)] bg-contain bg-no-repeat pl-4 pb-4">
        {selectedChessBoard.map(({ chessPiece, row, column }, index) => {
          return (
            <ChessPieceOnBoard
              key={index}
              chessPiece={chessPiece}
              row={row}
              column={column}
            />
          );
        })}
      </div>
      <div className="mt-1 flex flex-row items-center justify-between">
        <div>
          <MoveButton
            disabled={!canKeepGoingBackInHistory()}
            buttonImageUrl="/LeftArrowGreen.svg"
            onClick={goBackOneBoardInHistory}
          />
        </div>
        <div className="relative h-5 w-5">
          <Image priority fill src="/DotPinkGreen.svg" alt="" />
        </div>
        <div>
          <MoveButton
            disabled={!canKeepGoingForwardInHistory()}
            buttonImageUrl="/RightArrowPink.svg"
            onClick={goForwardOneBoardInHistory}
          />
        </div>
      </div>
    </div>
  );
};
