import { expect } from "chai";
import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";
// @ts-ignore
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

// --- Castling kingside / queenside successfully ---
// const RYAN_TEST_GAME = ["G2G3", "D7D6", "F1G2", "E7E5", "G1F3", "C8G4", "E1G1", "G8F6", "D2D3", "G7G6", "E2E4", "F8G7", "B1C3", "D8D7", "D1D2", "B8C6", "B2B4", "E8C8"];
// --- Castling after moving either king or rook should NOT work ---
// const RYAN_TEST_GAME = ["G2G3", "G7G6", "F1G2", "F8G7", "G1F3", "G8F6", "H1G1", "E8F8", "G1H1", "F8E8", "E1G1", "E8G8"];

// --- Promotion tests ---
// const RYAN_TEST_GAME = ["E2E4", "D7D5", "E4E5", "D5D4", "E5E6", "D4D3", "E6F7", "E8D7", "F7G8", "D3C2", "G8H8", "C2B1"];

// --- En passant ---
// const RYAN_TEST_GAME = ["E2E4", "G7G5", "E4E5", "D7D5", "E5D6"];

// --- Carlsen vs. Fabi, WCC 2019 ---
// const RYAN_TEST_GAME = ["E2E4", "C7C5", "G1F3", "B8C6", "F1B5", "G7G6", "B5C6", "D7C6", "D2D3", "F8G7", "H2H3", "G8F6", "B1C3", "F6D7", "C1E3", "E7E5",
//   "E1G1", "B7B6", "F3H2", "D7F8", "F2F4", "E5F4", "F1F4", "C8E6", "F4F2", "H7H6", "D1D2", "G6G5", "A1F1", "D8D6", "H2G4", "E8C8"];

// --- Check stuff ---
// --- Moving the king out of the way ---
// const RYAN_TEST_GAME = ["E2E4", "D7D5", "E4E5", "D5D4", "E5E6", "D4D3", "E6F7", "E8D7"];
// --- Taking the offending piece ---
// const RYAN_TEST_GAME = ["E2E4", "D7D5", "E4E5", "D5D4", "E5E6", "D4D3", "E6F7", "E8F7"];
// --- Can't move another piece while king is in check ---
// const RYAN_TEST_GAME = ["E2E4", "D7D5", "E4E5", "D5D4", "E5E6", "D4D3", "E6F7", "G8F6"];
// --- Moving a piece which puts YOUR king in check ---
// const RYAN_TEST_GAME = ["E2E4", "D7D5", "E4E5", "D5D4", "D1H5", "F7F6"]
// --- Double check: king must move out of the way ---
// const RYAN_TEST_GAME = ["E2E4", "C7C6", "D2D4", "D7D5", "B1C3", "D5E4", "C3E4", "G8F6", "D1D3", "E7E5", "D4E5", "D8A5", "C1D2", "A5E5", "E1C1", "F6E4", "D3D8", "E8D8", "D2G5", "E5G5"];
// const RYAN_TEST_GAME = ["E2E4", "C7C6", "D2D4", "D7D5", "B1C3", "D5E4", "C3E4", "G8F6", "D1D3", "E7E5", "D4E5", "D8A5", "C1D2", "A5E5", "E1C1", "F6E4", "D3D8", "E8D8", "D2G5", "E5D5"];
// const RYAN_TEST_GAME = ["E2E4", "C7C6", "D2D4", "D7D5", "B1C3", "D5E4", "C3E4", "G8F6", "D1D3", "E7E5", "D4E5", "D8A5", "C1D2", "A5E5", "E1C1", "F6E4", "D3D8", "E8D8", "D2G5", "D8C7", "G5D8"];
const RYAN_TEST_GAME = ["E2E4"];

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
  return String.fromCharCode("A".charCodeAt(0) + fromRow) + `${fromCol + 1}` + " -> " +
    String.fromCharCode("A".charCodeAt(0) + toRow) + `${toCol + 1}`
}

/**
 * Converts the board state from the contract into something readable on
 * the terminal screen (lol)
 * @param boardState 
 */
function convertBoardStateBigNumberToHumanReadable(boardState: BigNumber): string {
  const boardStateString = boardState.toHexString().substring(2);
  let ret = "";
  for (let row = 0; row < 8; row++) {
    let rowStr = "";
    for (let col = 0; col < 8; col++) {
      switch (boardStateString.charAt(row * 8 + col)) {
        case '0': rowStr += "."; break;
        case '1': rowStr += "P"; break;
        case '2': rowStr += "B"; break;
        case '3': rowStr += "N"; break;
        case '4': rowStr += "R"; break;
        case '5': rowStr += "Q"; break;
        case '6': rowStr += "K"; break;
        case '9': rowStr += "p"; break;
        case 'a': rowStr += "b"; break;
        case 'b': rowStr += "n"; break;
        case 'c': rowStr += "r"; break;
        case 'd': rowStr += "q"; break;
        case 'e': rowStr += "k"; break;
      }
    }
    ret += rowStr + "\n";
  }
  return ret;
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

    it("Testing chess move shenanigans", async function () {

      const chessGame = await loadFixture(deployContractAndInitialize);

      // --- Play real move ---
      let idx = 0;
      for (var move of RYAN_TEST_GAME) {
        const moveUint16Repr = convertMoveToUint16Repr(move.substring(0, 1), Number.parseInt(move.substring(1, 2)), move.substring(2, 3), Number.parseInt(move.substring(3, 4)));
        console.log(`Playing ${move}!`);
        try {
          // --- Play the move ---
          await chessGame.playMove(moveUint16Repr, { gasLimit: 1e7 });

          // --- Print the board state in a reasonable fashion ---
          const boardState = await chessGame.boardState();
          const humanReadableBoardState = convertBoardStateBigNumberToHumanReadable(boardState);
          console.log("-------");
          console.log(humanReadableBoardState);

          // --- Print the player state ---
          // --- Looks like SOMETHING changes when we castle ---
          // --- Looks like SOMETHING changes when we move a pawn 2 spots forward ---
          // const blackPlayerState = await chessGame.blackState();
          // const whitePlayerState = await chessGame.whiteState();
          // console.log(blackPlayerState.toString(16));
          // console.log(whitePlayerState.toString(16));
        } catch (err) {
          console.log("move is " + idx / 2 + " " + move);
          const boardState = await chessGame.boardState();
          const humanReadableBoardState = convertBoardStateBigNumberToHumanReadable(boardState);
          console.log(humanReadableBoardState);
          throw err;
        }
        idx++;
      }
    })
  })
})