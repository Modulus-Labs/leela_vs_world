import { ethers } from "hardhat";
import { BettingGame__factory } from "../typechain-types";
import { Chess__factory } from "../typechain-types";

/**
 * From Hardhat
 * Account #0: 0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266 (10000 ETH)
 * Private Key: 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80
 * Account #1: 0x70997970C51812dc3A010C7d01b50e0d17dc79C8 (10000 ETH)
 * Private Key: 0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d
 */

// --- TODO(ryancao): Figure out what these contract addresses are ---
/** THIS IS FOR POLYGON TESTNET (MUMBAI)
 * Compiled 10 Solidity files successfully
 * Leela Contract deployed to address:  0x053dA459937fbF9051dB05DeeCE408ee05C496bA
 * Betting Contract deployed to address:  0xF726450B8bfe55Da3ADe09171958791E810b3EE4
 * Chess Contract deployed to address:  0xfb1Ba163aB7551dEEb0819184EF9615b2cBb0E1b
 */
const config = {
  LEELA_CONTRACT_ADDR: "0x0DCd1Bf9A1b36cE34237eEaFef220932846BCD82",
  BETTING_CONTRACT_ADDR: "0x9A676e781A523b5d0C0e43731313A708CB607508",
  CHESS_CONTRACT_ADDR: "0x0B306BF915C4d645ff596e518fAf3F9669b97016",
}

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

const initializeLocalChessContractDeployment = async () => {
  const ethersProvider = getEthersProvider();
  const owner = ethersProvider.getSigner();
  console.log(`owner with address: ${await owner.getAddress()}`);

  // --- Connect to betting contract, call initialize function (this also initializes chess + leela) ---
  const bettingContract = BettingGame__factory.connect(config.BETTING_CONTRACT_ADDR, owner);
  await bettingContract.initialize(config.CHESS_CONTRACT_ADDR, config.LEELA_CONTRACT_ADDR, 1000, { gasLimit: 1e7 });

  // --- Try and grab the current board state from the contract ---
  const chessContract = Chess__factory.connect(config.CHESS_CONTRACT_ADDR, owner);
  // await chessContract.initializeGame();
  const boardState = await chessContract.boardState();
  console.log(`Board state is: ${boardState}`);

  // --- Betting contract other stuff ---
  // const totalWorldShares = await bettingContract.totalWorldShares({ gasLimit: 1e7 });
  // console.log(totalWorldShares);
  // const timeLeft = await bettingContract.getTimeLeft({ gasLimit: 1e7 });
  console.log("Finished!");
}

initializeLocalChessContractDeployment().then(() => process.exit(0)).catch((error) => {
  console.error(error);
  process.exit(1);
})