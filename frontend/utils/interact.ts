import { BigNumber, ethers } from "ethers";
import { BettingGame__factory } from "../typechain-types";
import { Chess__factory } from "../typechain-types";
// import { RockafellerBotL1__factory } from "../typechain-types/factories/contracts/RockafellerBotL1.sol/RockafellerBotL1__factory";
// import l1_abi from "./L1_abi.json";
// import emoji from "node-emoji";

// --- TODO(ryancao): Figure out what these contract addresses are ---
/** THIS IS FOR POLYGON TESTNET (MUMBAI)
 * Compiled 10 Solidity files successfully
 * Leela Contract deployed to address:  0x053dA459937fbF9051dB05DeeCE408ee05C496bA
 * Betting Contract deployed to address:  0xF726450B8bfe55Da3ADe09171958791E810b3EE4
 * Chess Contract deployed to address:  0xfb1Ba163aB7551dEEb0819184EF9615b2cBb0E1b
 * 
 * THIS IS FOR LOCALHOST NETWORK
Leela Contract deployed to address:  0x8A791620dd6260079BF849Dc5567aDC3F2FdC318
Betting Contract deployed to address:  0x610178dA211FEF7D417bC0e6FeD39F05609AD788
Chess Contract deployed to address:  0xB7f8BC63BbcaD18155201308C8f3540b07f84F5e
 */
const config = {
  LEELA_CONTRACT_ADDR: "0x0DCd1Bf9A1b36cE34237eEaFef220932846BCD82",
  BETTING_CONTRACT_ADDR: "0x9A676e781A523b5d0C0e43731313A708CB607508",
  CHESS_CONTRACT_ADDR: "0x0B306BF915C4d645ff596e518fAf3F9669b97016",
}


// export const donateToRocky = async (
//   amount: number,
//   openModalFn: (text: string, canDismiss: boolean) => void) => {

//   // --- Unfortunate check we must do ---
//   // --- Provider from ethers.js allows us to talk to chain/wallet/etc ---
//   let ethersProvider: null | ethers.providers.Web3Provider = null;
//   if (window.ethereum) {
//     // --- TODO(ryancao): Hacky hack for type checking??? ---
//     ethersProvider = new ethers.providers.Web3Provider(<any>(window.ethereum));
//   }

//   if (ethersProvider != null) {

//     // --- Grab the current signer and create USDC/WETH contract ---
//     const owner = ethersProvider.getSigner();
//     const tokenContractAddress = tokenType === "USDC" ? usdcAddress : wethAddress;
//     let tokenContract = new ethers.Contract(tokenContractAddress, l1_abi, owner);

//     const RfB = RockafellerBotL1__factory.connect(config.L1_CONTRACT_ADDR, owner);

//     // --- Grab the user's amounts of funds ---
//     openModalFn("Waiting for Metamask confirmation of funds access... " + emoji.get("woman-running"), false);
//     let approveFundsAccessPromise = tokenContract.connect(owner).approve(RfB.address, nativeUnitAmt);

//     approveFundsAccessPromise.then((approveFundsAccessObj: any) => {

//       // console.log("approveFundsAccessObj");
//       // console.log(approveFundsAccessObj);
//       openModalFn(`Thanks for confirming! Waiting on tx (${approveFundsAccessObj.hash})... ` + emoji.get("man-running"), false);

//       // --- Wait for the tx to finish approving ---
//       approveFundsAccessObj.wait().then((approved: any) => {
//         console.log("Approved");
//         console.log(approved);

//         openModalFn("Granted funds access! Next transaction will be to actually donate... " + emoji.get("grin"), false);
//         const addFundsTransPromise = RfB.addFunds(tokenTypeToBitMapping[tokenType], nativeUnitAmt, { gasLimit: 100000 });
//         addFundsTransPromise.then((result: any) => {
//           openModalFn(`Donation tx sent! Waiting for confirmation... (${result.hash}) ` + emoji.get("thinking_face"), false);
//           result.wait().then(() => {
//             openModalFn(`Donation confirmed!! (${result.hash}) Thank you for your generous donation of ${amount} ${tokenType} to Rocky ` + emoji.get("crown") + ` Refresh the page in a moment to see your contribution on the leaderboard! #keeprockyalive`, true);
//           })
//             .catch((resultWaitError: any) => {
//               // console.error("Error confirming transaction");
//               // console.error(resultWaitError);
//               openModalFn(`Error: ${resultWaitError.message}`, true);
//               return;
//             });
//         })
//           .catch((fundAddError: any) => {
//             // console.error("Error adding funds");
//             // console.error(fundAddError);
//             openModalFn(`Error: ${fundAddError.message}`, true);
//             return;
//           });
//       })
//         .catch((error: any) => {

//         })
//     })
//       .catch((error: any) => {
//         // console.error("Disapproved or some other error");
//         openModalFn(`Error: ${error.message}`, true);
//         return;
//       });

//   }
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
  // const API_URL = "https://polygon-mumbai.g.alchemy.com/v2/C_2O4qksq2Ij6fSp8EJ8eu7qKKONEsuo";
  // console.log(`API URL IS: ${API_URL}`);
  const API_URL = "http://127.0.0.1:8545/";
  let ethersProvider = new ethers.providers.JsonRpcProvider(API_URL);
  return ethersProvider;
}

/**
 * Calls the chess contract via ethers and reads the board state from it.
 */
export const getBoardStateFromChessContract = (): Promise<[BigNumber, number, number, boolean, number, number]> | null => {
  let ethersProvider = getEthersProvider();

  if (ethersProvider != null) {

    // --- Grab owner, connect to contract, call function ---
    const chessGameContract = Chess__factory.connect(config.CHESS_CONTRACT_ADDR, ethersProvider);
    const chessGameStateRequest = chessGameContract.getChessGameState();

    // --- Grab result, feed back to caller ---
    return chessGameStateRequest;
  } else {
    return null;
  }
}

/**
 * Grabs the pool state + timer from the betting contract.
 * This does NOT require the user to be logged in!
 */
export const getBettingPoolStateFromBettingContract = (): Promise<[BigNumber, BigNumber, BigNumber]> | null => {
  let ethersProvider = getEthersProvider();
  if (ethersProvider != null) {

    // --- Connect to contract, call function ---
    const bettingGameContract = BettingGame__factory.connect(config.BETTING_CONTRACT_ADDR, ethersProvider);
    const bettingGamePoolRequest = bettingGameContract.getFrontEndPoolState();
    return bettingGamePoolRequest;

  } else {
    return null;
  }
}

/**
 * Grabs the move leaderboard + number of votes from the betting contract.
 * This does NOT require the user to be logged in!
 * @returns 
 */
export const getMoveLeaderboardStateFromBettingContract = (): Promise<[number[], BigNumber[]]> | null => {
  let ethersProvider = getEthersProvider();
  if (ethersProvider != null) {
    // --- Connect to contract, call function ---
    const bettingGameContract = BettingGame__factory.connect(config.BETTING_CONTRACT_ADDR, ethersProvider);
    const bettingGamePoolRequest = bettingGameContract.getCurMovesAndVotes();
    return bettingGamePoolRequest;
  } else {
    return null;
  }
}

// --------------------------------------------------------------

/**
 * @returns Currently connected network
 */
export const getCurrentConnectedNetwork = async (): Promise<ethers.providers.Network> => {

  // --- Unfortunate check we must do ---
  // --- Provider from ethers.js allows us to talk to chain/wallet/etc ---
  let ethersProvider = getEthersProvider();
  if (ethersProvider === null) return { name: "", chainId: -1 };
  const network = await ethersProvider.getNetwork();
  return network;
}

/**
 * Returns the current balance of the given Eth account to the user.
 * @param {*} walletAddress 
 * @returns 
 */
export const getCurrentBalanceDisplay = async (walletAddress: string): Promise<string> => {

  // --- Unfortunate check we must do ---
  // --- Provider from ethers.js allows us to talk to chain/wallet/etc ---
  let ethersProvider = getEthersProvider();
  if (ethersProvider === null) return "";

  // balance (in Wei): { BigNumber: "182826475815887608" }
  const balance: ethers.BigNumber = await ethersProvider.getBalance(walletAddress);

  // --- Return the amount in Eth as a string representation ---
  return ethers.utils.formatEther(balance);
}

export const connectWallet = async () => {
  // --- Checks to see if the user's browser has Metamask enabled...
  // --- (Metamask injects a global `ethereum` object)
  if (window.ethereum) {
    try {
      // --- Returns an array containing all of the user's account
      // --- addresses connected to the dApp. We only use the first one.
      const addressArray = await window.ethereum.request({
        method: "eth_requestAccounts",
      });
      const obj = {
        status: "Your wallet has been connected!",
        address: addressArray[0]
      };
      return obj;
    } catch (error: any) {
      return {
        status: error.message,
        address: null,
      }
    }

    // --- Otherwise, tell the user they must install Metamask with eth ---
  } else {
    return {
      address: null,
      status: "You must install MetaMask, a virtual Ethereum wallet, in your browser."
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