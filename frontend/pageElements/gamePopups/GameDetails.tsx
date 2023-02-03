import { motion, Variants } from 'framer-motion';
import Image from 'next/image';
import { FC, MouseEventHandler, useState } from 'react';
import { useArcadeMachineContext } from '../../contexts/ArcadeMachineContext';
import { useBettingContext } from '../../contexts/BettingContext';
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
      className="h-[50px] w-[175px]"
    >
      <Image fill src={buttonImageUrl} alt="" />
    </motion.button>
  );
};

export const GameDetails: FC = () => {
  const { setShowGameDetails, setShowGameInstructions } =
    useArcadeMachineContext();
  const { prizePoolAmount } = useBettingContext();

  const [powerAmount, setPowerAmount] = useState('0');

  return (
    <GamePopup onClick={() => setShowGameDetails(false)}>
      <div className="mx-[107.5px]">
        <div className="relative mx-auto flex h-[230px] w-full flex-col bg-[url(/CurrentPrizePoolDisplay.svg)] bg-contain bg-no-repeat">
          <div className="ml-[350px] mt-[80px] mr-[30px] flex flex-col text-4xl">
            <div className="flex h-[50px] flex-row items-center border-2 border-off-white px-[15px] text-off-white">
              {prizePoolAmount.toFixed(2)} ETH
            </div>
            <div className="mt-[10px] flex h-[50px] flex-row items-center border-2 border-off-white px-[15px] text-off-white">
              10%
            </div>
          </div>
        </div>
        <div className="relative mx-auto mt-[5px] h-[230px] w-full bg-[url(/BuyPowerDisplay.svg)] bg-contain bg-no-repeat">
          <div>
            <input
              value={powerAmount}
              onChange={(e) => setPowerAmount(e.target.value)}
              className="absolute top-[82.5px] left-[360px] w-[190px] border-2 border-off-white bg-transparent px-2 text-4xl text-off-white outline-none"
            />
            <div className="absolute left-[350px] top-[142.5px]">
              <LeelaWorldButton
                buttonImageUrl="/LeelaButton.svg"
                onClick={() => console.log('Leela')}
              />
            </div>
            <div className="absolute left-[610px] top-[142.5px]">
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
          className="relative mx-auto mt-2 block h-[95px] w-[500px]"
        >
          <Image fill src="/HowDoesThisWorkButton.svg" alt="" />
        </motion.button>
      </div>
    </GamePopup>
  );
};
