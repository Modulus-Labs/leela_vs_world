import { ContractFactory, ethers, providers, Wallet } from "ethers";
import { BettingGame__factory, Chess__factory, Validator__factory } from "../typechain-types";
import { Network } from "@ethersproject/networks";

// --- Testnet ---
export const addresses = {
    LEELA_CONTRACT_ADDR: "0x3AC6DB16fa527D7eD85fDC2E334271c9678C408c",
    BETTING_CONTRACT_ADDR: "0x5AD13d2f26E0344217A98cDCc252963c1b52F272",
    CHESS_CONTRACT_ADDR: "0x209A32B477F9B30b793d77Ed42E9E47bE8284398",
}

/**
 * Given chess move in e.g. "A2A4" format, converts into chess game-parseable repr.
 * @param fromRow 
 * @param fromCol 
 * @param toRow 
 * @returns 
 */
function convertMoveToUint16Repr(fromCol: string, fromRow: number, toCol: string, toRow: number): number {
    const fromColRepr = fromCol.toUpperCase().charCodeAt(0) - "A".charCodeAt(0);
    const fromRowRepr = fromRow - 1;
    const toColRepr = toCol.toUpperCase().charCodeAt(0) - "A".charCodeAt(0);
    const toRowRepr = toRow - 1;
    return (fromRowRepr << 9) | (fromColRepr << 6) | (toRowRepr << 3) | (toColRepr);
}

require('dotenv').config();

const { API_KEY, PRIVATE_KEY } = process.env;

async function main() {
    const polygonMumbai: Network = {
        name: "maticmum",
        chainId: 80001
    };
    const provider = new providers.AlchemyProvider(polygonMumbai, API_KEY);
    const owner = new Wallet(PRIVATE_KEY ?? "", provider);

    // --- Connect to betting contract, set vote period to 10 seconds, start timer ---
    const bettingContract = BettingGame__factory.connect(addresses.BETTING_CONTRACT_ADDR, owner);
    await bettingContract.setVotePeriod(10);
    console.log("Set vote period");
    await bettingContract.startVoteTimer();
    console.log("Started vote timer");

    // --- Try to make a bet and then listen for event ---
    // bettingContract.on(bettingContract.filters.stakeMade(), (player, amt, leelaSide) => {
    //     console.log(`Got a stake made event!`);
    //     console.log(`From player ${player} with power ${amt} on Leela side: ${leelaSide}`);
    // });
    // const addStakeRequest = bettingContract.addStake(false, { gasLimit: 1e7, value: ethers.utils.parseEther("0.010") });
    // await addStakeRequest;

    // --- Try playing the world's move ---
    // const result = await bettingContract.callTimerOver({ gasLimit: 1e7 });
    // console.log(`Result was: ${result}`);
    // console.log(result);
    // const receipt = await result.wait();
    // console.log(`Receipt was:`);
    // if (receipt.events !== undefined) {
    //     console.log("Receipt has events!");
    //     console.log(receipt.events);
    // }
    // console.log("All done forcing the world to make a move!");

    // --- Play a move manually for Leela ---
    // const move = convertMoveToUint16Repr("E", 8, "F", 8);
    // const result = await bettingContract.manualLeelaMove(move, { gasLimit: 1e7 });
    // console.log("Result from manual Leela move is");
    // console.log(result);
    // const receipt = await result.wait();
    // console.log("Receipt from manual Leela move is");
    // if (receipt.events !== undefined) {
    //     console.log("Receipt has events!");
    //     console.log(receipt.events);
    // }
}

main()
    .then(() => process.exit(0))
    .catch(error => {
        console.error(error);
        process.exit(1);
    })