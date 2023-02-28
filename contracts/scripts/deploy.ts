import { ContractFactory, providers, Wallet } from "ethers";
import { BettingGame__factory, Chess__factory, Validator__factory } from "../typechain-types";
import * as fs from 'fs';

// @ts-ignore
import { poseidonContract } from "circomlibjs";
import { Network } from "@ethersproject/networks";

require('dotenv').config();

const { API_KEY, PRIVATE_KEY } = process.env;

async function main() {
    const polygonMumbai: Network = {
        name: "maticmum",
        chainId: 80001
    };
    const provider = new providers.AlchemyProvider(polygonMumbai, API_KEY);
    const owner = new Wallet(PRIVATE_KEY ?? "", provider);

    console.log("Okay got here 1");

    // --- Deploy betting contract ---
    const bettingFactory = new BettingGame__factory().connect(owner);
    console.log("Okay got here 2");
    const bettingContract = await bettingFactory.deploy();
    console.log("Okay got here 3");
    await bettingContract.deployed();

    console.log("Okay got here 4");

    // --- Deploy Leela and Chess contracts to pass into betting contract initializer ---
    //const [owner] = await ethers.getSigners();
    const chessFactory = new Chess__factory().connect(owner);
    const chessContract = await chessFactory.deploy(bettingContract.address);
    await chessContract.deployed();
    console.log("Okay got here 5");

    var verifier_raw = fs.readFileSync("./proof_dir/verifier_contract_bytecode");
    var verifier_hex = verifier_raw.reduce((output, elem) => (output + ('0' + elem.toString(16)).slice(-2)), '');
    console.log("Okay got here 6");

    var verifier_factory = new ContractFactory([], verifier_hex);
    var verifier = await verifier_factory.connect(owner).deploy();
    console.log("Okay got here 7");

    var poseidon_factory = new ContractFactory(poseidonContract.generateABI(2), poseidonContract.createCode(2));
    var poseidon = await poseidon_factory.connect(owner).deploy();
    console.log("Okay got here 8");

    const leelaFactory = new Validator__factory().connect(owner);
    console.log("Okay got here 9");
    const leelaContract = await leelaFactory.deploy(poseidon.address, verifier.address, bettingContract.address);
    console.log("Okay got here 10");
    await leelaContract.deployed();
    console.log("Okay got here 11");

    // --- Finally, initialize betting contract ---
    await bettingContract.initialize(chessContract.address, leelaContract.address, 1000, { gasLimit: 1e7 });
    console.log("Okay got here 12");

    console.log("betting contract addr: " + bettingContract.address);
    console.log("chess contract addr: " + chessContract.address);
    console.log("validator contract addr: " + leelaContract.address);
}

main()
    .then(() => process.exit(0))
    .catch(error => {
        console.error(error);
        process.exit(1);
    })