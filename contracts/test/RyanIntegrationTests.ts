import { expect } from "chai";
import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import hre, { ethers } from "hardhat";
import { BigNumber } from "ethers";
import { time } from "@nomicfoundation/hardhat-network-helpers";

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

describe("Integration Tests: Chess Contract", function () {

  describe("Testing Chess Contract", function () {

    async function deployContractAndInitialize() {

      const chess = await hre.ethers.getContractFactory("Chess");
      const [owner] = await ethers.getSigners();
      // --- This is SUPER jank. Presumably the owner's address is that of the betting contract ---
      const chessGame = await chess.deploy(owner.getAddress());
      await chessGame.deployed();
      await chessGame.initializeGame();

      return chessGame;
    }

    it("Testing chess initial state", async function () {

      const chessGame = await loadFixture(deployContractAndInitialize);

      // --- Grab the initial board state ---
      const chessBoardState = await chessGame.boardState();
      expect(chessBoardState === BigNumber.from("0xcbaedabc99999999000000000000000000000000000000001111111143265234"));
    })

    it("Testing chess move shenanigans", async function () {

      const chessGame = await loadFixture(deployContractAndInitialize);

      // --- Move the knight from B1 to C3 ---
      const move = convertMoveToUint16Repr("B", 1, "C", 3);
      console.log(move);
      await chessGame.playMove(move, { gasLimit: 3e7 });

      // --- Grab the post-move board state ---
      const chessBoardState = await chessGame.boardState();
      expect(chessBoardState === BigNumber.from("0xcbaedabc99999999000000000000000000000000003000001111111140265234"));
    })
  })
})

describe("Integration Tests: Betting Contract", function () {

  async function deployAndInitializeBettingContract() {

    // --- Deploy betting contract ---
    const bettingFactory = await hre.ethers.getContractFactory("BettingGame");
    const bettingContract = await bettingFactory.deploy();
    await bettingContract.deployed();

    // --- Deploy Leela and Chess contracts to pass into betting contract initializer ---
    // const [owner] = await ethers.getSigners();
    const chessFactory = await hre.ethers.getContractFactory("Chess");
    const chessContract = await chessFactory.deploy(bettingContract.address);
    await chessContract.deployed();

    const leelaFactory = await hre.ethers.getContractFactory("Leela");
    const leelaContract = await leelaFactory.deploy();
    await leelaContract.deployed();

    // --- Finally, initialize betting contract ---
    await bettingContract.initialize(chessContract.address, leelaContract.address, 1000, { gasLimit: 1e7 });
    return bettingContract;
  }

  describe("Testing Betting Contract Getters + Setters", function () {

    it("Testing betting contract get time remaining", async function () {
      const bettingContract = await loadFixture(deployAndInitializeBettingContract);

      // --- Start the voting timer, then check to see how long is remaining (should be close to an hour) ---
      await bettingContract.startVoteTimer({ gasLimit: 1e7 });
      const timeLeft = await bettingContract.getTimeLeft({ gasLimit: 1e7 });
      console.log(`Time left: ${timeLeft}`);
      expect(timeLeft <= BigNumber.from(3600) && timeLeft >= BigNumber.from(3590));
    })

    it("Testing betting contract pool state", async function () {
      const bettingContract = await loadFixture(deployAndInitializeBettingContract);
      const [owner, account2, account3] = await ethers.getSigners();

      // --- Add stake to the betting contract (using the default account) ---
      expect(await bettingContract.addStake(false, { value: ethers.utils.parseEther("0.01"), gasLimit: 1e7 }));
      expect(await bettingContract.addStake(true, { value: ethers.utils.parseEther("0.02"), gasLimit: 1e7 }));

      // --- Add stake to the betting contract (using a different account) ---
      await bettingContract.connect(account2).addStake(true, { value: ethers.utils.parseEther("0.01"), gasLimit: 1e7 });
      await bettingContract.connect(account2).addStake(false, { value: ethers.utils.parseEther("0.03"), gasLimit: 1e7 });

      // --- Parse out the stakes/shares ---
      const worldPoolSize = await bettingContract.worldPoolSize({ gasLimit: 1e7 });
      const leelaPoolSize = await bettingContract.leelaPoolSize({ gasLimit: 1e7 });

      const worldStakes = await bettingContract.worldStakes(0, owner.getAddress(), { gasLimit: 1e7 });
      const leelaStakes = await bettingContract.leelaStakes(0, owner.getAddress(), { gasLimit: 1e7 });

      const worldShares = await bettingContract.worldShares(0, owner.getAddress(), { gasLimit: 1e7 });
      const leelaShares = await bettingContract.leelaShares(0, owner.getAddress(), { gasLimit: 1e7 });

      const totalLeelaShares = await bettingContract.totalLeelaShares({ gasLimit: 1e7 });
      const totalWorldShares = await bettingContract.totalWorldShares({ gasLimit: 1e7 });

      console.log(`worldPoolSize: ${worldPoolSize}`);
      console.log(`leelaPoolSize: ${leelaPoolSize}`);
      console.log(`worldStakes: ${worldStakes}`);
      console.log(`leelaStakes: ${leelaStakes}`);
      console.log(`worldShares: ${worldShares}`);
      console.log(`leelaShares: ${leelaShares}`);
      console.log(`totalLeelaShares: ${totalLeelaShares}`);
      console.log(`totalWorldShares: ${totalWorldShares}`);
    })

    it("Testing betting contract move leaderboard", async function () {

      // --- Setup ---
      const bettingContract = await loadFixture(deployAndInitializeBettingContract);
      const [owner, account2, account3] = await ethers.getSigners();

      // --- Add stake to the betting contract (using the default account) ---
      await bettingContract.addStake(false, { value: ethers.utils.parseEther("0.01"), gasLimit: 1e7 });
      await bettingContract.addStake(true, { value: ethers.utils.parseEther("0.02"), gasLimit: 1e7 });

      // --- Add stake to the betting contract (using a different account) ---
      await bettingContract.connect(account2).addStake(true, { value: ethers.utils.parseEther("0.01"), gasLimit: 1e7 });
      await bettingContract.connect(account2).addStake(false, { value: ethers.utils.parseEther("0.03"), gasLimit: 1e7 });

      // --- Vote on a move (using default account, then using account2) ---
      const ownerVoteMove = convertMoveToUint16Repr("A", 2, "A", 3);
      await bettingContract.voteWorldMove(ownerVoteMove);
      const account2VoteMove = convertMoveToUint16Repr("B", 1, "C", 3);
      await bettingContract.connect(account2).voteWorldMove(account2VoteMove);

      // --- Check the leaderboard ---
      const [curMoves, curVotes] = await bettingContract.getCurMovesAndVotes({ gasLimit: 1e7 });
      console.log("Got here!!");
      console.log(curMoves);
      console.log(curVotes);

      curMoves.forEach((uint16MoveRepr: number) => {
        console.log(convertUint16ReprToHumanReadable(uint16MoveRepr));
      });

    })

  })
})