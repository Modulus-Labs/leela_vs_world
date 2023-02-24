import { motion, Variants } from 'framer-motion';
import { url } from 'inspector';
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
      className="h-inherit cursor w-32 px-[45px]"
      style={{
        position: "relative",
        // bottom: 17,
        height: 35,
        width: 250,
        // marginLeft: 235,
      }}
    >
      {children}
    </motion.button>
  );
};

const PressToStartButton: FC<FooterButtonProps> = ({ children, onClick }) => {
  return (
    <motion.button
      variants={ButtonVariants}
      initial="initial"
      whileTap="tap"
      onClick={onClick}
      className="h-inherit cursor w-32"
      style={{
        position: "absolute",
        bottom: 17,
        height: 35,
        width: 350,
        left: 500,
        right: 0,
      }}
    >
      {children}
    </motion.button>
  );
};

const DisclosureButton: FC<FooterButtonProps> = ({ children, onClick }) => {
  return (
    <motion.button
      variants={ButtonVariants}
      initial="initial"
      whileTap="tap"
      onClick={onClick}
      className="h-inherit cursor w-32"
      style={{
        position: "absolute",
        bottom: 17,
        height: 35,
        width: 200,
        left: 865,
        right: 0,
      }}
    >
      {children}
    </motion.button>
  );
};

const TwitterButton: FC<FooterButtonProps> = ({ children, onClick }) => {
  return (
    <motion.button
      variants={ButtonVariants}
      initial="initial"
      whileTap="tap"
      onClick={onClick}
      className="h-inherit cursor w-32"
      style={{
        position: "absolute",
        bottom: 17,
        height: 35,
        width: 200,
        left: 1150,
        right: 0,
      }}
    >
      {children}
    </motion.button>
  );
};

const MusicButton: FC<FooterButtonProps> = ({ children, onClick }) => {
  return (
    <motion.button
      variants={ButtonVariants}
      initial="initial"
      whileTap="tap"
      onClick={onClick}
      className="h-inherit cursor w-32"
      style={{
        position: "absolute",
        bottom: 17,
        height: 35,
        width: 200,
        left: 1400,
        right: 0,
      }}
    >
      {children}
    </motion.button>
  );
};

export const ArcadeFooter: FC = () => {
  const { setGameEarnings, setLeelaSongPlaying } =
    useArcadeMachineContext();

  return (
    <div className="" style={{ backgroundColor: "blue", maxHeight: "20%", alignSelf: "center", justifySelf: "center" }}>
      <div className="bg-[url(/bottomBar/barBackground.png)]" style={{ alignSelf: "center", alignItems: "center", justifyItems: "center" }}>
        <FooterButton onClick={() => setGameEarnings(true)}>
          <Image priority fill src="/bottomBar/modulusAndFriends.png" alt="Modulus and friends button" />
        </FooterButton>
        <PressToStartButton onClick={() => setGameEarnings(true)}>
          <Image priority fill src="/bottomBar/pressAnywhereToStart.png" alt="Press anywhere to start" />
        </PressToStartButton>
        <DisclosureButton onClick={() => setGameEarnings(true)}>
          <Image priority fill src="/bottomBar/disclosureButton.png" alt="Legal/financial disclosure" />
        </DisclosureButton>
        <MusicButton onClick={() => setLeelaSongPlaying((cur) => !cur)}>
          <Image priority fill src="/bottomBar/musicButton.png" alt="Music play/pause button" />
        </MusicButton>
      </div>
    </div>
  );
};
