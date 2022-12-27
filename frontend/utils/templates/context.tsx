import {
  createContext,
  Dispatch,
  ReactNode,
  SetStateAction,
  useContext,
  useState,
} from "react";

interface NAME_ContextInterface {}

const NAME_Context = createContext<NAME_ContextInterface | undefined>(
  undefined
);

export const NAME_ContextProvider = ({ children }: { children: ReactNode }) => {
  return <NAME_Context.Provider value={{}}>{children}</NAME_Context.Provider>;
};

export const useNAME_Context = (): NAME_ContextInterface => {
  const context = useContext(NAME_Context);
  if (context === undefined) {
    throw new Error("NAME_Context must be within NAME_ContextProvider");
  }

  return context;
};
