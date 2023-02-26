import Image from "next/image";
import { useArcadeMachineContext } from "../contexts/ArcadeMachineContext";
import { useMediaQueryContext } from "../contexts/MediaQueryContext";
import { ScreenTooSmall } from "../pageElements/ScreenTooSmall";
import { motion, Variants } from "framer-motion";
import { useState } from "react";
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
  const { showDisclosureModal } = useArcadeMachineContext();

  const [startNavigationSequence, setStartNavigationSequence] = useState(false);
  const [showLoadingText, setShowLoadingText] = useState(false);

  const navigateToGame = () => {
    if (!startNavigationSequence) {
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
  };

  if (isMobile) {
    return <ScreenTooSmall />;
  }

  return (
    <div>
      <div className="h-screen" style={{ display: "flex", flexDirection: "column", backgroundColor: "black", maxHeight: "100%", maxWidth: "100%", alignItems: "center", overflow: "hidden" }}>
        <div
          onClick={navigateToGame}
          className="cursor-pointer"
          style={{ display: "flex", flex: 100, overflow: "hidden", alignItems: "flex-start", alignContent: "center", justifyItems: "center", justifyContent: "center" }}
        >
          {showLoadingText ? <></> :
            <motion.div
              variants={BackgroundImageVariants}
              initial="initial"
              animate={startNavigationSequence ? "zoom" : "initial"}
              className=""
              style={{ display: "flex", flex: 1, overflow: "hidden" }}
            >
              <img
                src="/AllArcadeMachines.gif"
                alt="Landing page for Leela vs the world"
                style={{ alignSelf: "center", overflow: "hidden" }}>
              </img>
            </motion.div>
          }

          <motion.div
            variants={LoadingTextVariants}
            initial="hidden"
            animate={showLoadingText ? "visible" : "hidden"}
            className={clsx(
              "text-3xl text-off-white",
              showLoadingText ? "block" : "hidden"
            )}
            style={{ textAlign: "center", alignSelf: "center", justifySelf: "center", flex: 1 }}
          >
            {"Firing up Leela vs the World 🎮..."}
          </motion.div>

        </div>
        <div style={{ flex: 10, backgroundColor: "black" }}>
          <ArcadeFooter isHomeScreen={true}></ArcadeFooter>
        </div>
      </div >
      {
        showDisclosureModal && (
          <DisclosureModal />
        )
      }
    </div>
  );
}