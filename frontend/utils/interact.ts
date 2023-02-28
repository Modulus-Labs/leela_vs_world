import { ethers } from "ethers";

// --- TODO(ryancao): Figure out what these contract addresses are ---
// --- Polygon testnet ---
const config = {
  LEELA_CONTRACT_ADDR: "0x9E18aDc813d6b5b033d16AfE8C44C879B174c434",
  BETTING_CONTRACT_ADDR: "0xCEf7acD91D1385E6e7142d90d8831e468489d5D8",
  CHESS_CONTRACT_ADDR: "0x89510ce94Ab5491740eF3B05206C5488295b6f89",
}

// --- Localhost ---
// const config = {
//   LEELA_CONTRACT_ADDR: "0xDc64a140Aa3E981100a9becA4E685f962f0cF6C9",
//   BETTING_CONTRACT_ADDR: "0x5FbDB2315678afecb367f032d93F642f64180aa3",
//   CHESS_CONTRACT_ADDR: "0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512",
// }

/**
 * Hook up against chess contract:
    Grab board state from contract and place into frontend board state
    Grab timer from contract and place into frontend timer
 * Hook up against betting contract:
    Grab betting pool state from contract and place into frontend pool state
    Grab leaderboard state from contract and load into frontend leaderboard
    Grab purchased power state from contract and display on frontend
    Submit power purchase to contract and have that be reflected on frontend
    Submit move to contract and have that be reflected on leaderboard
 */

/**
 * Grabs the current ethers provider, if exists.
 * @returns 
 */
const getEthersProvider = () => {
  // --- Provider from ethers.js allows us to talk to chain/wallet/etc ---
  // let ethersProvider: null | ethers.providers.Web3Provider = null;
  // if (window.ethereum) {
  //   // --- TODO(ryancao): Hacky hack for type checking??? ---
  //   ethersProvider = new ethers.providers.Web3Provider(<any>(window.ethereum));
  // }
  // require('dotenv').config();
  // const { API_KEY } = process.env;
  const API_URL = `https://polygon-mumbai.g.alchemy.com/v2/-eJGoKkTEMre3-CY_NksLQhZX2-E7RZQ`;
  // console.log(`API URL IS: ${API_URL}`);
  // console.log("Grabbing the ethers provider (again?)!");
  // const API_URL = "http://127.0.0.1:8545/";
  let ethersProvider = new ethers.providers.JsonRpcProvider(API_URL);
  return ethersProvider;
}

// /**
//  * Calls the chess contract via ethers and reads the board state from it.
//  */
// export const getBoardStateFromChessContract = (): Promise<[BigNumber, number, number, boolean, number, number]> | null => {
//   let ethersProvider = getEthersProvider();

//   if (ethersProvider != null) {

//     // --- Grab owner, connect to contract, call function ---
//     const chessGameContract = Chess__factory.connect(config.CHESS_CONTRACT_ADDR, ethersProvider);
//     const chessGameStateRequest = chessGameContract.getChessGameState();

//     // --- Grab result, feed back to caller ---
//     return chessGameStateRequest;
//   } else {
//     return null;
//   }
// }

// /**
//  * Grabs the pool state + timer from the betting contract.
//  * This does NOT require the user to be logged in!
//  */
// export const getBettingPoolStateFromBettingContract = (): Promise<[BigNumber, BigNumber, BigNumber]> | null => {
//   let ethersProvider = getEthersProvider();
//   if (ethersProvider != null) {

//     // --- Connect to contract, call function ---
//     const bettingGameContract = BettingGame__factory.connect(config.BETTING_CONTRACT_ADDR, ethersProvider);
//     const bettingGamePoolRequest = bettingGameContract.getFrontEndPoolState();
//     return bettingGamePoolRequest;

//   } else {
//     return null;
//   }
// }

// /**
//  * Grabs the move leaderboard + number of votes from the betting contract.
//  * This does NOT require the user to be logged in!
//  * @returns 
//  */
// export const getMoveLeaderboardStateFromBettingContract = (): Promise<[number[], BigNumber[]]> | null => {
//   let ethersProvider = getEthersProvider();
//   if (ethersProvider != null) {
//     // --- Connect to contract, call function ---
//     const bettingGameContract = BettingGame__factory.connect(config.BETTING_CONTRACT_ADDR, ethersProvider);
//     // console.log("Getting current moves and votes!");
//     const bettingGamePoolRequest = bettingGameContract.getCurMovesAndVotes();
//     return bettingGamePoolRequest;
//   } else {
//     return null;
//   }
// }

// /**
//  * Grabs the user's Leela and world stakes. This requires the user to be logged in!
//  * @param userAddr 
//  * @returns 
//  */
// export const getUserStakeFromBettingContract = (userAddr: string): Promise<[BigNumber, BigNumber]> | null => {
//   let ethersProvider = getEthersProvider();
//   if (ethersProvider != null) {
//     const owner = ethersProvider.getSigner(userAddr);
//     // console.log(`Owner is coming from ${userAddr}!`);
//     const bettingGameContract = BettingGame__factory.connect(config.BETTING_CONTRACT_ADDR, owner);
//     const userStakeRequest = bettingGameContract.getUserStakeState(userAddr, { gasLimit: 1e7 });
//     return userStakeRequest;
//   } else {
//     return null;
//   }
// }

// /**
//  * Votes on the given move by the user.
//  * @param userAddr 
//  * @param move 
//  * @returns 
//  */
// export const voteForMove = (userAddr: string, move: number) => {
//   let ethersProvider = getEthersProvider();
//   const owner = ethersProvider.getSigner(userAddr);
//   const bettingGameContract = BettingGame__factory.connect(config.BETTING_CONTRACT_ADDR, owner);
//   const voteWorldMoveRequest = bettingGameContract.voteWorldMove(move, { gasLimit: 1e7 });
//   return voteWorldMoveRequest;
// }

// /**
//  * Returns which move user voted for this round (or 0 if none)
//  * @param userAddr 
//  * @returns 
//  */
// export const getUserVotedMove = (userAddr: string): Promise<number> => {
//   let ethersProvider = getEthersProvider();
//   const owner = ethersProvider.getSigner(userAddr);
//   const bettingGameContract = BettingGame__factory.connect(config.BETTING_CONTRACT_ADDR, owner);
//   const userVotedMoveRequest = bettingGameContract.userVotedMove();
//   return userVotedMoveRequest;
// }

// /**
//  * Returns Leela's last move played (or 0 if none)
//  * @returns 
//  */
// export const getLastLeelaMove = (): Promise<number> => {
//   let ethersProvider = getEthersProvider();
//   const bettingGameContract = BettingGame__factory.connect(config.BETTING_CONTRACT_ADDR, ethersProvider);
//   const leelaLastMoveRequest = bettingGameContract.leelaMove();
//   return leelaLastMoveRequest;
// }

// /**
//  * Votes on a particular move for the user for this turn.
//  * @param userAddr 
//  * @param move 
//  * @returns 
//  */
// export const voteWorldMove = (userAddr: string, move: number) => {
//   let ethersProvider = getEthersProvider();
//   const owner = ethersProvider.getSigner(userAddr);
//   const bettingGameContract = BettingGame__factory.connect(config.BETTING_CONTRACT_ADDR, owner);
//   const voteWorldMoveRequest = bettingGameContract.voteWorldMove(move, { gasLimit: 1e7 });
//   return voteWorldMoveRequest;
// }

// /**
//  * Buys power, staking on either Leela/World winning.
//  * @param userAddr 
//  * @param amount 
//  * @param betOnLeela 
//  * @returns 
//  */
// export const addStake = (userAddr: string, amount: number, betOnLeela: boolean) => {
//   let ethersProvider = getEthersProvider();
//   const owner = ethersProvider.getSigner(userAddr);
//   const bettingGameContract = BettingGame__factory.connect(config.BETTING_CONTRACT_ADDR, owner);
//   const addStakeRequest = bettingGameContract.addStake(betOnLeela, { gasLimit: 1e7, value: ethers.utils.parseUnits(amount.toString(), "ether") });
//   return addStakeRequest;
// }

// --------------------------------------------------------------

/**
 * @returns Currently connected network
 */
// export const getCurrentConnectedNetwork = async (): Promise<ethers.providers.Network> => {

//   // --- Unfortunate check we must do ---
//   // --- Provider from ethers.js allows us to talk to chain/wallet/etc ---
//   let ethersProvider = getEthersProvider();
//   if (ethersProvider === null) return { name: "", chainId: -1 };
//   const network = await ethersProvider.getNetwork();
//   return network;
// }

/**
 * Returns the current balance of the given Eth account to the user.
 * @param {*} walletAddress 
 * @returns 
 */
// export const getCurrentBalanceDisplay = async (walletAddress: string): Promise<string> => {

//   // --- Unfortunate check we must do ---
//   // --- Provider from ethers.js allows us to talk to chain/wallet/etc ---
//   let ethersProvider = getEthersProvider();
//   if (ethersProvider === null) return "";

//   // balance (in Wei): { BigNumber: "182826475815887608" }
//   const balance: ethers.BigNumber = await ethersProvider.getBalance(walletAddress);

//   // --- Return the amount in Eth as a string representation ---
//   return ethers.utils.formatEther(balance);
// }

export const connectWallet = async () => {
  // --- Checks to see if the user's browser has Metamask enabled...
  // --- (Metamask injects a global `ethereum` object)
  if (window.ethereum) {
    try {

      try {
        // --- First try to switch to connecting to Polygon Testnet ---
        // TODO(ryancao): Switch this to mainnet!
        // const swappedChain = await window.ethereum.request({
        //   method: 'wallet_switchEthereumChain',
        //   params: [{ chainId: '0x13881' }],
        // });
        const swappedChain = await window.ethereum.request({
          method: 'wallet_switchEthereumChain',
          params: [{ chainId: '0x89' }],
        });
      } catch (error: any) {
        // TODO(ryancao): Check that this works!
        if (error.code === 4902) {
          try {
            await window.ethereum.request({
              // @ts-ignore (not sure why this isn't considered a function)
              method: 'wallet_addEthereumChain',
              params: [
                {
                  chainId: '0x89',
                  // @ts-ignore (change this to mainnet!)
                  // rpcUrl: "https://polygon-mumbai.g.alchemy.com/v2/C_2O4qksq2Ij6fSp8EJ8eu7qKKONEsuo",
                  rpcUrls: ["https://polygon-mainnet.g.alchemy.com/v2/T5jqKdcV4IPd7EwZ7X1W_ormA67wOlLb"],
                },
              ],
            });
          } catch (addError) {
            console.error(addError);
          }
        }
        console.error(error);
      }

      // --- Returns an array containing all of the user's account
      // --- addresses connected to the dApp. We only use the first one.
      const addressArray = await window.ethereum.request({
        method: "eth_requestAccounts",
      });

      // --- Getting the actual provider which works on Polygon Mumbai ---
      // TODO(ryancao): Switch this to mainnet
      // const polygonMumbai = {
      //   name: "maticmum",
      //   chainId: 80001
      // };
      const polygonMainnet = {
        name: "matic",
        chainId: 137,
      }
      // @ts-ignore
      const provider = new ethers.providers.Web3Provider(window.ethereum, polygonMainnet);

      // --- Localhost ---
      // const provider = new ethers.providers.JsonRpcProvider("http://127.0.0.1:8545/");

      const obj = {
        status: "Your wallet has been connected!",
        address: addressArray[0],
        provider: provider,
      };
      return obj;
    } catch (error: any) {
      return {
        status: error.message,
        address: null,
        provider: null,
      }
    }

    // --- Otherwise, tell the user they must install Metamask with eth ---
  } else {
    return {
      address: null,
      status: "You must install MetaMask, a virtual Ethereum wallet, in your browser.",
      provider: null,
    }
  }
};

/**
 * Returns the current (connected) wallet, if user has already connected
 * once before and Metamask within browser saves this.
 */
export const getCurrentWalletConnected = async () => {
  if (window.ethereum) {
    try {
      const addressArray = await window.ethereum.request({
        method: "eth_accounts",
      });

      // --- If wallet is already connected ---
      if (addressArray.length > 0) {
        return {
          address: addressArray[0],
          status: "Your wallet has been connected!",
        }

        // --- Otherwise, prompt user to connect ---
      } else {
        return {
          address: null,
          status: "Connect to MetaMask using the top right button.",
        }
      }
    } catch (error: any) {
      return {
        address: null,
        status: error.message,
      }
    }

    // --- Similarly, on user needing to install Metamask with eth ---
  } else {
    return {
      address: "",
      status: "You must install MetaMask, a virtual Ethereum wallet, in your browser."
    }
  }
};