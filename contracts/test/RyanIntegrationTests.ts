import { expect } from "chai";
import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import hre, { ethers } from "hardhat";
import { BigNumber } from "ethers";
import { time } from "@nomicfoundation/hardhat-network-helpers";
import * as fs from 'fs';
import { Chess__factory } from "../typechain-types";
import { BettingGame__factory } from "../typechain-types";
import { Validator__factory } from "../typechain-types";

import { poseidonContract, buildPoseidon } from "circomlibjs";


const SAMPLE_GAME = ["D2D4", "D7D5", "C2C4", "C7C6", "G1F3", "G8F6", "E2E3", "C8G4", "H2H3", "G4H5", "C4D5", "C6D5",
  "B1C3", "E7E6", "G2G4", "H5G6", "F3E5", "F6D7", "E5G6", "H7G6", "F1G2", "B8C6", "E3E4", "D5E4", "C3E4", "F8B4", "E4C3",
  "D7B6", "E1G1", "E8G8", "D4D5", "E6D5", "C3D5", "B4C5", "D5C3", "C5D4", "D1F3", "D8F6", "F3F6", "D4F6", "C1F4", "A8D8",
  "A1D1", "F6C3", "B2C3", "B6A4", "C3C4", "A4C3", "D1D2", "D8D2", "F4D2", "C3E2", "G1H2", "F8D8", "D2E3", "E2C3", "A2A3",
  "D8D3", "F1C1", "C3D1", "G2E4", "D3D7", "E3C5", "D1B2", "C1C2", "B2A4", "C5E3", "A4B6", "C4C5", "B6D5", "C2D2", "D5F6",
  "D2D7", "F6D7", "H2G3", "G8F8", "F2F4", "D7F6", "E4F3", "F8E7", "F4F5", "G6F5", "G4F5", "E7D7", "G3F4", "F6E8", "F4G5",
  "D7E7", "E3F4", "A7A6", "H3H4", "E7F8", "F4G3", "E8F6", "G3D6"]

  // NON_CANON_ENDGAME "A3A4", "C6B4", "C5C6", "A6A5", "C6C7", "F8E7", "F3C6", "B7B6", "G3F2", "B6B5", "F2C5"]

const FOOLS_MATE_LEELA_WIN = ["F2F3", "E7E6", "G2G4", "D8H4"]
const FOOLS_MATE_WORLD_WIN = ["E2E3", "F7F6", "A2A3", "G7G5", "D1H5"]

const GLITCHED_GAME = ["G1H3", "G8F6", "E2E4", "D7D5", "B1C3", "C7C5", "F2F3", "D5D4", "F1B5"]

/**
 * Given chess move in e.g. "A2A4" format, converts into chess game-parseable repr.
 * @param fromRow 
 * @param fromCol 
 * @param toRow 
 * @returns 
 */
function convertMoveToUint16Repr(fromCol: string, fromRow: number, toCol: string, toRow: number): number {
 const fromColRepr = 7 - (fromCol.toUpperCase().charCodeAt(0) - "A".charCodeAt(0));
 const fromRowRepr = fromRow - 1;
 const toColRepr = 7 - (toCol.toUpperCase().charCodeAt(0) - "A".charCodeAt(0));
 const toRowRepr = toRow - 1;
 const fromRepr = (fromRowRepr << 3) | (fromColRepr);
 const toRepr = (toRowRepr << 3) | (toColRepr);
 const finalMoveRepr = (fromRowRepr << 9) | (fromColRepr << 6) | (toRowRepr << 3) | (toColRepr);
 console.log(`From repr: ${fromRepr} | To repr: ${toRepr} | Final move repr: ${finalMoveRepr}`);
 return finalMoveRepr;
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
 return String.fromCharCode("H".charCodeAt(0) - fromRow) + `${fromCol + 1}` + " -> " +
   String.fromCharCode("H".charCodeAt(0) - toRow) + `${toCol + 1}`
}

describe("Integration Tests: Chess Contract", function () {

  describe("Testing Chess Contract", function () {

    async function deployContractAndInitialize() {

      const chess = new Chess__factory();
      const [owner] = await ethers.getSigners();
      // --- This is SUPER jank. Presumably the owner's address is that of the betting contract ---
      const chessGame = await chess.connect(owner).deploy(owner.getAddress());
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

    it("Testing ValidMove list", async function () {
      const chessGame = await loadFixture(deployContractAndInitialize);

      var legalMoves = await chessGame.callStatic.getLegalMoves({gasLimit: 15000000});
      console.log("legal inital moves!");
      for (var legalMove of legalMoves) {
        if (legalMove == 0) {break;}
        console.log(convertUint16ReprToHumanReadable(legalMove));
      }
      var i = 1;
      for (var move of SAMPLE_GAME) {
        try {
          await chessGame.playMove(convertMoveToUint16Repr(move.substring(0, 1), Number.parseInt(move.substring(1, 2)), move.substring(2, 3), Number.parseInt(move.substring(3, 4))));
          //await chessGame.getLegalMoves();
        } catch (err) {
          console.log("move is " + i/2 + " " + move);
          console.log(await chessGame.boardState());
          throw err;
        }
        i++
      }

      // try { await chessGame.playMove(2) } catch {}
      // await chessGame.playMove(convertMoveToUint16Repr("F", 6, "D", 7));

      console.log(await chessGame.whiteState());

      // await chessGame.playMove(convertMoveToUint16Repr("E", 2, "E", 4));

      console.log(await chessGame.whiteState());

      var gameEnd = await chessGame.checkEndgame();

      console.log(gameEnd);

      // console.log(await chessGame.boardState());

      var legalMoves = await chessGame.callStatic.getLegalMoves({ gasLimit: 15000000 });
      console.log("legal inital moves!");
      for (var moveNum of legalMoves) {
        if (moveNum == 0) { break; }
        console.log(convertUint16ReprToHumanReadable(moveNum));
      }

      var nnBoardRepr = await chessGame.convertToCircuit();
      fs.writeFileSync("./leelaInputs.json", JSON.stringify(nnBoardRepr.map((x) => x.toString())));
      //console.log(nnBoardRepr[104], nnBoardRepr[105], nnBoardRepr[106], nnBoardRepr[107], nnBoardRepr[108], nnBoardRepr[109], nnBoardRepr[110], nnBoardRepr[111]);
      // console.log(await chessGame.convertToCircuit());
    });

    it("testing convertToCircuit", async function () {
      // const chessGame = await loadFixture(deployContractAndInitialize);
      // await chessGame.playMove(convertMoveToUint16Repr("E", 2, "E", 4));
      // await chessGame.playMove(convertMoveToUint16Repr("C", 7, "C", 5));
      // await chessGame.playMove(convertMoveToUint16Repr("G", 1, "F", 3));
      // var nnBoardRepr = await chessGame.convertToCircuit();
      // console.log(nnBoardRepr[108]);
    })
  })
})

describe("Integration Tests: Betting Contract", function () {

  async function deployAndInitializeBettingContract() {
    const [owner, otherSigner] = await ethers.getSigners();

    // --- Deploy betting contract ---
    const bettingFactory = new BettingGame__factory().connect(owner);
    const bettingContract = await bettingFactory.deploy();
    await bettingContract.deployed();

    // --- Deploy Leela and Chess contracts to pass into betting contract initializer ---
    // const [owner] = await ethers.getSigners();
    const chessFactory = new Chess__factory().connect(owner);
    const chessContract = await chessFactory.deploy(bettingContract.address);
    await chessContract.deployed();

    var verifier_raw = fs.readFileSync("./proof_dir/verifier_contract_bytecode");
    var verifier_hex = verifier_raw.reduce((output, elem) => (output + ('0' + elem.toString(16)).slice(-2)), '');

    var verifier_factory = new ethers.ContractFactory([], verifier_hex);
    var verifier = await verifier_factory.connect(owner).deploy();

    var poseidon_factory = new ethers.ContractFactory(poseidonContract.generateABI(2), poseidonContract.createCode(2));
    var poseidon = await poseidon_factory.connect(owner).deploy();

    const leelaFactory = new Validator__factory().connect(owner);
    console.log("deploying validator!");
    const leelaContract = await leelaFactory.deploy(poseidon.address, verifier.address, bettingContract.address, { gasLimit: 3e7 });
    console.log("validator deployed!");
    await leelaContract.deployed();

    // --- Finally, initialize betting contract ---
    await bettingContract.initialize(chessContract.address, leelaContract.address, 1000, { gasLimit: 1e7 });
    return { bettingContract, chessContract, leelaContract, owner, otherSigner };
  }

  describe("Testing Betting Contract Getters + Setters", function () {

    it("Testing betting contract get time remaining", async function () {
      const { bettingContract } = await loadFixture(deployAndInitializeBettingContract);

      // --- Start the voting timer, then check to see how long is remaining (should be close to an hour) ---
      await bettingContract.startVoteTimer({ gasLimit: 1e7 });
      const timeLeft = await bettingContract.getTimeLeft({ gasLimit: 1e7 });
      console.log(`Time left: ${timeLeft}`);
      expect(timeLeft <= BigNumber.from(3600) && timeLeft >= BigNumber.from(3590));
    })

    it("Testing betting contract pool state", async function () {
      const { bettingContract } = await loadFixture(deployAndInitializeBettingContract);
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
      const { bettingContract } = await loadFixture(deployAndInitializeBettingContract);
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
      console.log(curMoves);
      console.log(curVotes);

      curMoves.forEach((uint16MoveRepr: number) => {
        console.log(convertUint16ReprToHumanReadable(uint16MoveRepr));
      });

    })

    it("Testing staking stuff", async function () {

      // --- Setup ---
      const { bettingContract } = await loadFixture(deployAndInitializeBettingContract);
      const [owner, account2, account3] = await ethers.getSigners();

      // --- Add stake to the betting contract (using the default account) ---
      await bettingContract.addStake(false, { value: ethers.utils.parseEther("0.01"), gasLimit: 1e7 });
      await bettingContract.addStake(true, { value: ethers.utils.parseEther("0.02"), gasLimit: 1e7 });

      // --- Add stake to the betting contract (using a different account) ---
      await bettingContract.connect(account2).addStake(true, { value: ethers.utils.parseEther("0.01"), gasLimit: 1e7 });
      await bettingContract.connect(account2).addStake(false, { value: ethers.utils.parseEther("0.03"), gasLimit: 1e7 });

      const [leelaStake, worldStake] = await bettingContract.getUserStakeState(owner.address);
      const [leelaStake2, worldStake2] = await bettingContract.getUserStakeState(account2.address);
      const [leelaStake3, worldStake3] = await bettingContract.getUserStakeState(account3.address);

      console.log(leelaStake, worldStake, leelaStake2, worldStake2, leelaStake3, worldStake3);

    })

    it("Should release funds correctly on win", async function () {
      const {bettingContract, chessContract, owner} = await loadFixture(deployAndInitializeBettingContract);
      const [_, account2, account3, account4] = await ethers.getSigners();

      const bettingContractOther = bettingContract.connect(account2);

      await bettingContract.addStake(false, {value: ethers.utils.parseEther("0.1")});
      await bettingContractOther.addStake(true, {value: ethers.utils.parseEther("0.2")});
      await bettingContract.connect(account3).addStake(false, {value: ethers.utils.parseEther("0.2")});
      await bettingContract.connect(account4).addStake(false, {value: ethers.utils.parseEther("0.2")});
      await bettingContract.setVotePeriod(10);
      console.log(await bettingContract.accountsPayable(owner.address))

      var leelaTurn = false;
      for (var move of GLITCHED_GAME) {
        try {
          if (leelaTurn == false) {
            console.log("world move")
            await bettingContract.startVoteTimer();
            await bettingContract.voteWorldMove(convertMoveToUint16Repr(move.substring(0, 1), Number.parseInt(move.substring(1, 2)), move.substring(2, 3), Number.parseInt(move.substring(3, 4))));
            time.increase(30);
            console.log(await bettingContract.getWorldMove());
            await bettingContract.callTimerOver({gasLimit: 1e7});
            leelaTurn = true;
          } else {
            console.log("leela Move")
            console.log(await bettingContract.leelaMove())
            await bettingContract.manualLeelaMove(convertMoveToUint16Repr(move.substring(0, 1), Number.parseInt(move.substring(1, 2)), move.substring(2, 3), Number.parseInt(move.substring(3, 4))), {gasLimit: 1e7});
            leelaTurn = false;
          }
        } catch(err) {
          console.log(move);
          throw err
        }
      }

      try {await bettingContract.manualLeelaMove(convertMoveToUint16Repr("F", 6, "D", 6))} catch {};
      console.log("blahblahblah");
      console.log(await chessContract.boardState())
      console.log(await chessContract.blackState());
      console.log(await chessContract.whiteState());
      console.log(await chessContract.currentTurnBlack());
      console.log(await chessContract.gameIndex());
      console.log(await chessContract.moveIndex());
      console.log(await bettingContract.gameIndex());
      console.log(await bettingContract.moveIndex());
      await bettingContract.manualLeelaMove(convertMoveToUint16Repr("F", 6, "D", 7));
      console.log("blblblb");


      // console.log(await chessContract.callStatic.checkEndgame());

      // console.log(await bettingContract.accountsPayable(owner.address))
      // console.log(await bettingContract.accountsPayable(account2.address));
      // console.log(await bettingContract.accountsPayable(account3.address));
      // console.log(await bettingContract.accountsPayable(account4.address));

      // await expect(bettingContractOther.claimPayout()).to.changeEtherBalance(account2, "699999999999998500")
      // await expect(bettingContract.claimPayout()).to.changeEtherBalance(owner, 0);
    });

    it("Should Play 2 full moves correctly", async function () {
      // var { bettingContract, leelaContract: validator, owner, chessContract } = await loadFixture(deployAndInitializeBettingContract);
      // console.log("startin!");
      // await bettingContract.setVotePeriod(30);
      // await bettingContract.startVoteTimer();

      // console.log("blah");

      // await bettingContract.addStake(false, { value: ethers.utils.parseEther("1") });
      // await bettingContract.voteWorldMove(convertMoveToUint16Repr("E", 2, "E", 4));
      // await time.increase(30);
      // console.log("callingtimerover");
      // var result = await bettingContract.callTimerOver();
      // console.log("next");
      // await bettingContract.giveLeelaLegalMoves({ gasLimit: 1e7 });
      // await bettingContract.leelaHashInputs();

      // var outputs = JSON.parse(fs.readFileSync("./proof_dir/calc_output.json").toString());
      // var outputsBn: any[] = [];
      // for (var i = 0; i < outputs.length; i++) {
      //   var outputBn = ethers.BigNumber.from(outputs[i])
      //   if (outputBn.isNegative()) {
      //     outputBn = outputBn.add(ethers.BigNumber.from("0x30644e72e131a029b85045b68181585d2833e84879b9709143e1f593f0000001"));
      //   }
      //   outputsBn.push(outputBn)
      // }

      // var outputChunks = [outputsBn.slice(0, 250), outputsBn.slice(250, 500), outputsBn.slice(500, 750), outputsBn.slice(750, 1000), outputsBn.slice(1000, 1250), outputsBn.slice(1250, 1500), outputsBn.slice(1500, 1750)];

      // var chunkStart = 0;
      // var chunkEnd = 250;

      // for (var chunk of outputChunks) {
      //   await validator.hashOutputChunk(chunk, chunkStart, chunkEnd, { gasLimit: 15000000 })
      //   chunkStart += 250;
      //   chunkEnd += 250;
      // }

      // await validator.hashOutputChunk(outputsBn.slice(1750, 1858), 1750, 1858, { gasLimit: 15000000 });

      // var outputHash = await validator.outputHash();
      // var winningMoveValue = await validator.winningMoveValue();
      // var winningMoveIndex = await validator.winningMoveIndex()
      // console.log(outputHash);
      // console.log(winningMoveIndex);
      // console.log(winningMoveValue);

      // var proof_raw = fs.readFileSync("./proof_dir/proof");
      // var proof_hex = "0x" + proof_raw.reduce((output, elem) => (output + ('0' + elem.toString(16)).slice(-2)), '');

      // var instance_raw = fs.readFileSync("./proof_dir/limbs_instance");
      // var instance_hex = "0x" + instance_raw.reduce((output, elem) => (output + ('0' + elem.toString(16)).slice(-2)), '');

      // await bettingContract.makeLeelaMove(proof_hex, instance_hex, { gasLimit: 3000000 });
      // console.log(await chessContract.boardState());

      // await bettingContract.startVoteTimer();
      // await bettingContract.voteWorldMove(convertMoveToUint16Repr("D", 2, "D", 3));
      // await time.increase(30);
      // console.log("callingtimerover");
      // var result = await bettingContract.callTimerOver();
      // console.log("next");
      // await bettingContract.giveLeelaLegalMoves({ gasLimit: 1e7 });
      // await bettingContract.leelaHashInputs();

      // var outputs = JSON.parse(fs.readFileSync("./proof_dir/calc_output.json").toString());
      // var outputsBn: any[] = [];
      // for (var i = 0; i < outputs.length; i++) {
      //   var outputBn = ethers.BigNumber.from(outputs[i])
      //   if (outputBn.isNegative()) {
      //     outputBn = outputBn.add(ethers.BigNumber.from("0x30644e72e131a029b85045b68181585d2833e84879b9709143e1f593f0000001"));
      //   }
      //   outputsBn.push(outputBn)
      // }

      // var outputChunks = [outputsBn.slice(0, 250), outputsBn.slice(250, 500), outputsBn.slice(500, 750), outputsBn.slice(750, 1000), outputsBn.slice(1000, 1250), outputsBn.slice(1250, 1500), outputsBn.slice(1500, 1750)];

      // var chunkStart = 0;
      // var chunkEnd = 250;

      // for (var chunk of outputChunks) {
      //   await validator.hashOutputChunk(chunk, chunkStart, chunkEnd, { gasLimit: 15000000 })
      //   chunkStart += 250;
      //   chunkEnd += 250;
      // }

      // await validator.hashOutputChunk(outputsBn.slice(1750, 1858), 1750, 1858, { gasLimit: 15000000 });

      // var outputHash = await validator.outputHash();
      // var winningMoveValue = await validator.winningMoveValue();
      // var winningMoveIndex = await validator.winningMoveIndex()
      // console.log(outputHash);
      // console.log(winningMoveIndex);
      // console.log(winningMoveValue);

      // var proof_raw = fs.readFileSync("./proof_dir/proof");
      // var proof_hex = "0x" + proof_raw.reduce((output, elem) => (output + ('0' + elem.toString(16)).slice(-2)), '');

      // var instance_raw = fs.readFileSync("./proof_dir/limbs_instance");
      // var instance_hex = "0x" + instance_raw.reduce((output, elem) => (output + ('0' + elem.toString(16)).slice(-2)), '');

      // await bettingContract.makeLeelaMove(proof_hex, instance_hex, { gasLimit: 3000000 });

    });

  })
})