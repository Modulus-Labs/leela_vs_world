import { time, loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import { anyValue } from "@nomicfoundation/hardhat-chai-matchers/withArgs";
import { expect } from "chai";
import { ethers } from "hardhat";

import { ValidatorExample__factory } from '../typechain-types/factories/ValidatorExample__factory';

describe("VerifierExample", function () {
  // We define a fixture to reuse the same setup in every test.
  // We use loadFixture to run this setup once, snapshot that state,
  // and reset Hardhat Network to that snapshot in every test.
  async function getVerifierExample() {
    // const ONE_YEAR_IN_SECS = 365 * 24 * 60 * 60;
    // const ONE_GWEI = 1_000_000_000;

    // const lockedAmount = ONE_GWEI;
    // const unlockTime = (await time.latest()) + ONE_YEAR_IN_SECS;

    // // Contracts are deployed using the first signer/account by default
    const [owner, otherAccount] = await ethers.getSigners();

    // const Lock = await ethers.getContractFactory("VerifierExample");
    // const lock = await Lock.deploy(unlockTime, { value: lockedAmount });

    // return { lock, unlockTime, lockedAmount, owner, otherAccount };
    const factory = new ValidatorExample__factory()
    return factory.connect(owner).deploy();
  }

  describe("Deployment", function () {
    it("Should set the right unlockTime", async function () {
      const verifier = await loadFixture(getVerifierExample);

      verifier.verify([1, 1]);
    });
  });

});
