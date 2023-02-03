import { motion, Variants } from 'framer-motion';
import Image from 'next/image';
import { FC, MouseEventHandler, ReactNode } from 'react';
import { useArcadeMachineContext } from '../../contexts/ArcadeMachineContext';

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

type FooterButtonProps = {
    children: ReactNode;
    onClick: MouseEventHandler<HTMLButtonElement>;
};

const FooterButton: FC<FooterButtonProps> = ({ children, onClick }) => {
    return (
      <motion.button
        variants={ButtonVariants}
        initial="initial"
        whileTap="tap"
        onClick={onClick}
        className="h-inherit cursor relative w-32"
      >
        {children}
      </motion.button>
    );
};

export const ArcadeFooter: FC = () => {
    const { setGameEarnings } =
    useArcadeMachineContext();
  
    return (
    <div className="absolute bottom-[125px] left-[700px] right-0 ">
      <div className="flex h-24 flex-row justify-center gap-x-5">
        <FooterButton onClick={() => setGameEarnings(true)}>
          <Image priority fill src="/WhatsThisButton.svg" alt="What's This?" />
        </FooterButton>
      </div>
    </div>
    );
  };
