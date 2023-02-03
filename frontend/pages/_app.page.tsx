import '../styles/globals.css';
import '@rainbow-me/rainbowkit/styles.css';

import type { AppProps } from 'next/app';
import { ArcadeMachineContextProvider } from '../contexts/ArcadeMachineContext';
import { MediaQueryContextProvider } from '../contexts/MediaQueryContext';
import { ChessGameContextProvider } from '../contexts/ChessGameContext';
import { BettingContextProvider } from '../contexts/BettingContext';

import { getDefaultWallets, RainbowKitProvider } from '@rainbow-me/rainbowkit';
import { configureChains, createClient, WagmiConfig } from 'wagmi';
import { goerli, hardhat } from 'wagmi/chains';
import { alchemyProvider } from 'wagmi/providers/alchemy';
import { publicProvider } from 'wagmi/providers/public';

const ALCHEMY_API_KEY = process.env.ALCHEMY_API_KEY || '0xkey';

const { chains, provider } = configureChains(
  [goerli, hardhat],
  [
    // Public provider is prioritized in dev
    // Alchemy provider is prioritized in prod
    publicProvider({
      priority: process.env.NODE_ENV === 'production' ? 1 : 0,
    }),
    alchemyProvider({
      apiKey: ALCHEMY_API_KEY,
      priority: process.env.NODE_ENV === 'production' ? 0 : 1,
    }),
  ]
);

const { connectors } = getDefaultWallets({
  appName: 'leela-vs-world',
  chains,
});

const wagmiClient = createClient({
  autoConnect: true,
  connectors,
  provider,
});

export default function App({ Component, pageProps }: AppProps) {
  return (
    <MediaQueryContextProvider>
      <WagmiConfig client={wagmiClient}>
        <RainbowKitProvider chains={chains}>
          <ArcadeMachineContextProvider>
            <BettingContextProvider>
              <ChessGameContextProvider>
                <BettingContextProvider>
                  <Component {...pageProps} />
                </BettingContextProvider>
              </ChessGameContextProvider>
            </BettingContextProvider>
          </ArcadeMachineContextProvider>
        </RainbowKitProvider>
      </WagmiConfig>
    </MediaQueryContextProvider>
  );
}
