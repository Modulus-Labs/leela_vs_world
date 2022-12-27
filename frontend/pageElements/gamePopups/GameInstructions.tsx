import { motion, Variants } from 'framer-motion';
import Image from 'next/image';
import { FC } from 'react';
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

export const GameInstructions: FC = () => {
  const { setShowGameInstructions } = useArcadeMachineContext();

  return (
    <GamePopup onClick={() => setShowGameInstructions(false)}>
      <div className="relative mx-auto mt-5 h-60 w-[90%] bg-[url(/HowDoesLeelaVsWorldWorkDisplay.svg)] bg-contain bg-no-repeat px-5 pt-14">
        <p className="text-off-white">
          This is how Leela VS World ACTUALY works...
          <br />
          <br />A man named Jongwon is planning a back-door function to steal
          your money. Run NOW, while you can! 🏃‍♀️
        </p>
      </div>
    </GamePopup>
  );
};
