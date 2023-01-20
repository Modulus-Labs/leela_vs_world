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

type HeaderButtonProps = {
  children: ReactNode;
  onClick: MouseEventHandler<HTMLButtonElement>;
};

const HeaderButton: FC<HeaderButtonProps> = ({ children, onClick }) => {
  return (
    <motion.button
      variants={ButtonVariants}
      initial="initial"
      whileTap="tap"
      onClick={onClick}
      className="h-inherit cursor relative w-[250px] flex-shrink-0"
    >
      {children}
    </motion.button>
  );
};

export const ArcadeHeader: FC = () => {
  const { setShowGameDetails } = useArcadeMachineContext();

  return (
    <div className="flex h-[inherit] w-full flex-row justify-between gap-x-10">
      <HeaderButton onClick={() => setShowGameDetails(true)}>
        <Image priority fill src="/WhatsThisButton.svg" alt="What's This?" />
      </HeaderButton>
      <div className="relative h-full w-full flex-grow">
        <Image priority fill src="/MainLogo.svg" alt="Leela vs The World" />
      </div>

      <HeaderButton
        onClick={() => {
          console.log('Strategize on Discord');
        }}
      >
        <a href={process.env.DISCORD_LINK!} target="_blank" rel="no-referrer">
          <Image
            priority
            fill
            src="/StrategizeButton.svg"
            alt="Strategize On Discord"
          />
        </a>
      </HeaderButton>
    </div>
  );
};
