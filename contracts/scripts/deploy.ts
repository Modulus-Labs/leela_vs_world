import { ContractFactory, providers, Wallet, BigNumber, utils } from "ethers";
import { BettingGame__factory, Chess__factory, Validator__factory } from "../typechain-types";
import * as fs from 'fs';

// @ts-ignore
import { poseidonContract } from "circomlibjs";
import { Network } from "@ethersproject/networks";

require('dotenv').config();

const { API_KEY, PRIVATE_KEY } = process.env;

async function main() {
    // const polygonMumbai = {
    //     name: "arbitrum",
    //     chainId: 42161
    // };
    const polygonMumbai = {
        name: "arbitrum",
        chainId: 42161
    };

    // const provider = new providers.AlchemyProvider(polygonMumbai, API_KEY);
    const provider = new providers.InfuraProvider(polygonMumbai, API_KEY)
    const owner = new Wallet(PRIVATE_KEY ?? "", provider);

    console.log("Okay got here 1");

    // var tx_params = {gasLimit: 2e7, maxFeePerGas: utils.parseUnits(Math.ceil(5000.1488227054) + '', "gwei"), maxPriorityFeePerGas: utils.parseUnits(Math.ceil(150.2929557514) + '', "gwei") }
    var tx_params = {gasLimit: 7e7};

    // --- Deploy betting contract ---
    // const bettingFactory = new BettingGame__factory().connect(owner);
    // console.log("Okay got here 2");
    // const bettingContract = await bettingFactory.deploy(tx_params);
    // console.log("Okay got here 3");
    // await bettingContract.deployed();

    const bettingContract = {address: "0x4d32874cc2bc547daad56953bc93373330c8970c"};

    console.log("Okay got here 4");

    // --- Deploy Leela and Chess contracts to pass into betting contract initializer ---
    //const [owner] = await ethers.getSigners();
    // const chessFactory = new Chess__factory().connect(owner);
    // const chessContract = await chessFactory.deploy(bettingContract.address, tx_params);
    // await chessContract.deployed();
    const chessContract = {address: "0x5097cfac31a1814bf1eb77e4c8b08675e3d70d97"};
    console.log("Okay got here 5");

    var verifier_raw = fs.readFileSync("./proof_dir/verifier_contract_bytecode");
    var verifier_hex = verifier_raw.reduce((output, elem) => (output + ('0' + elem.toString(16)).slice(-2)), '');
    console.log("Okay got here 6");

    // var verifier_factory = new ContractFactory([], verifier_hex);
    // var verifier = await verifier_factory.connect(owner).deploy(tx_params);
    var verifier = {address: "0x2eedac6e5a3ef2a7582d33ea521feb22df773d0f"};
    console.log("Okay got here 7");

    // var poseidon_factory = new ContractFactory(poseidonContract.generateABI(2), poseidonContract.createCode(2));
    // var poseidon = await poseidon_factory.connect(owner).deploy(tx_params);
    var poseidon = {address: "0x68e85cf425091b51b0d5054d1e00b2f1959f5223"}
    console.log("Okay got here 8");

    const leelaFactory = new Validator__factory().connect(owner);
    console.log("Okay got here 9");
    const leelaContract = await leelaFactory.deploy(poseidon.address, verifier.address, bettingContract.address, {gasLimit: 2e8});
    console.log("Okay got here 10");
    await leelaContract.deployed();
    console.log("Okay got here 11");

    // --- Finally, initialize betting contract ---
    // await bettingContract.initialize(chessContract.address, leelaContract.address, 1000, tx_params);
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