import clsx from 'clsx';
import { ethers } from 'ethers';
import { FC, useEffect, useState } from 'react';
import { useBettingContext } from '../../contexts/BettingContext';

type Move = {
  move: string;
  amount: number;
};

export const NextMoveLeaderboard: FC = () => {
  const { validMoves } = useBettingContext();

  if (validMoves.length === 0) return null;

  return (
    <div className="h-36 w-full bg-[url(/NextMoveLeaderboardDisplay.svg)] bg-contain bg-no-repeat px-3 pt-8 pb-4">
      <div className="flex flex-col justify-between">
        {validMoves.map(({ move, amount }, index) => (
          <div
            key={move}
            className={clsx(
              'flex flex-row justify-between px-2',
              index % 2 === 0 && 'bg-emerald-green'
            )}
          >
            <p className="font-bold">{move}</p>
            <p>{ethers.utils.formatEther(amount)} ETH</p>
          </div>
        ))}
      </div>
    </div>
  );
};
