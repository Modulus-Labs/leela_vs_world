// @ts-ignore (yeah no idea why I have to do this)
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

// --- For Polygon Mumbai ---
// TODO(ryancao): Change these to mainnet!
const config = {
  LEELA_CONTRACT_ADDR: "0x9E18aDc813d6b5b033d16AfE8C44C879B174c434",
  BETTING_CONTRACT_ADDR: "0xCEf7acD91D1385E6e7142d90d8831e468489d5D8",
  CHESS_CONTRACT_ADDR: "0x89510ce94Ab5491740eF3B05206C5488295b6f89",
}

// --- For localhost ---
// const config = {
//   LEELA_CONTRACT_ADDR: "0xDc64a140Aa3E981100a9becA4E685f962f0cF6C9",
//   BETTING_CONTRACT_ADDR: "0x5FbDB2315678afecb367f032d93F642f64180aa3",
//   CHESS_CONTRACT_ADDR: "0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512",
// }
// Betting contract deployed to 0x5FbDB2315678afecb367f032d93F642f64180aa3
// Chess contract deployed to 0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512
// Leela/validator contract deployed to 0xDc64a140Aa3E981100a9becA4E685f962f0cF6C9

/**
 * Given chess move in e.g. "A2A4" format, converts into chess game-parseable repr.
 * @param fromRow 
 * @param fromCol 
 * @param toRow 
 * @param toCol 
 * @returns 
 */
function convertMoveToUint16Repr(fromRow: string, fromCol: number, toRow: string, toCol: number): number {
  const fromRowRepr = fromRow.toUpperCase().charCodeAt(0) - "A".charCodeAt(0);
  const fromColRepr = fromCol - 1;
  const toRowRepr = toRow.toUpperCase().charCodeAt(0) - "A".charCodeAt(0);
  const toColRepr = toCol - 1;
  return (fromColRepr << 9) | (fromRowRepr << 6) | (toColRepr << 3) | (toRowRepr);
}

/**
 * Converts uint16 move repr back into human-readable format.
 * @param uint16MoveRepr 
 * @returns 
 */
function convertUint16ReprToHumanReadable(uint16MoveRepr: number): string {
  const toRow = uint16MoveRepr & 0x7;
  const toCol = (uint16MoveRepr >> 3) & 0x7;
  const fromRow = (uint16MoveRepr >> 6) & 0x7;
  const fromCol = (uint16MoveRepr >> 9) & 0x7;
  return String.fromCharCode("A".charCodeAt(0) + fromRow) + `${fromCol + 1}` + " -> " +
    String.fromCharCode("A".charCodeAt(0) + toRow) + `${toCol + 1}`
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
  const API_URL = "https://polygon-mumbai.g.alchemy.com/v2/C_2O4qksq2Ij6fSp8EJ8eu7qKKONEsuo";
  // console.log(`API URL IS: ${API_URL}`);
  // const API_URL = "http://127.0.0.1:8545/";
  let ethersProvider = new ethers.providers.JsonRpcProvider(API_URL);
  return ethersProvider;
}

const initializeLocalChessContractDeployment = async () => {
  const ethersProvider = getEthersProvider();
  const owner = ethersProvider.getSigner();
  // console.log(`owner with address: ${await owner.getAddress()}`);

  // --- Connect to betting contract, call initialize function (this also initializes chess + leela) ---
  // Also start voting timer
  const bettingContract = BettingGame__factory.connect(config.BETTING_CONTRACT_ADDR, owner);
  await bettingContract.initialize(config.CHESS_CONTRACT_ADDR, config.LEELA_CONTRACT_ADDR, 1000, { gasLimit: 1e7 });
  await bettingContract.setVotePeriod(60);
  await bettingContract.startVoteTimer();

  // const ryanAcc = ethersProvider.getSigner("0xD39511C7B8B15C58Fe71Bcfd430c1EB3ed94ff25");
  // const bettingContractFromRyanView = BettingGame__factory.connect(config.BETTING_CONTRACT_ADDR, ryanAcc);
  // const [moves, votes] = await bettingContractFromRyanView.getCurMovesAndVotes({ gasLimit: 1e7 });
  // const [pool1, pool2, timer] = await bettingContractFromRyanView.getFrontEndPoolState({ gasLimit: 1e7 });
  // console.log(`From betting contract: ${moves}, ${votes}`);
  // console.log(`From betting contract pool state: ${pool1}, ${pool2}, ${timer}`);

  // --- Try and grab the current board state from the contract ---
  // const chessContract = Chess__factory.connect(config.CHESS_CONTRACT_ADDR, owner);
  // const request = await chessContract.initializeGame();
  // const receipt = await request.wait();
  // console.log(receipt);
  // const boardState = await chessContract.boardState();
  // console.log(`Board state is: ${boardState}`);

  // --- Betting contract other stuff ---
  // const totalWorldShares = await bettingContract.totalWorldShares({ gasLimit: 1e7 });
  // console.log(totalWorldShares);
  // const timeLeft = await bettingContract.getTimeLeft({ gasLimit: 1e7 });
  console.log("Finished!");
}

const testAddStake = async () => {
  // --- Setup ---
  const ethersProvider = getEthersProvider();
  console.log(`Uh the polling interval is ${ethersProvider.pollingInterval}`);
  // const [dummyOwner, dummyAccount2, dummyAccount3] = await ethers.getSigners();
  // const owner = ethersProvider.getSigner(dummyOwner.address);
  // const account2 = ethersProvider.getSigner(dummyAccount2.address);
  // const account3 = ethersProvider.getSigner(dummyAccount3.address);
  // const owner = ethersProvider.getSigner("0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266");
  // const bettingContract = BettingGame__factory.connect(config.BETTING_CONTRACT_ADDR, owner);
  const bettingContract = BettingGame__factory.connect(config.BETTING_CONTRACT_ADDR, ethersProvider);

  bettingContract.on(bettingContract.filters.stakeMade(), (player, amt, leelaSide) => {
    console.log(`Got a stake made event!`);
    console.log(`From player ${player} with power ${amt} on Leela side: ${leelaSide}`);
  });

  // const addStakeRequest = await bettingContract.addStake(false, { value: ethers.utils.parseEther("0.01"), gasLimit: 1e7 });
  // const receipt = await addStakeRequest.wait();
  // if (receipt.events !== undefined) {
  //   for (const event of receipt.events) {
  //     console.log(`Event ${event.event} with args ${event.args}`);
  //   }
  // }

  // const addStakeRequest2 = await bettingContract.addStake(true, { value: ethers.utils.parseEther("0.02"), gasLimit: 1e7 });
  // const receipt2 = await addStakeRequest2.wait();
  // if (receipt2.events !== undefined) {
  //   for (const event of receipt2.events) {
  //     console.log(`Event ${event.event} with args ${event.args}`);
  //   }
  // }

  const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
  await sleep(100000);
  console.log("All done!");
}

const addStateToLocalChessContractDeployment = async () => {
  // --- Setup ---
  const ethersProvider = getEthersProvider();
  const [dummyOwner, dummyAccount2, dummyAccount3] = await ethers.getSigners();
  const owner = ethersProvider.getSigner(dummyOwner.address);
  const account2 = ethersProvider.getSigner(dummyAccount2.address);
  const account3 = ethersProvider.getSigner(dummyAccount3.address);
  const bettingContract = BettingGame__factory.connect(config.BETTING_CONTRACT_ADDR, owner);

  // --- Add stake to the betting contract (using the default account) ---
  await bettingContract.addStake(false, { value: ethers.utils.parseEther("0.01"), gasLimit: 1e7 });
  await bettingContract.addStake(true, { value: ethers.utils.parseEther("0.02"), gasLimit: 1e7 });

  // --- Add stake to the betting contract (using a different account) ---
  await bettingContract.connect(account2).addStake(true, { value: ethers.utils.parseEther("0.01"), gasLimit: 1e7 });
  await bettingContract.connect(account2).addStake(false, { value: ethers.utils.parseEther("0.03"), gasLimit: 1e7 });

  await bettingContract.connect(account3).addStake(true, { value: ethers.utils.parseEther("0.11"), gasLimit: 1e7 });
  await bettingContract.connect(account3).addStake(false, { value: ethers.utils.parseEther("0.2"), gasLimit: 1e7 });

  // --- Vote on a move (using default account, then using account2) ---
  const ownerVoteMove = convertMoveToUint16Repr("E", 2, "E", 4);
  console.log(ownerVoteMove);
  // await bettingContract.voteWorldMove(ownerVoteMove);
  // const account2VoteMove = convertMoveToUint16Repr("B", 1, "C", 3);
  // await bettingContract.connect(account2).voteWorldMove(account2VoteMove);
  // const account3VoteMove = convertMoveToUint16Repr("E", 2, "E", 4);
  // await bettingContract.connect(account3).voteWorldMove(account3VoteMove);

  // const leelaStake = await bettingContract.leelaStakes(0, owner.getAddress());
  // const worldStake = await bettingContract.worldStakes(0, owner.getAddress());
  // const leelaStake2 = await bettingContract.leelaStakes(0, account2.getAddress());
  // const worldStake2 = await bettingContract.worldStakes(0, account2.getAddress());
  // const leelaStake3 = await bettingContract.leelaStakes(0, account3.getAddress());
  // const worldStake3 = await bettingContract.worldStakes(0, account3.getAddress());
  // const [leelaStake, worldStake] = await bettingContract.getUserStakeState(owner.address, { gasLimit: 1e7 });
  // const [leelaStake2, worldStake2] = await bettingContract.getUserStakeState(account2.address, { gasLimit: 1e7 });
  // const [leelaStake3, worldStake3] = await bettingContract.getUserStakeState(account3.address, { gasLimit: 1e7 });

  // console.log(leelaStake.toBigInt(), worldStake.toBigInt(), leelaStake2.toBigInt(), worldStake2.toBigInt(), leelaStake3.toBigInt(), worldStake3.toBigInt());
}

const readStateFromContracts = async () => {
  // --- Setup ---
  const ethersProvider = getEthersProvider();
  const [dummyOwner, dummyAccount2, dummyAccount3] = await ethers.getSigners();
  const owner = ethersProvider.getSigner(dummyOwner.address);
  const account2 = ethersProvider.getSigner(dummyAccount2.address);
  const account3 = ethersProvider.getSigner(dummyAccount3.address);
  const bettingContract = BettingGame__factory.connect(config.BETTING_CONTRACT_ADDR, owner);
  const chessContract = Chess__factory.connect(config.CHESS_CONTRACT_ADDR, owner);

  // --- Pool ---
  const [leelaPool, worldPool, timeLeft] = await bettingContract.getFrontEndPoolState();
  console.log(`Leela pool: ${leelaPool}, world pool: ${worldPool}, time left: ${timeLeft}`);

  // --- Stakes ---
  const [leelaStake, worldStake] = await bettingContract.getUserStakeState(owner.getAddress(), { gasLimit: 1e7 });
  const [leelaStake2, worldStake2] = await bettingContract.getUserStakeState(account2.getAddress(), { gasLimit: 1e7 });
  const [leelaStake3, worldStake3] = await bettingContract.getUserStakeState(account3.getAddress(), { gasLimit: 1e7 });
  console.log(leelaStake.toBigInt(), worldStake.toBigInt(), leelaStake2.toBigInt(), worldStake2.toBigInt(), leelaStake3.toBigInt(), worldStake3.toBigInt());

  // --- Voted moves ---
  const [moves, votes] = await bettingContract.getCurMovesAndVotes({ gasLimit: 1e7 });
  console.log(`From betting contract: ${moves}, ${votes}`);

  // --- User voted move? ---
  const userVotedMove = await bettingContract.connect(owner).userVotedMove();
  const userVotedMove2 = await bettingContract.connect(account2).userVotedMove();
  const userVotedMove3 = await bettingContract.connect(account3).userVotedMove();
  console.log(convertUint16ReprToHumanReadable(userVotedMove));
  console.log(convertUint16ReprToHumanReadable(userVotedMove2));
  console.log(convertUint16ReprToHumanReadable(userVotedMove3));
}

// initializeLocalChessContractDeployment().then(() => process.exit(0)).catch((error) => {
//   console.error(error);
//   process.exit(1);
// });

testAddStake().then(() => process.exit(0)).catch((error) => {
  console.error(error);
  process.exit(1);
});

// addStateToLocalChessContractDeployment().then(() => process.exit(0)).catch((error) => {
//   console.error(error);
//   process.exit(1);
// });

// readStateFromContracts().then(() => process.exit(0)).catch((error) => {
//   console.error(error);
//   process.exit(1);
// });