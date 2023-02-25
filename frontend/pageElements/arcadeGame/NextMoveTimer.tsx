import moment from 'moment';
import Image from 'next/image';
import { FC, useEffect, useState } from 'react';
import { useBettingContext } from '../../contexts/BettingContext';
import { useChessGameContext } from '../../contexts/ChessGameContext';

export const NextMoveTimer: FC = () => {
  const { timeToNextMove } = useBettingContext();
  const { moveIndex } = useChessGameContext();

  const formattedTimeToNextMove = (): string => {
    if (timeToNextMove > 60) {
      return (
        Math.floor(timeToNextMove / 60) + ' min ' + (timeToNextMove % 60) + ' sec'
      );
    } else {
      return (timeToNextMove % 60) + ' sec';
    }
  };

  return (
    <div className="relative grid h-full w-full grid-cols-12 items-center bg-[url(/NextMoveTimer.png)] bg-contain bg-no-repeat px-[45px] pt-[45px] pb-[20px] text-4xl">
      <p className="col-span-5 w-fit" style={{ fontSize: 20, color: "white" }}>{`Turn ${moveIndex}`}</p>
      <p className="col-span-6 w-fit pl-[25px] text-align:center" style={{ fontSize: 20, color: "white" }}>{formattedTimeToNextMove()}</p>
    </div>
  );
};
