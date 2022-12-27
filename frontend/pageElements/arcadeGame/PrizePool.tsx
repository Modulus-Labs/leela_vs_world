import { FC } from 'react';
import { motion } from 'framer-motion';
import { useBettingContext } from '../../contexts/BettingContext';

export const PrizePool: FC = () => {
  const { prizePoolAmount, MAX_PRIZE_POOL } = useBettingContext();

  return (
    <div className="relative h-full w-full bg-[url(/PrizePoolDisplay.svg)] bg-contain bg-no-repeat">
      <p className="absolute left-44 top-2 bg-transparent font-bold">
        {prizePoolAmount.toFixed(1)} ETH
      </p>
      <div className="absolute left-2 top-9 right-4 h-5">
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
