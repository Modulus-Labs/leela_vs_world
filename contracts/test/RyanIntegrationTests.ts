import { expect } from "chai";
import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import hre, { ethers } from "hardhat";
import { BigNumber } from "ethers";
import { time } from "@nomicfoundation/hardhat-network-helpers";

function convertMoveToUint16Repr(fromRow: string, fromCol: number, toRow: string, toCol: number): number {
  const fromRowRepr = fromRow.toUpperCase().charCodeAt(0) - "A".charCodeAt(0);
  const fromColRepr = fromCol - 1;
  const toRowRepr = toRow.toUpperCase().charCodeAt(0) - "A".charCodeAt(0);
  const toColRepr = toCol - 1;
  return (fromColRepr << 9) | (fromRowRepr << 6) | (toColRepr << 3) | (toRowRepr);
}

describe("Unit Tests: Chess Contract", function () {

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