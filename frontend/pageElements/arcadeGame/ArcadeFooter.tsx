import { motion, Variants } from "framer-motion";
import { url } from "inspector";
import Image from "next/image";
import { FC, MouseEventHandler, ReactNode, useEffect, useState } from "react";
import { useArcadeMachineContext } from "../../contexts/ArcadeMachineContext";
import { useRouter } from "next/router";
import clsx from "clsx";
import { DisclosureModal } from "../gamePopups/DisclosureModal";
import { ModulusAndFriendsModal } from "../gamePopups/ModulusAndFriendsModal";

const ButtonVariants: Variants = {
  initial: {
    filter: "brightness(100%)",
    scale: 1,
  },
  tap: {
    filter: "brightness(85%)",
    scale: 0.975,
  },
};

type FooterButtonProps = {
  text: string;
  darkMode?: boolean;
  flexGrow?: boolean;
  onClick?: any;
};

const FooterButton: FC<FooterButtonProps> = ({
  text,
  darkMode,
  flexGrow,
  onClick,
}) => {
  return (
    <motion.button
      variants={ButtonVariants}
      initial="initial"
      whileTap="tap"
      onClick={onClick}
      className={clsx(
        "border-2 px-3 py-1 text-xl",
        flexGrow && "flex-grow",
        darkMode
          ? "border-deep-forest-green bg-forest-green text-highlight-green"
          : "border-forest-green bg-emerald-green text-off-white"
      )}
    >
      {text}
    </motion.button>
  );
};

export const ArcadeFooter: FC = () => {
  const router = useRouter();
  const {
    setGameEarnings,
    setNavigateToChessGame,
    setLeelaSongPlaying,
    setShowDisclosureModal,
    showDisclosureModal,
    setShowModulusAndFriendsModal,
    showModulusAndFriendsModal,
  } = useArcadeMachineContext();

  const [isHomeScreen, setIsHomeScreen] = useState(false);

  useEffect(() => {
    if (router.pathname === "/") {
      setIsHomeScreen(true);
    } else {
      setIsHomeScreen(false);
    }
  }, [router]);

  return (
    <>
      {showDisclosureModal && <DisclosureModal />}
      {showModulusAndFriendsModal && <ModulusAndFriendsModal />}
      <footer className="bg-b box-content flex flex-row items-center gap-x-3 bg-off-gray py-5 px-width-clamp">
        <p className="text-xl text-off-white">{"MADE WITH ❤️ BY "}</p>
        <FooterButton
          text="Modulus and frens"
          onClick={() => setShowModulusAndFriendsModal(true)}
        />

        {/* --- Press to start only available on home screen --- */}
        {isHomeScreen ? (
          <FooterButton
            darkMode
            flexGrow
            text="Press anywhere to start"
            onClick={() => setNavigateToChessGame(true)}
          />
        ) : (
          <div className="flex-grow" />
        )}

        <FooterButton
          text="Disclosure"
          onClick={() => setShowDisclosureModal(true)}
        />
        <a href="https://twitter.com/moduluslabs?lang=en" target="_blank">
          <FooterButton text="Twitter" />
        </a>

        {/* --- Music is only on for chess screen --- */}
        {isHomeScreen ? (
          <></>
        ) : (
          <FooterButton
            text="Music"
            onClick={() => setLeelaSongPlaying((cur) => !cur)}
          />
        )}
      </footer>
    </>
  );
};
