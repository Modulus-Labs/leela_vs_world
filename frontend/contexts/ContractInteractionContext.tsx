import { BigNumber, ethers } from 'ethers';
import {
  createContext,
  Dispatch,
  MutableRefObject,
  ReactNode,
  SetStateAction,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react';
import { BettingGame, BettingGame__factory, Chess, Chess__factory, Leela, Leela__factory } from '../typechain-types';

/**
 * For everything related to interacting with contracts.
 * This subsumes `interact.ts`, effectively.
 */
interface IContractInteractionContext {
  walletAddr: string;
  setWalletAddr: Dispatch<SetStateAction<string>>;
  ethersProvider: ethers.providers.JsonRpcProvider;

  // --- Contract references ---
  bettingContractRef: MutableRefObject<BettingGame>;
  chessContractRef: MutableRefObject<Chess>;
  leelaContractRef: MutableRefObject<Leela>;
}

// --- Contract addresses ---
// TODO(ryancao): Change to mainnet!
const config = {
  LEELA_CONTRACT_ADDR: "0x4C4a2f8c81640e47606d3fd77B353E87Ba015584",
  BETTING_CONTRACT_ADDR: "0x21dF544947ba3E8b3c32561399E88B52Dc8b2823",
  CHESS_CONTRACT_ADDR: "0x2E2Ed0Cfd3AD2f1d34481277b3204d807Ca2F8c2",
}

const ContractInteractionContext = createContext<IContractInteractionContext | undefined>(
  undefined
);


/**
 * Grabs ethers provider.
 * @returns 
 */
const getEthersProvider = () => {
  // --- Provider from ethers.js allows us to talk to chain/wallet/etc ---
  // let ethersProvider: null | ethers.providers.Web3Provider = null;
  // if (window.ethereum) {
  //   // --- TODO(ryancao): Hacky hack for type checking??? ---
  //   ethersProvider = new ethers.providers.Web3Provider(<any>(window.ethereum));
  // }
  // const API_URL = "https://polygon-mumbai.g.alchemy.com/v2/C_2O4qksq2Ij6fSp8EJ8eu7qKKONEsuo";
  // console.log(`API URL IS: ${API_URL}`);
  // console.log("Grabbing the ethers provider (again?)!");
  const API_URL = "http://127.0.0.1:8545/";
  let ethersProvider = new ethers.providers.JsonRpcProvider(API_URL);
  return ethersProvider;
}

const getBettingContract = (walletAddr: string): BettingGame => {
  let ethersProvider = getEthersProvider();

  // --- Connect to contract ---
  let bettingGameContract = BettingGame__factory.connect(config.BETTING_CONTRACT_ADDR, ethersProvider);
  if (walletAddr !== "") {
    const account = ethersProvider.getSigner(walletAddr);
    bettingGameContract = BettingGame__factory.connect(config.BETTING_CONTRACT_ADDR, account);
  }
  return bettingGameContract;
}

const getChessContract = (walletAddr: string): Chess => {
  let ethersProvider = getEthersProvider();

  // --- Connect to contract ---
  let chessGameContract = Chess__factory.connect(config.CHESS_CONTRACT_ADDR, ethersProvider);
  if (walletAddr !== "") {
    const account = ethersProvider.getSigner(walletAddr);
    chessGameContract = Chess__factory.connect(config.CHESS_CONTRACT_ADDR, account);
  }
  return chessGameContract;
}

const getLeelaContract = (walletAddr: string): Leela => {
  let ethersProvider = getEthersProvider();

  // --- Connect to contract ---
  let leelaGameContract = Leela__factory.connect(config.LEELA_CONTRACT_ADDR, ethersProvider);
  if (walletAddr !== "") {
    const account = ethersProvider.getSigner(walletAddr);
    leelaGameContract = Leela__factory.connect(config.LEELA_CONTRACT_ADDR, account);
  }
  return leelaGameContract;
}

export const ContractInteractionContextProvider = ({
  children,
}: {
  children: ReactNode;
}) => {

  // --- TODO(ryancao): Check if any refs or states should be flipped ---
  const [walletAddr, setWalletAddr] = useState<string>("");
  const [ethersProvider, setEthersProvider] = useState<ethers.providers.JsonRpcProvider>(getEthersProvider());
  const bettingContractRef = useRef<BettingGame>(getBettingContract(""));
  const chessContractRef = useRef<Chess>(getChessContract(""));
  const leelaContractRef = useRef<Leela>(getLeelaContract(""));

  // --- Listen for when wallet address changes ---
  useEffect(useCallback(() => {
    // --- No wallet connected: Do nothing ---
    if (walletAddr === "") return;

    // --- Otherwise, update the contracts which are connected ---
    bettingContractRef.current = getBettingContract(walletAddr);
    chessContractRef.current = getChessContract(walletAddr);
    leelaContractRef.current = getLeelaContract(walletAddr);

  }, [walletAddr]), [walletAddr]);

  return (
    <ContractInteractionContext.Provider
      value={{
        // --- Stateful things (wallet, provider) ---
        walletAddr,
        setWalletAddr,
        ethersProvider,

        // --- Contract references ---
        bettingContractRef,
        chessContractRef,
        leelaContractRef,
      }}
    >
      {children}
    </ContractInteractionContext.Provider>
  );
};

export const useContractInteractionContext = (): IContractInteractionContext => {
  const context = useContext(ContractInteractionContext);
  if (context === undefined) {
    throw new Error(
      'ContractInteractionContext must be within ContractInteractionContextProvider'
    );
  }

  return context;
};
