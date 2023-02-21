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
  ethersProvider: ethers.providers.JsonRpcProvider | ethers.providers.Web3Provider;
  setEthersProvider: Dispatch<SetStateAction<ethers.providers.JsonRpcProvider | ethers.providers.Web3Provider>>;

  // --- Contract references ---
  bettingContractRef: MutableRefObject<BettingGame>;
  chessContractRef: MutableRefObject<Chess>;
  leelaContractRef: MutableRefObject<Leela>;
}

// --- Contract addresses ---
// TODO(ryancao): Change to mainnet!
const config = {
  LEELA_CONTRACT_ADDR: "0x4E7d06478930b646D886FfD49bE757BbA4945A7d",
  BETTING_CONTRACT_ADDR: "0x55Ad445A5801c63B89dab3283F10A1486C0dDB00",
  CHESS_CONTRACT_ADDR: "0x879bc79683F073EE52e9aA01a638f27CD3931135",
}

const ContractInteractionContext = createContext<IContractInteractionContext | undefined>(
  undefined
);


/**
 * Grabs ethers provider.
 * @returns 
 */
const getEthersProvider = (address?: string): ethers.providers.JsonRpcProvider | ethers.providers.Web3Provider => {
  // --- Provider from ethers.js allows us to talk to chain/wallet/etc ---
  // let ethersProvider: null | ethers.providers.Web3Provider = null;
  // if (window.ethereum) {
  //   // --- TODO(ryancao): Hacky hack for type checking??? ---
  //   ethersProvider = new ethers.providers.Web3Provider(<any>(window.ethereum));
  // }
  // --- Polygon testnet (Mumbai) Alchemy link ---
  // require('dotenv').config();
  // const { API_KEY, PRIVATE_KEY } = process.env;
  // const API_KEY = "C_2O4qksq2Ij6fSp8EJ8eu7qKKONEsuo";
  // console.log(`API URL IS: ${API_URL}`);
  // console.log("Grabbing the ethers provider (again?)!");
  // const API_URL = "http://127.0.0.1:8545/";
  const API_URL = "https://polygon-mumbai.g.alchemy.com/v2/C_2O4qksq2Ij6fSp8EJ8eu7qKKONEsuo";
  let ethersProvider = new ethers.providers.JsonRpcProvider(API_URL);

  // if (address !== undefined && window !== undefined && window.ethereum !== undefined) {
  //   const polygonMumbai = {
  //     name: "maticmum",
  //     chainId: 80001
  //   };
  //   const provider = new ethers.providers.Web3Provider(window.ethereum, polygonMumbai);
  //   console.log("Successfully got the web3 provider");
  //   return provider;
  // }
  // const provider = new ethers.providers.AlchemyProvider(polygonMumbai, API_KEY);
  // const owner = new ethers.Wallet(PRIVATE_KEY ?? "", provider);

  return ethersProvider;
  // return provider;
}

const getBettingContract = (address: string, alternateProvider?: ethers.providers.Web3Provider): BettingGame => {

  // --- If we have a Web3Provider AFTER user has logged in with Metamask ---
  if (alternateProvider !== undefined) {
    let bettingGameContract = BettingGame__factory.connect(config.BETTING_CONTRACT_ADDR, alternateProvider);
    if (address !== "") {
      const signer = alternateProvider.getSigner(address);
      bettingGameContract = BettingGame__factory.connect(config.BETTING_CONTRACT_ADDR, signer);
    }
    return bettingGameContract;
  } else {
    let ethersProvider = getEthersProvider(address);

    // --- Connect to contract ---
    let bettingGameContract = BettingGame__factory.connect(config.BETTING_CONTRACT_ADDR, ethersProvider);
    if (address !== "") {
      // console.log(`Connecting betting contract under ${address} address`);
      const account = ethersProvider.getSigner(address);
      bettingGameContract = BettingGame__factory.connect(config.BETTING_CONTRACT_ADDR, account);
    }
    return bettingGameContract;
  }
}

const getChessContract = (address: string, alternateProvider?: ethers.providers.Web3Provider): Chess => {
  // --- If we have a Web3Provider AFTER user has logged in with Metamask ---
  if (alternateProvider !== undefined) {
    let chessContract = Chess__factory.connect(config.CHESS_CONTRACT_ADDR, alternateProvider);
    if (address !== "") {
      const signer = alternateProvider.getSigner(address);
      chessContract = Chess__factory.connect(config.CHESS_CONTRACT_ADDR, signer);
    }
    return chessContract;
  } else {
    let ethersProvider = getEthersProvider(address);

    // --- Connect to contract ---
    let chessContract = Chess__factory.connect(config.CHESS_CONTRACT_ADDR, ethersProvider);
    if (address !== "") {
      const account = ethersProvider.getSigner(address);
      chessContract = Chess__factory.connect(config.CHESS_CONTRACT_ADDR, account);
    }
    return chessContract;
  }
}

const getLeelaContract = (address: string, alternateProvider?: ethers.providers.Web3Provider): Leela => {
  // --- If we have a Web3Provider AFTER user has logged in with Metamask ---
  if (alternateProvider !== undefined) {
    let leelaContract = Leela__factory.connect(config.LEELA_CONTRACT_ADDR, alternateProvider);
    if (address !== "") {
      const signer = alternateProvider.getSigner(address);
      leelaContract = Leela__factory.connect(config.LEELA_CONTRACT_ADDR, signer);
    }
    return leelaContract;
  } else {
    let ethersProvider = getEthersProvider(address);

    // --- Connect to contract ---
    let leelaContract = Leela__factory.connect(config.LEELA_CONTRACT_ADDR, ethersProvider);
    if (address !== "") {
      // console.log(`Connecting betting contract under ${address} address`);
      const account = ethersProvider.getSigner(address);
      leelaContract = Leela__factory.connect(config.LEELA_CONTRACT_ADDR, account);
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
  const bettingContractRef = useRef<BettingGame>(getBettingContract(""));
  const chessContractRef = useRef<Chess>(getChessContract(""));
  const leelaContractRef = useRef<Leela>(getLeelaContract(""));

  // --- Listen for when wallet address changes ---
  useEffect(useCallback(() => {
    // --- No wallet connected: Do nothing ---
    if (walletAddr === "") return;

    // --- Otherwise, update the contracts which are connected ---
    console.log(`Changing the contracts under wallet address ${walletAddr}`);
    if (ethersProvider instanceof ethers.providers.Web3Provider) {
      bettingContractRef.current = getBettingContract(walletAddr, ethersProvider);
      chessContractRef.current = getChessContract(walletAddr, ethersProvider);
      leelaContractRef.current = getLeelaContract(walletAddr, ethersProvider);
    } else {
      bettingContractRef.current = getBettingContract(walletAddr);
      chessContractRef.current = getChessContract(walletAddr);
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
