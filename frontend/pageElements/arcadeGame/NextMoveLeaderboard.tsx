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
    <div className="h-36 bg-[url(/NextMoveLeaderboardDisplay.svg)] bg-contain bg-no-repeat px-4 pt-10 pb-2">
    <div className="h-20 w-full overflow-auto">
      <div className="h-15 overflow-auto flex flex-col justify-between">
        {validMoves.map(({ move, amount }, index) => (
        <div key={move} className={clsx('flex flex-row justify-between px-3', index % 2 === 0 && 'bg-emerald-green')}>
          <p className="font-bold">{move}</p>
          <p>{ethers.utils.formatEther(amount)} MATIC</p>
        </div>
        ))}
      </div>
    </div>
    </div>
  );
};
