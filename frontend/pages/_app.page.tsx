import '../styles/globals.css';
import type { AppProps } from 'next/app';
import { ArcadeMachineContextProvider } from '../contexts/ArcadeMachineContext';
import { MediaQueryContextProvider } from '../contexts/MediaQueryContext';
import { ChessGameContextProvider } from '../contexts/ChessGameContext';
import { BettingContextProvider } from '../contexts/BettingContext';

export default function App({ Component, pageProps }: AppProps) {
  return (
    <MediaQueryContextProvider>
      <ArcadeMachineContextProvider>
        <BettingContextProvider>
          <ChessGameContextProvider>
            <BettingContextProvider>
              <Component {...pageProps} />
            </BettingContextProvider>
          </ChessGameContextProvider>
        </BettingContextProvider>
      </ArcadeMachineContextProvider>
    </MediaQueryContextProvider>
  );
}
