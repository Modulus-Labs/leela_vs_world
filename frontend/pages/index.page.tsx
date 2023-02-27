import Image from "next/image";
import { useArcadeMachineContext } from "../contexts/ArcadeMachineContext";
import { useMediaQueryContext } from "../contexts/MediaQueryContext";
import { ScreenTooSmall } from "../pageElements/ScreenTooSmall";
import { motion, Variants } from "framer-motion";
import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import clsx from "clsx";
import { ArcadeFooter } from "../pageElements/arcadeGame/ArcadeFooter";
import { InfoModal } from "../pageElements/gamePopups/InfoModal";
import { DisclosureModal } from "../pageElements/gamePopups/DisclosureModal";

const DARKEN_TIME = 3.5;
const LOADING_TIME = 3;

const BackgroundImageVariants: Variants = {
  initial: {
    scale: 1,
    opacity: 1,
  },
  zoom: {
    scale: 2,
    opacity: 0,
    transition: {
      repeat: Infinity,
      scale: {
        duration: 2,
      },
      opacity: {
        duration: DARKEN_TIME,
      },
    },
  },
};

const LoadingTextVariants: Variants = {
  hidden: {
    opacity: 0.2,
    scale: 1,
  },
  visible: {
    opacity: 1,
    scale: 0.98,
    transition: {
      repeat: Infinity,
      duration: 0.75,
      repeatType: "reverse",
    },
  },
};

export default function HomePage() {
  const router = useRouter();

  const { isMobile } = useMediaQueryContext();
  const { navigateToChessGame, setNavigateToChessGame } =
    useArcadeMachineContext();

  const [startNavigationSequence, setStartNavigationSequence] = useState(false);
  const [showLoadingText, setShowLoadingText] = useState(false);

  useEffect(() => {
    if (navigateToChessGame && !startNavigationSequence) {
      setStartNavigationSequence(true);

      const showLoadingTimeout = setTimeout(() => {
        setShowLoadingText(true);
      }, DARKEN_TIME * 1000);

      const changeRouteTimeout = setTimeout(() => {
        router.push("/chess");
      }, (DARKEN_TIME + LOADING_TIME) * 1000);

      return () => {
        clearTimeout(showLoadingTimeout);
        clearTimeout(changeRouteTimeout);
      };
    }
  }, [navigateToChessGame]);

  if (isMobile) {
    return <ScreenTooSmall />;
  }

  return (
    <div
      onClick={() => setNavigateToChessGame(true)}
      className="flex h-full cursor-pointer flex-row items-center justify-center overflow-hidden bg-off-black"
    >
      <motion.div
        variants={BackgroundImageVariants}
        initial="initial"
        animate={startNavigationSequence ? "zoom" : "initial"}
        className="absolute top-0 bottom-0 left-0 right-0"
      >
        <Image
          src="/AllArcadeMachines.gif"
          alt=""
          fill
          className="object-cover"
        />
      </motion.div>
      <motion.div
        variants={LoadingTextVariants}
        initial="hidden"
        animate={showLoadingText ? "visible" : "hidden"}
        className={clsx(
          "text-3xl text-off-white",
          showLoadingText ? "block" : "hidden"
        )}
      >
        Firing up Leela Vs World 🎮
      </motion.div>
    </div>
  );
}
