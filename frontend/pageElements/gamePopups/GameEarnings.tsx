import { motion, Variants } from 'framer-motion';
import Image from 'next/image';
import { FC, useState } from 'react';
import { useArcadeMachineContext } from '../../contexts/ArcadeMachineContext';
import { GamePopup } from './GamePopup';
import { useBettingContext } from '../../contexts/BettingContext';

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

export const GameEarnings: FC = () => {
    const { setGameEarnings } =
      useArcadeMachineContext();
    const {prizePoolAmount} = useBettingContext();
  
    return (
      <GamePopup onClick={() => setGameEarnings(false)}>
        <div className="relative mx-auto mt-4 h-44 w-[80%] bg-[url(/CurrentPrizePoolDisplay.svg)] bg-contain bg-no-repeat">
          <div className="ml-36 flex w-60 flex-col gap-y-1 pt-8 text-sm">
          <div className="border-2 border-off-white px-2 text-off-white">
            {prizePoolAmount.toFixed(2)} MATIC
          </div>
            <div className="border-2 border-off-white px-2 text-off-white">
              10%
            </div>
          </div>
        </div>
      </GamePopup>
    );
  };