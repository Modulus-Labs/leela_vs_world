import { Variants, motion } from 'framer-motion';
import Image from 'next/image';
import { FC, MouseEventHandler, ReactNode } from 'react';
import { useArcadeMachineContext } from '../../contexts/ArcadeMachineContext';

const BackgroundVariants: Variants = {
  hidden: {
    opacity: 0,
  },
  show: {
    opacity: 1,
    transition: {
      duration: 0.3,
    },
  },
};

const ButtonVariants: Variants = {
  initial: {
    filter: 'brightness(100%)',
    scale: 1,
  },
  tap: {
    filter: 'brightness(85%)',
    scale: 0.9,
  },
};

type GamePopupProps = {
  children: ReactNode;
  onClick: MouseEventHandler<HTMLButtonElement>;
};

export const GamePopup: FC<GamePopupProps> = ({ children, onClick }) => {
  return (
    <motion.div
      variants={BackgroundVariants}
      initial="hidden"
      animate="show"
      className="relative h-72 w-[500px] bg-[url(/ChessboardBackground.svg)] bg-contain bg-no-repeat"
    >
      <div className="absolute right-0 top-0">
        <motion.button
          variants={ButtonVariants}
          initial="initial"
          whileTap="tap"
          className="relative h-7 w-7"
          onClick={onClick}
        >
          <Image
            fill
            src="/XButtonPink.svg"
            alt="X"
            className="object-contain"
          />
        </motion.button>
      </div>
      {children}
    </motion.div>
  );
};
