import { ethers } from "hardhat";

async function main() {
    //need leela contract deployed
    const leela = await ethers.getContractFactory("Leela");
    const leelaDep = await leela.deploy();
    console.log("Leela Contract deployed to address: ", leelaDep.address);
            
    //then betting contract...
    const betting = await ethers.getContractFactory("BettingGame");
    const bettingGame = await betting.deploy();
    console.log("Betting Contract deployed to address: ", bettingGame.address);
    
    //need chess contract deployed
    const chess = await ethers.getContractFactory("Chess");
    const chessGame = await chess.deploy(bettingGame.address, {gasPrice: 100});
    console.log("Chess Contract deployed to address: ", chessGame.address);
    
}

main()
    .then(() => process.exit(0))
    .catch(error => {
        console.error(error);
        process.exit(1);
    })