import {
  createContext,
  Dispatch,
  ReactNode,
  SetStateAction,
  useContext,
  useState,
} from 'react';

interface ArcadeMachineContextInterface {
  showGameDetails: boolean;
  setShowGameDetails: Dispatch<SetStateAction<boolean>>;

  showGameInstructions: boolean;
  setShowGameInstructions: Dispatch<SetStateAction<boolean>>;
}

const ArcadeMachineContext = createContext<
  ArcadeMachineContextInterface | undefined
>(undefined);

export const ArcadeMachineContextProvider = ({
  children,
}: {
  children: ReactNode;
}) => {
  const [showGameDetails, setShowGameDetails] = useState(false);
  const [showGameInstructions, setShowGameInstructions] = useState(false);

  return (
    <ArcadeMachineContext.Provider
      value={{
        showGameDetails,
        setShowGameDetails,
        showGameInstructions,
        setShowGameInstructions,
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
      'ArcadeMachineContext must be within ArcadeMachineContextProvider'
    );
  }

  return context;
};
