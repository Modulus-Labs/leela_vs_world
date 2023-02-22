import { ethers } from "hardhat";
import { BettingGame__factory, Chess__factory, Validator__factory } from "../typechain-types";
import * as fs from 'fs';
import { poseidonContract, buildPoseidon } from "circomlibjs";

async function main() {
  const [contractDeployer] = await ethers.getSigners();
  console.log(`Deploying under this account: ${contractDeployer.address}`);

  // --- Deploy betting contract ---
  const bettingFactory = new BettingGame__factory().connect(contractDeployer);
  const bettingContract = await bettingFactory.deploy();
  await bettingContract.deployed();

  // --- Deploy Leela and Chess contracts to pass into betting contract initializer ---
  // const [owner] = await ethers.getSigners();
  const chessFactory = new Chess__factory().connect(contractDeployer);
  const chessContract = await chessFactory.deploy(bettingContract.address);
  await chessContract.deployed();

  var verifier_raw = fs.readFileSync("./proof_dir/verifier_contract_bytecode");
  var verifier_hex = verifier_raw.reduce((output, elem) => (output + ('0' + elem.toString(16)).slice(-2)), '');

  var verifier_factory = new ethers.ContractFactory([], verifier_hex);
  var verifier = await verifier_factory.connect(contractDeployer).deploy();

  var poseidon_factory = new ethers.ContractFactory(poseidonContract.generateABI(2), poseidonContract.createCode(2));
  var poseidon = await poseidon_factory.connect(contractDeployer).deploy();

  const leelaFactory = new Validator__factory().connect(contractDeployer);
  console.log("deploying validator!");
  const leelaContract = await leelaFactory.deploy(poseidon.address, verifier.address, bettingContract.address, { gasLimit: 3e7 });
  console.log("validator deployed!");
  await leelaContract.deployed();

  // --- Finally, initialize betting contract ---
  await bettingContract.initialize(chessContract.address, leelaContract.address, 1000, { gasLimit: 1e7 });

  console.log(`Betting contract deployed to ${bettingContract.address}`);
  console.log(`Chess contract deployed to ${chessContract.address}`);
  console.log(`Leela/validator contract deployed to ${leelaContract.address}`);

  return { bettingContract, chessContract, leelaContract, contractDeployer };
}

main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error);
    process.exit(1);
  })