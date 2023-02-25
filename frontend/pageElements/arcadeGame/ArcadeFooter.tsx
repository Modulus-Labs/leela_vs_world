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
  onClick: any;
};

const FooterButton: FC<FooterButtonProps> = ({ children, onClick }) => {
  return (
    <motion.button
      variants={ButtonVariants}
      initial="initial"
      whileTap="tap"
      onClick={onClick}
      className="h-inherit cursor relative"
      style={{
        flex: 80,
        paddingRight: 10,
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
      className="h-inherit cursor"
      style={{
        flex: 130,
        paddingRight: 10,
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
      className="h-inherit cursor"
      style={{
        flex: 65,
        paddingRight: 10,
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
        flex: 45,
        paddingRight: 10,
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
        flex: 50,
      }}
    >
      {children}
    </motion.button>
  );
};

interface ArcadeFooterProps {
  isHomeScreen: boolean;
}

export const ArcadeFooter: FC<ArcadeFooterProps> = ({ isHomeScreen }) => {
  const { setGameEarnings, setLeelaSongPlaying } =
    useArcadeMachineContext();

  return (
    <div style={{ display: "flex", alignSelf: "center", flex: 100, flexDirection: "row", paddingTop: 10, paddingBottom: 10, backgroundColor: "black" }}>
      <span style={{ flex: 70, color: "white", fontSize: 20, textAlign: "center" }}>
        {"MADE WITH LOVE BY "}
      </span>
      <FooterButton onClick={() => setGameEarnings(true)}>
        <img
          src={"bottomBar/modulusAndFriends.png"} alt={"Modulus and friends button"}></img>
      </FooterButton>

      {/* --- Press to start only available on home screen --- */}
      {isHomeScreen ?
        <PressToStartButton onClick={() => { }}>
          <img
            src={"bottomBar/pressAnywhereToStart.png"}
            alt={"Press anywhere to start"}>
          </img>
        </PressToStartButton> : <></>
        // <div style={{ flex: 110 }}/>
      }

      <DisclosureButton onClick={() => setGameEarnings(true)}>
        <img
          src="/bottomBar/disclosureButton.png" alt="Legal/financial disclosure">
        </img>
      </DisclosureButton>
      <TwitterButton onClick={() => { }}>
        <img
          src="/bottomBar/twitterButton.png" alt="Modulus Twitter button">
        </img>
      </TwitterButton>

      {/* --- Music is only on for chess screen --- */}
      {isHomeScreen ? <></> :
        <MusicButton onClick={() => setLeelaSongPlaying((cur) => !cur)}>
          <img
            src="/bottomBar/musicButton.png" alt="Music play/pause button">
          </img>
        </MusicButton>
      }
    </div >
  );
};
