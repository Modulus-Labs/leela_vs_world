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
import { addresses } from '../utils/constants';

/**
 * For everything related to interacting with contracts.
 * This subsumes `interact.ts`, effectively.
 */
interface IContractInteractionContext {
  walletAddr: string;
  setWalletAddr: Dispatch<SetStateAction<string>>;
  ethersProvider: ethers.providers.JsonRpcProvider | ethers.providers.Web3Provider;
  setEthersProvider: Dispatch<SetStateAction<ethers.providers.JsonRpcProvider | ethers.providers.Web3Provider>>;

  // --- Contract references ---
  bettingContract: BettingGame;
  setBettingContract: Dispatch<SetStateAction<BettingGame>>;
  chessContract: Chess;
  setChessContract: Dispatch<SetStateAction<Chess>>;
  leelaContractRef: MutableRefObject<Leela>;
}

const ContractInteractionContext = createContext<IContractInteractionContext | undefined>(
  undefined
);


/**
 * Grabs ethers provider.
 * @returns 
 */
const getEthersProvider = (address?: string): ethers.providers.JsonRpcProvider | ethers.providers.Web3Provider => {
  // --- Polygon testnet (Mumbai) Alchemy link ---
  // require('dotenv').config();
  // const { API_KEY } = process.env;
  // console.log(`API URL IS: ${API_URL}`);
  // console.log("Grabbing the ethers provider (again?)!");
  // const API_URL = "http://127.0.0.1:8545/";
  const API_URL = `https://polygon-mumbai.g.alchemy.com/v2/-eJGoKkTEMre3-CY_NksLQhZX2-E7RZQ`;

  // --- Mainnet ---
  // const API_URL = `https://polygon-mainnet.g.alchemy.com/v2/T5jqKdcV4IPd7EwZ7X1W_ormA67wOlLb`;
  let ethersProvider = new ethers.providers.JsonRpcProvider(API_URL);
  return ethersProvider;
}

const getBettingContract = (address: string, alternateProvider?: ethers.providers.Web3Provider): BettingGame => {

  // --- If we have a Web3Provider AFTER user has logged in with Metamask ---
  if (alternateProvider !== undefined) {
    let bettingGameContract = BettingGame__factory.connect(addresses.BETTING_CONTRACT_ADDR, alternateProvider);
    if (address !== "") {
      const signer = alternateProvider.getSigner(address);
      bettingGameContract = BettingGame__factory.connect(addresses.BETTING_CONTRACT_ADDR, signer);
    }
    return bettingGameContract;
  } else {
    let ethersProvider = getEthersProvider(address);

    // --- Connect to contract ---
    let bettingGameContract = BettingGame__factory.connect(addresses.BETTING_CONTRACT_ADDR, ethersProvider);
    if (address !== "") {
      console.log(`Connecting betting contract under ${address} address`);
      const account = ethersProvider.getSigner(address);
      bettingGameContract = BettingGame__factory.connect(addresses.BETTING_CONTRACT_ADDR, account);
    }
    return bettingGameContract;
  }
}

const getChessContract = (address: string, alternateProvider?: ethers.providers.Web3Provider): Chess => {

  // --- If we have a Web3Provider AFTER user has logged in with Metamask ---
  if (alternateProvider !== undefined) {
    let chessContract = Chess__factory.connect(addresses.CHESS_CONTRACT_ADDR, alternateProvider);
    if (address !== "") {
      const signer = alternateProvider.getSigner(address);
      chessContract = Chess__factory.connect(addresses.CHESS_CONTRACT_ADDR, signer);
    }
    return chessContract;
  } else {
    let ethersProvider = getEthersProvider(address);

    // --- Connect to contract ---
    let chessContract = Chess__factory.connect(addresses.CHESS_CONTRACT_ADDR, ethersProvider);
    if (address !== "") {
      const account = ethersProvider.getSigner(address);
      chessContract = Chess__factory.connect(addresses.CHESS_CONTRACT_ADDR, account);
    }
    return chessContract;
  }
}

const getLeelaContract = (address: string, alternateProvider?: ethers.providers.Web3Provider): Leela => {
  // --- If we have a Web3Provider AFTER user has logged in with Metamask ---
  if (alternateProvider !== undefined) {
    let leelaContract = Leela__factory.connect(addresses.LEELA_CONTRACT_ADDR, alternateProvider);
    if (address !== "") {
      const signer = alternateProvider.getSigner(address);
      leelaContract = Leela__factory.connect(addresses.LEELA_CONTRACT_ADDR, signer);
    }
    return leelaContract;
  } else {
    let ethersProvider = getEthersProvider(address);

    // --- Connect to contract ---
    let leelaContract = Leela__factory.connect(addresses.LEELA_CONTRACT_ADDR, ethersProvider);
    if (address !== "") {
      // console.log(`Connecting betting contract under ${address} address`);
      const account = ethersProvider.getSigner(address);
      leelaContract = Leela__factory.connect(addresses.LEELA_CONTRACT_ADDR, account);
    }
    return leelaContract;
  }
}

export const ContractInteractionContextProvider = ({
  children,
}: {
  children: ReactNode;
}) => {

  // --- TODO(ryancao): Check if any refs or states should be flipped ---
  const [walletAddr, setWalletAddr] = useState<string>("");
  const [ethersProvider, setEthersProvider] = useState<ethers.providers.JsonRpcProvider | ethers.providers.Web3Provider>(getEthersProvider());
  const [bettingContract, setBettingContract] = useState<BettingGame>(getBettingContract(""));
  const [chessContract, setChessContract] = useState<Chess>(getChessContract(""));
  const leelaContractRef = useRef<Leela>(getLeelaContract(""));

  // --- Listen for when wallet address changes ---
  useEffect(useCallback(() => {
    // --- No wallet connected: Do nothing ---
    if (walletAddr === "") return;

    // --- Otherwise, update the contracts which are connected ---
    // console.log(`Changing the contracts under wallet address ${walletAddr}`);

    // --- Check for provider which works with Alchemy (ironically, not AlchemyProvider) ---
    if (ethersProvider instanceof ethers.providers.Web3Provider) {
      // --- Betting ---
      bettingContract.removeAllListeners();
      const newBettingContract = getBettingContract(walletAddr, ethersProvider);
      setBettingContract(newBettingContract);

      // --- Chess ---
      chessContract.removeAllListeners();
      const newChessContract = getChessContract(walletAddr, ethersProvider);
      setChessContract(newChessContract);

      // --- Leela ---
      leelaContractRef.current = getLeelaContract(walletAddr, ethersProvider);
    } else {
      // --- Betting ---
      bettingContract.removeAllListeners();
      const newBettingContract = getBettingContract(walletAddr);
      setBettingContract(newBettingContract);

      // --- Chess ---
      chessContract.removeAllListeners();
      const newChessContract = getChessContract(walletAddr);
      setChessContract(newChessContract);

      // --- Leela ---
      leelaContractRef.current = getLeelaContract(walletAddr);
    }

  }, [walletAddr, ethersProvider]), [walletAddr, ethersProvider]);

  return (
    <ContractInteractionContext.Provider
      value={{
        // --- Stateful things (wallet, provider) ---
        walletAddr,
        setWalletAddr,
        ethersProvider,
        setEthersProvider,

        // --- Contract references ---
        bettingContract,
        setBettingContract,
        chessContract,
        setChessContract,
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
