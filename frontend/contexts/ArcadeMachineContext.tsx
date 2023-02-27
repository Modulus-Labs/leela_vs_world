import { useRouter } from "next/router";
import {
  createContext,
  Dispatch,
  ReactNode,
  SetStateAction,
  useContext,
  useEffect,
  useState,
} from "react";

interface ArcadeMachineContextInterface {
  showGameDetails: boolean;
  setShowGameDetails: Dispatch<SetStateAction<boolean>>;

  showGameInstructions: boolean;
  setShowGameInstructions: Dispatch<SetStateAction<boolean>>;

  showGameEarnings: boolean;
  setGameEarnings: Dispatch<SetStateAction<boolean>>;

  showDisclosureModal: boolean;
  setShowDisclosureModal: Dispatch<SetStateAction<boolean>>;

  navigateToChessGame: boolean;
  setNavigateToChessGame: Dispatch<SetStateAction<boolean>>;

  // --- Music ---
  leelaSongPlaying: boolean;
  setLeelaSongPlaying: Dispatch<SetStateAction<boolean>>;

  // --- For info modal stuff ---
  showInfoModal: boolean;
  setShowInfoModal: Dispatch<SetStateAction<boolean>>;
  infoModalDismissVisible: boolean;
  setInfoModalDismissVisible: Dispatch<SetStateAction<boolean>>;
  infoModalText: string;
  setInfoModalText: Dispatch<SetStateAction<string>>;
}

const ArcadeMachineContext = createContext<
  ArcadeMachineContextInterface | undefined
>(undefined);

export const ArcadeMachineContextProvider = ({
  children,
}: {
  children: ReactNode;
}) => {
  const router = useRouter();

  const [showGameDetails, setShowGameDetails] = useState<boolean>(false);
  const [showGameInstructions, setShowGameInstructions] =
    useState<boolean>(false);
  const [showGameEarnings, setGameEarnings] = useState<boolean>(false);
  const [showDisclosureModal, setShowDisclosureModal] =
    useState<boolean>(false);
  const [navigateToChessGame, setNavigateToChessGame] =
    useState<boolean>(false);

  // --- For info modal ---
  const [showInfoModal, setShowInfoModal] = useState<boolean>(false);
  const [infoModalDismissVisible, setInfoModalDismissVisible] =
    useState<boolean>(false);
  const [infoModalText, setInfoModalText] = useState<string>("");

  // --- Music stuff ---
  const [leelaSongPlaying, setLeelaSongPlaying] = useState<boolean>(false);

  // When changing routes reset so it doesn't automatically navigate to the chess gam
  useEffect(() => {
    if (navigateToChessGame) {
      setNavigateToChessGame(false);
    }
  }, [router]);

  return (
    <ArcadeMachineContext.Provider
      value={{
        showGameDetails,
        setShowGameDetails,
        showGameInstructions,
        setShowGameInstructions,
        showGameEarnings,
        setGameEarnings,
        showDisclosureModal,
        setShowDisclosureModal,
        navigateToChessGame,
        setNavigateToChessGame,

        leelaSongPlaying,
        setLeelaSongPlaying,

        showInfoModal,
        setShowInfoModal,
        infoModalDismissVisible,
        setInfoModalDismissVisible,
        infoModalText,
        setInfoModalText,
      }}
    >
      {children}
    </ArcadeMachineContext.Provider>
  );
};

export const useArcadeMachineContext = (): ArcadeMachineContextInterface => {
  const context = useContext(ArcadeMachineContext);
  if (context === undefined) {
    throw new Error(
      "ArcadeMachineContext must be within ArcadeMachineContextProvider"
    );
  }

  return context;
};
