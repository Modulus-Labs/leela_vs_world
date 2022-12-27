import {
  createContext,
  Dispatch,
  ReactNode,
  SetStateAction,
  useContext,
  useState,
} from 'react';
import { useMediaQuery } from 'react-responsive';

interface MediaQueryContextInterface {
  isDesktop: boolean;
  isLaptop: boolean;
  isTablet: boolean;
  isMobile: boolean;
}

const MediaQueryContext = createContext<MediaQueryContextInterface | undefined>(
  undefined
);

export const MediaQueryContextProvider = ({
  children,
}: {
  children: ReactNode;
}) => {
  const isDesktop = useMediaQuery({ query: '(max-width: 1750px)' });
  const isLaptop = useMediaQuery({ query: '(max-width: 1024px)' });
  const isTablet = useMediaQuery({ query: '(max-width: 768px)' });
  const isMobile = useMediaQuery({ query: '(max-width: 480px)' });

  return (
    <MediaQueryContext.Provider
      value={{
        isDesktop,
        isLaptop,
        isTablet,
        isMobile,
      }}
    >
      {children}
    </MediaQueryContext.Provider>
  );
};

export const useMediaQueryContext = (): MediaQueryContextInterface => {
  const context = useContext(MediaQueryContext);
  if (context === undefined) {
    throw new Error(
      'MediaQueryContext must be within MediaQueryContextProvider'
    );
  }

  return context;
};
