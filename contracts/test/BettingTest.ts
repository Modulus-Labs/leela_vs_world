import { expect } from "chai";
import hre, { ethers } from "hardhat";

describe("Betting", function () {

    beforeEach(async () => {

    })

    // it("Testing deployment of leela contract", async function () {
    //     const leela = await hre.ethers.getContractFactory("Leela");
    //     const leelaDep = await leela.deploy();
    //     await leelaDep.deployed();

    // })

    // it("Testing deployment of chess contract", async function () {
    //     const chess = await hre.ethers.getContractFactory("Chess");
    //     const [owner] = await ethers.getSigners();
    //     const chessGame = await chess.deploy(owner.getAddress()); 
    //     await chessGame.deployed();
    // })

    it("Testing deployment of betting contract", async function () {
        const [owner] = await ethers.getSigners();
        //need leela contract deployed
        const leela = await hre.ethers.getContractFactory("Leela");
        const leelaDep = await leela.deploy();
        //need chess contract deployed
        const chess = await hre.ethers.getContractFactory("Chess");
        const chessGame = await chess.deploy(owner.getAddress());

        //then betting contract...
        const betting = await hre.ethers.getContractFactory("BettingGame");
        console.log("chess game address", chessGame.address);
        const bettingGame = await betting.deploy(chessGame.address, leelaDep.address, 1, {gasLimit: 1000000});
        await bettingGame.deployed();
    })

    // it("Testing the Leela contract", async function () {
    //     //depolying contract
    //     const leela = await hre.ethers.getContractFactory("Leela");
    //     const leelaDep = await leela.deploy();
    //     const [owner] = await ethers.getSigners();
    //     await leelaDep.deployed();

    //     //interacting with contract functions
    //     expect(await leelaDep.initializeLeela());
    //     //console.log((await (leelaDep.initializeLeela())).data);
    //     expect((await leelaDep.getMove()));
    //     //console.log((await (leelaDep.getMove())).data);
    // })

    // it("Testing the Chess contract", async function () {
    //     const chess = await hre.ethers.getContractFactory("Chess");
    //     const [owner] = await ethers.getSigners();
    //     const chessGame = await chess.deploy(owner.getAddress()); 

    //     expect(chessGame.setBetting(owner.getAddress()));
    //     expect(chessGame.initializeGame());
    //     expect(chessGame.convertToCircuit());

    //     //need to check if different data is displayed after calling the function with different moves
    //     //expect(chessGame.playMove(0xBA1));
    //     //console.log((await chessGame.playMove(10, {gasLimit: 10000000})).data);
    //     //expect(chessGame.playMove(0xCA1));
    //     //console.log((await chessGame.playMove(0x1, {gasLimit: 100000})).data);
        
    // })

    // it("Testing the Betting contract", async function () {
        
    // })
})