import { FC } from 'react';
import { motion } from 'framer-motion';
import { useBettingContext } from '../../contexts/BettingContext';

export const PrizePool: FC = () => {
  const { prizePoolAmount, MAX_PRIZE_POOL } = useBettingContext();

  return (
    <div className="relative h-full w-full bg-[url(/PrizePoolDisplay.svg)] bg-contain bg-no-repeat text-4xl">
      <p className="absolute left-[325px] top-[20px]  bg-transparent">
        {prizePoolAmount.toFixed(1)} ETH
      </p>
      <div className="absolute top-[72.5px] left-[0px] h-[35px] w-full px-[17px]">
        <motion.div
          animate={{
            width: (prizePoolAmount / MAX_PRIZE_POOL) * 100 + '%',
            transition: {
              type: 'tween',
              duration: 0.1,
            },
          }}
          className="h-full bg-[url(/PrizePoolBar.svg)] bg-cover bg-no-repeat"
        />
      </div>
    </div>
  );
};
