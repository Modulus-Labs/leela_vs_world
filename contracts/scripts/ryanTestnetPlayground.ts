import { ContractFactory, ethers, providers, Wallet } from "ethers";
import { BettingGame__factory, Chess__factory, Validator__factory } from "../typechain-types";
import { Network } from "@ethersproject/networks";

// --- Testnet ---
export const addresses = {
    LEELA_CONTRACT_ADDR: "0x573Bd87ba78c5Da205c1CBBd2AbB1C7898DEb95b",
    BETTING_CONTRACT_ADDR: "0x0E2AfbCdb972E998587dDB6dd3C71876cF18367A",
    CHESS_CONTRACT_ADDR: "0x9C9BA8303B97057F7811c23184C5aE731a52F17D",
}

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

    // --- Betting contract transfer ownership ---
    const result = await bettingContract.transferOwnership("0xB5D32C00a3E2ee89660064E98770b65E8779C53D");
    await result.wait();

    // await bettingContract.setVotePeriod(10, { gasLimit: 1e7 });
    // console.log("Set vote period");
    // await bettingContract.startVoteTimer({ gasLimit: 1e7 });
    // console.log("Started vote timer");

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
    // const move = convertMoveToUint16Repr("C", 8, "D", 7);
    // console.log(`Move is ${move}`);
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