import { expect } from "chai";
require("@nomicfoundation/hardhat-chai-matchers");
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

/**
 * Given chess move in e.g. "A2A4" format, converts into chess game-parseable repr.
 * @param fromRow 
 * @param fromCol 
 * @param toRow 
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

describe("Integration Tests: Betting Contract", function () {

  async function deployAndInitializeBettingContract() {
    const [owner] = await ethers.getSigners();

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
    return { bettingContract, chessContract, leelaContract, owner };
  }

  describe("Testing Betting Contract Getters + Setters", function () {

    it("Testing betting contract pool state", async function () {
      const { bettingContract } = await loadFixture(deployAndInitializeBettingContract);
      const [owner, account2, account3] = await ethers.getSigners();

      // --- Setup listeners ---
      bettingContract.on(bettingContract.filters.voteMade(), (player, power, move) => {
        console.log(`Got to voteMade! Player: ${player} | Power: ${power} | Move: ${move}`);
      });
      bettingContract.on(bettingContract.filters.stakeMade(), (player, amt, leelaSide) => {
        console.log(`Got to stakeMade! Player: ${player} | Amt: ${amt} | Leela side: ${leelaSide}`);
      });

      // --- Add stake to the betting contract (using the default account) ---
      const addStakeEvent = await bettingContract.addStake(false, { value: ethers.utils.parseEther("0.01"), gasLimit: 1e7 });
      const receipt = await addStakeEvent.wait();
      if (receipt.events !== undefined) {
        for (const event of receipt.events) {
          console.log(`Event ${event.event} with args ${event.args}`);
        }
      }

      // expect(await bettingContract.addStake(false, { value: ethers.utils.parseEther("0.01"), gasLimit: 1e7 }));
      // expect(await bettingContract.addStake(true, { value: ethers.utils.parseEther("0.02"), gasLimit: 1e7 }));

      // // --- Add stake to the betting contract (using a different account) ---
      // await bettingContract.connect(account2).addStake(true, { value: ethers.utils.parseEther("0.01"), gasLimit: 1e7 });
      // await bettingContract.connect(account2).addStake(false, { value: ethers.utils.parseEther("0.03"), gasLimit: 1e7 });

      // // --- Parse out the stakes/shares ---
      // const worldPoolSize = await bettingContract.worldPoolSize({ gasLimit: 1e7 });
      // const leelaPoolSize = await bettingContract.leelaPoolSize({ gasLimit: 1e7 });

      // const worldStakes = await bettingContract.worldStakes(0, owner.getAddress(), { gasLimit: 1e7 });
      // const leelaStakes = await bettingContract.leelaStakes(0, owner.getAddress(), { gasLimit: 1e7 });

      // const worldShares = await bettingContract.worldShares(0, owner.getAddress(), { gasLimit: 1e7 });
      // const leelaShares = await bettingContract.leelaShares(0, owner.getAddress(), { gasLimit: 1e7 });

      // const totalLeelaShares = await bettingContract.totalLeelaShares({ gasLimit: 1e7 });
      // const totalWorldShares = await bettingContract.totalWorldShares({ gasLimit: 1e7 });

      // console.log(`worldPoolSize: ${worldPoolSize}`);
      // console.log(`leelaPoolSize: ${leelaPoolSize}`);
      // console.log(`worldStakes: ${worldStakes}`);
      // console.log(`leelaStakes: ${leelaStakes}`);
      // console.log(`worldShares: ${worldShares}`);
      // console.log(`leelaShares: ${leelaShares}`);
      // console.log(`totalLeelaShares: ${totalLeelaShares}`);
      // console.log(`totalWorldShares: ${totalWorldShares}`);
    });
  });
});