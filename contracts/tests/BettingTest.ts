import { expect, assert } from "chai";
import hre, { artifacts, ethers } from "hardhat";
import { Contract } from "hardhat/internal/hardhat-network/stack-traces/model";

describe("Betting", function () {

    it("Testing deployment of leela contract", async function () {
        const leela = await hre.ethers.getContractFactory("Leela");
        const leelaDep = await leela.deploy();
        await leelaDep.deployed();

    })

    it("Testing deployment of chess contract", async function () {
        const chess = await hre.ethers.getContractFactory("Chess");
        const [owner] = await ethers.getSigners();
        const chessGame = await chess.deploy(owner.address); 
        await chessGame.deployed();
    })

    it("Testing deployment of betting contract", async function () {
        const [owner, addr1, addr2] = await ethers.getSigners();
        //need leela contract deployed
        const leela = await hre.ethers.getContractFactory("Leela");
        const leelaDep = await leela.deploy();
        //need chess contract deployed
        const chess = await hre.ethers.getContractFactory("Chess");
        const chessGame = await chess.deploy(owner.address);

        //then betting contract...
        const betting = await hre.ethers.getContractFactory("BettingGame");
        const bettingGame = await betting.deploy(owner.address, owner.address, 0, {
            gasLimit: 1000000
        });
        await bettingGame.deployed();
    })

    it("Testing the Leela contract", async function () {
        //depolying contract
        const leela = await hre.ethers.getContractFactory("Leela");
        const leelaDep = await leela.deploy();

        //interacting with contract functions
        expect((await leelaDep.initializeLeela()));
        //console.log((await (leelaDep.initializeLeela())).data);
        expect((await leelaDep.getMove()));
        //console.log((await (leelaDep.getMove())).data);
    })

    it("Testing the Chess contract", async function () {
        const chess = await hre.ethers.getContractFactory("Chess");
        const [owner] = await ethers.getSigners();
        const chessGame = await chess.deploy(owner.address); 

        expect(chessGame.setBetting(owner.address));
        expect(chessGame.initializeGame());
        expect(chessGame.convertToCircuit());

        //need to check if different data is displayed after calling the function with different moves
        //expect(chessGame.playMove(0xBA1));
        //console.log((await chessGame.playMove(10, {gasLimit: 10000000})).data);
        //expect(chessGame.playMove(0xCA1));
        //console.log((await chessGame.playMove(0x1, {gasLimit: 100000})).data);
        
    })

    it("Testing the Betting contract", async function () {
        
    })
})