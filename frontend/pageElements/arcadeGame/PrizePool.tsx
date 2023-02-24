import { FC } from 'react';
import { motion } from 'framer-motion';
import { useBettingContext } from '../../contexts/BettingContext';

export const PrizePool: FC = () => {
  const { leelaPrizePoolAmount, worldPrizePoolAmount } = useBettingContext();

  const denominator = (leelaPrizePoolAmount + worldPrizePoolAmount);
  const leelaPrizePoolPercentage = denominator === 0 ? 50 : 100 * leelaPrizePoolAmount / denominator;
  const worldPrizePoolPercentage = denominator === 0 ? 50 : 100 * worldPrizePoolAmount / denominator;
  return (
    <div className="relative h-full w-full bg-[url(/PrizePool.png)] bg-contain bg-no-repeat text-4xl">
      <p className="absolute left-[325px] top-[20px]  bg-transparent">
        {`${(leelaPrizePoolAmount + worldPrizePoolAmount).toFixed(2)} MATIC`}
      </p>
      <div className="absolute top-[72.5px] left-[0px] h-[35px] w-full px-[17px]">
        <motion.div
          animate={{
            width: (leelaPrizePoolAmount / (worldPrizePoolAmount + leelaPrizePoolAmount)) * 100 + '%',
            transition: {
              type: 'tween',
              duration: 0.1,
            },
          }}
          className="h-full bg-[url(/PrizePoolBar.svg)] bg-cover bg-no-repeat"
        />
      </div>
      <div className="absolute top-[72.5px] left-[0px] h-[35px] w-full px-[17px]">
        <p className="absolute left-[50px] bg-transparent">
          {`${leelaPrizePoolPercentage.toFixed(2)}% Leela | ${worldPrizePoolPercentage.toFixed(2)}% World`}
        </p>
      </div>
    </div>
  );
};
