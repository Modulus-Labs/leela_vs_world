import { time, loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import { anyValue } from "@nomicfoundation/hardhat-chai-matchers/withArgs";
import { expect } from "chai";
import { ethers } from "hardhat";
import * as fs from 'fs';

// @ts-ignore
import { poseidonContract, buildPoseidon } from "circomlibjs";

import { Validator__factory } from '../typechain-types/factories/contracts/Validator.sol/Validator__factory';
import { MinEthersFactory } from "../typechain-types/common";

describe("VerifierExample", function () {
  // We define a fixture to reuse the same setup in every test.
  // We use loadFixture to run this setup once, snapshot that state,
  // and reset Hardhat Network to that snapshot in every test.
  async function getValidator() {
    const [owner, otherAccount] = await ethers.getSigners();

    var verifier_raw = fs.readFileSync("./proof_dir/verifier_contract_bytecode");
    var verifier_hex = verifier_raw.reduce((output, elem) => (output + ('0' + elem.toString(16)).slice(-2)), '');

    var verifier_factory = new ethers.ContractFactory([], verifier_hex);
    var verifier = await verifier_factory.connect(owner).deploy();

    var poseidon_factory = new ethers.ContractFactory(poseidonContract.generateABI(2), poseidonContract.createCode(2));
    var poseidon = await poseidon_factory.connect(owner).deploy();

    const factory = new Validator__factory()
    return factory.connect(owner).deploy(poseidon.address, verifier.address, owner.address);
  }

  describe("Validation", function () {
    it("Should validate a proof", async function () {
      const validator = await loadFixture(getValidator);

      var inputs_packed = JSON.parse(fs.readFileSync("./leelaInputs.json").toString());
      var outputs = JSON.parse(fs.readFileSync("./proof_dir/calc_output.json").toString());
      // var inputs = input_json.input;
      // var outputs = input_json.output;

      var legalMoves = [2740, 3964, 3966];
      await validator.setLegalMoveIndicies(legalMoves);

      // var out_index = 0;
      // var input_packed = ethers.BigNumber.from(0);
      // var inputs_packed: any[] = [];

      // for (var input of inputs) {
      //   input_packed = input_packed.add(ethers.BigNumber.from(input).div(ethers.BigNumber.from(1048576)).mul(ethers.BigNumber.from(2).pow(ethers.BigNumber.from(out_index))))
      //   out_index++;
      //   if (out_index == 64) {
      //     inputs_packed.push(input_packed);
      //     out_index = 0;
      //     input_packed = ethers.BigNumber.from(0);
      //   }
      // }

      await validator.hashInputs(inputs_packed);
      var inputHash = await validator.inputHash();
      console.log(inputHash);

      var outputsBn: any[] = [];
      for (var i = 0; i < outputs.length; i++) {
        var outputBn = ethers.BigNumber.from(outputs[i])
        if (outputBn.isNegative()) {
          outputBn = outputBn.add(ethers.BigNumber.from("0x30644e72e131a029b85045b68181585d2833e84879b9709143e1f593f0000001"));
        }
        outputsBn.push(outputBn)
      }

      var outputChunks = [outputsBn.slice(0, 250), outputsBn.slice(250, 500), outputsBn.slice(500, 750), outputsBn.slice(750, 1000), outputsBn.slice(1000, 1250), outputsBn.slice(1250, 1500), outputsBn.slice(1500, 1750)];

      var chunkStart = 0;
      var chunkEnd = 250;

      for (var chunk of outputChunks) {
        await validator.hashOutputChunk(chunk, chunkStart, chunkEnd, {gasLimit: 15000000})
        chunkStart += 250;
        chunkEnd += 250;
      }

      await validator.hashOutputChunk(outputsBn.slice(1750, 1858), 1750, 1858, {gasLimit: 15000000});

      var outputHash = await validator.outputHash();
      var winningMoveValue = await validator.winningMoveValue();
      var winningMoveIndex = await validator.winningMoveIndex()
      console.log(outputHash);
      console.log(winningMoveIndex);
      console.log(winningMoveValue);

      var proof_raw = fs.readFileSync("./proof_dir/proof");
      var proof_hex = "0x" + proof_raw.reduce((output, elem) => (output + ('0' + elem.toString(16)).slice(-2)), '');

      var instance_raw = fs.readFileSync("./proof_dir/limbs_instance");
      var instance_hex = "0x" + instance_raw.reduce((output, elem) => (output + ('0' + elem.toString(16)).slice(-2)), '');  

      await validator.verify(proof_hex, instance_hex, {gasLimit: 3000000});
    });
  });

});
