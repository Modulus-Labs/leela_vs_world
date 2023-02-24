import { BigNumber, ContractFactory, ethers, providers, Wallet } from "ethers";
import { BettingGame__factory, Chess__factory, Validator__factory } from "../typechain-types";
import { Network } from "@ethersproject/networks";

// --- Localhost ---
export const addresses = {
    LEELA_CONTRACT_ADDR: "0xDc64a140Aa3E981100a9becA4E685f962f0cF6C9",
    BETTING_CONTRACT_ADDR: "0x5FbDB2315678afecb367f032d93F642f64180aa3",
    CHESS_CONTRACT_ADDR: "0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512",
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

/**
 * Converts the board state from the contract into something readable on
 * the terminal screen (lol)
 * @param boardState 
 */
function convertBoardStateBigNumberToHumanReadable(boardState: BigNumber): string {
    const boardStateString = boardState.toHexString().substring(2);
    const remainder = 64 - boardStateString.length;
    let ret = "";
    for (let row = 0; row < 8; row++) {
        let rowStr = "";
        for (let col = 0; col < 8; col++) {
            if (row * 8 + col < remainder) {
                rowStr += ".";
                continue;
            }
            switch (boardStateString.charAt(row * 8 + col - remainder)) {
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

const localhost_private_key = "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80";

async function main() {
    const provider = new providers.JsonRpcProvider("http://127.0.0.1:8545/");
    const owner = new Wallet(localhost_private_key, provider);

    // --- Connect to betting contract, set vote period to 10 seconds, start timer ---
    const bettingContract = BettingGame__factory.connect(addresses.BETTING_CONTRACT_ADDR, owner);
    const chessContract = Chess__factory.connect(addresses.CHESS_CONTRACT_ADDR, owner);
    // await bettingContract.setVotePeriod(10, { gasLimit: 1e7 });
    // console.log("Set vote period");
    // await bettingContract.startVoteTimer({ gasLimit: 1e7 });
    // console.log("Started vote timer");

    // --- Try to make a bet and then listen for event ---
    // const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
    // bettingContract.on(bettingContract.filters.stakeMade(), (player, amt, leelaSide) => {
    //     console.log(`Got a stake made event!`);
    //     console.log(`From player ${player} with power ${amt} on Leela side: ${leelaSide}`);
    // });
    // const addStakeRequest = bettingContract.addStake(true, { gasLimit: 1e7, value: ethers.utils.parseEther("0.010") });
    // const result = await addStakeRequest;
    // const receipt = await result.wait();
    // console.log("All done adding stake!");
    // await sleep(100000);

    // --- Vote on a world move ---
    // const worldMove = convertMoveToUint16Repr("E", 4, "E", 7);
    // const result = await bettingContract.voteWorldMove(worldMove, { gasLimit: 1e7 });
    // const receipt = await result.wait();
    // console.log("All done playing world move!");

    // --- Try playing the world's move ---
    // const result2 = await bettingContract.callTimerOver({ gasLimit: 1e7 });
    // const receipt2 = await result2.wait();

    // --- Play a move manually for Leela ---
    const move = convertMoveToUint16Repr("G", 8, "F", 6);
    console.log(`Move is ${move}`);
    const result = await bettingContract.manualLeelaMove(move, { gasLimit: 1e7 });

    const rawBoardState = await chessContract.boardState({ gasLimit: 1e7 });
    const boardState = convertBoardStateBigNumberToHumanReadable(rawBoardState);
    console.log("Afterwards, the board state is:");
    console.log(boardState);
}

main()
    .then(() => process.exit(0))
    .catch(error => {
        console.error(error);
        process.exit(1);
    })