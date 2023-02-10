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
  LEELA_CONTRACT_ADDR: "0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0",
  BETTING_CONTRACT_ADDR: "0xCf7Ed3AccA5a467e9e704C703E8D87F634fB0Fc9",
  CHESS_CONTRACT_ADDR: "0xDc64a140Aa3E981100a9becA4E685f962f0cF6C9",
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

const getBettingContract = (address: string): BettingGame => {
  let ethersProvider = getEthersProvider();

  // --- Connect to contract ---
  let bettingGameContract = BettingGame__factory.connect(config.BETTING_CONTRACT_ADDR, ethersProvider);
  if (address !== "") {
    // console.log(`Connecting betting contract under ${address} address`);
    const account = ethersProvider.getSigner(address);
    bettingGameContract = BettingGame__factory.connect(config.BETTING_CONTRACT_ADDR, account);
  }
  return bettingGameContract;
}

const getChessContract = (address: string): Chess => {
  let ethersProvider = getEthersProvider();

  // --- Connect to contract ---
  let chessGameContract = Chess__factory.connect(config.CHESS_CONTRACT_ADDR, ethersProvider);
  if (address !== "") {
    const account = ethersProvider.getSigner(address);
    chessGameContract = Chess__factory.connect(config.CHESS_CONTRACT_ADDR, account);
  }
  return chessGameContract;
}

const getLeelaContract = (address: string): Leela => {
  let ethersProvider = getEthersProvider();

  // --- Connect to contract ---
  let leelaGameContract = Leela__factory.connect(config.LEELA_CONTRACT_ADDR, ethersProvider);
  if (address !== "") {
    const account = ethersProvider.getSigner(address);
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
    console.log(`Changing the contracts under wallet address ${walletAddr}`);
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
