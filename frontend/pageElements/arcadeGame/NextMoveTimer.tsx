import moment from 'moment';
import Image from 'next/image';
import { FC, useEffect, useState } from 'react';
import { useBettingContext } from '../../contexts/BettingContext';

export const NextMoveTimer: FC = () => {
  const { timeToNextMove, prevMove } = useBettingContext();

  const formattedTimeToNextMove = (): string => {
    if (timeToNextMove > 60) {
      return (
        Math.floor(timeToNextMove / 60) + 'min ' + (timeToNextMove % 60) + 'sec'
      );
    } else {
      return (timeToNextMove % 60) + 'sec';
    }
  };

  return (
    <div className="relative grid h-full w-full grid-cols-2 bg-[url(/NextMoveTimer.svg)] bg-contain bg-no-repeat pt-8 text-xl">
      <p className="col-span-1 ml-7 w-fit">{prevMove}</p>
      <p className="col-span-1 w-fit">{formattedTimeToNextMove()}</p>
    </div>
  );
};
