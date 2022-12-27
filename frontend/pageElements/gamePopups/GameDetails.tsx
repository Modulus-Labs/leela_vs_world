import { motion, Variants } from 'framer-motion';
import Image from 'next/image';
import { FC, MouseEventHandler, useState } from 'react';
import { useArcadeMachineContext } from '../../contexts/ArcadeMachineContext';
import { GamePopup } from './GamePopup';

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

type LeelaWorldButtonProps = {
  buttonImageUrl: string;
  onClick: MouseEventHandler<HTMLButtonElement>;
};

const LeelaWorldButton: FC<LeelaWorldButtonProps> = ({
  buttonImageUrl,
  onClick,
}) => {
  return (
    <motion.button
      variants={ButtonVariants}
      initial="initial"
      whileTap="tap"
      onClick={onClick}
      className="h-5 w-20"
    >
      <Image fill src={buttonImageUrl} alt="" />
    </motion.button>
  );
};

export const GameDetails: FC = () => {
  const { setShowGameDetails, setShowGameInstructions, prizePoolAmount } =
    useArcadeMachineContext();

  const [powerAmount, setPowerAmount] = useState('0');

  return (
    <GamePopup onClick={() => setShowGameDetails(false)}>
      <div className="relative mx-auto mt-4 h-24 w-[80%] bg-[url(/CurrentPrizePoolDisplay.svg)] bg-contain bg-no-repeat">
        <div className="ml-36 flex w-60 flex-col gap-y-1 pt-8 text-sm">
          <div className="border-2 border-off-white px-2 text-off-white">
            {prizePoolAmount.toFixed(2)} ETH
          </div>
          <div className="border-2 border-off-white px-2 text-off-white">
            10%
          </div>
        </div>
      </div>
      <div className="relative mx-auto mt-2 h-24 w-[80%] bg-[url(/BuyPowerDisplay.svg)] bg-contain bg-no-repeat">
        <div className="pt-8 text-sm">
          <input
            value={powerAmount}
            onChange={(e) => setPowerAmount(e.target.value)}
            className="absolute left-[9.5rem] w-20 border-2 border-off-white bg-transparent px-2 text-off-white outline-none"
          />
          <div className="absolute left-36 top-14">
            <LeelaWorldButton
              buttonImageUrl="/LeelaButton.svg"
              onClick={() => console.log('Leela')}
            />
          </div>
          <div className="absolute left-64 top-14">
            <LeelaWorldButton
              buttonImageUrl="/WorldButton.svg"
              onClick={() => console.log('World')}
            />
          </div>
        </div>
      </div>
      <motion.button
        variants={ButtonVariants}
        initial="initial"
        whileTap="tap"
        onClick={() => setShowGameInstructions(true)}
        className="relative mx-auto mt-2 block h-10 w-56"
      >
        <Image fill src="/HowDoesThisWorkButton.svg" alt="" />
      </motion.button>
    </GamePopup>
  );
};
