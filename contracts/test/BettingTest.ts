import { expect } from "chai";
import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import hre, { ethers } from "hardhat";
import { time } from "@nomicfoundation/hardhat-network-helpers";

describe("Unit Tests: Leela Vs. World", function () {

    describe("Deployement tests", function () {

        it("Testing deployment of leela contract", async function () {
            const leela = await hre.ethers.getContractFactory("Leela");
            const leelaDep = await leela.deploy();
            await leelaDep.deployed();
        })
    
        it("Testing deployment of chess contract", async function () {
            const chess = await hre.ethers.getContractFactory("Chess");
            const [owner] = await ethers.getSigners();
            const chessGame = await chess.deploy(owner.getAddress()); 
            await chessGame.deployed();
        })
    
        it("Testing deployment of betting contract", async function () {
            const [owner] = await ethers.getSigners();
            //need leela contract deployed
            const leela = await hre.ethers.getContractFactory("Leela");
            const leelaDep = await leela.deploy();
            
            //then betting contract...
            const betting = await hre.ethers.getContractFactory("BettingGame");
            const bettingGame = await betting.deploy();
            await bettingGame.deployed();
    
            //need chess contract deployed
            const chess = await hre.ethers.getContractFactory("Chess");
            const chessGame = await chess.deploy(bettingGame.address);
            await chessGame.deployed();
        })

    })

    describe("Testing Leela Contract", function () {

        async function deployContractAndInitialize() {
            //depolying contract
            const leela = await hre.ethers.getContractFactory("Leela");
            const leelaDep = await leela.deploy();
            await leelaDep.deployed();

            return leelaDep;
        }

        it("Testing leela intialize method", async function () {

            const leelaDep  = await loadFixture(deployContractAndInitialize);
    
            //interacting with contract functions
            expect(await leelaDep.initializeLeela());

        })

        it("Testing leela getMove method", async function () {
            
            const leelaDep  = await loadFixture(deployContractAndInitialize);

            //interacting with contract functions
            expect(await leelaDep.getMove());
        })
    })

    describe("Testing Betting Contract", function () {

        async function deployContractAndInitialize() {
            //need leela contract deployed
            const leela = await hre.ethers.getContractFactory("Leela");
            const leelaDep = await leela.deploy();

            //then betting contract...
            const betting = await hre.ethers.getContractFactory("BettingGame");
            const bettingGame = await betting.deploy();
            await bettingGame.deployed();
        
            //then chess contract...
            const chess = await hre.ethers.getContractFactory("Chess");
            const chessGame = await chess.deploy(bettingGame.address);
            await chessGame.deployed();

            //testing intitalize method
            bettingGame.initialize(chessGame.address, leelaDep.address, 1000, {gasLimit: 1000000});

            return bettingGame
            
        }

        it("Testing setChess method", async function () {

            const bettingGame  = await loadFixture(deployContractAndInitialize);
            const [owner] = await ethers.getSigners();

            //testing setChess method
            bettingGame.setChess(owner.address);
            expect((await bettingGame.setChess(owner.address)));
            
        })

        it("Testing setLeela method", async function () {

            const bettingGame  = await loadFixture(deployContractAndInitialize);
            const [newOwner] = await ethers.getSigners();

            //testing setLeela method
            bettingGame.setLeela(newOwner.address);
            expect((await bettingGame.setLeela(newOwner.address)));
            
        })

        it("Testing setMinStake method", async function () {

            const bettingGame  = await loadFixture(deployContractAndInitialize);

            //testing setMinStake method
            bettingGame.setMinStake(1);
            expect((await bettingGame.setMinStake(1)).data.endsWith("1")).is.true;
            bettingGame.setMinStake(100);
            expect((await bettingGame.setMinStake(100)).data.slice(72)).is.equal("64");
            
        })

        it("Testing setPoolSize method", async function () {

            const bettingGame  = await loadFixture(deployContractAndInitialize);

            //testing setPoolSize method
            bettingGame.setPoolSize(1);
            expect((await bettingGame.setPoolSize(1)).data.endsWith("1")).is.true;
            bettingGame.setPoolSize(10000);
            expect((await bettingGame.setPoolSize(10000)).data.slice(70)).is.equal("2710");
            
        })

        it("Testing setVotePeriod method", async function () {

            const bettingGame  = await loadFixture(deployContractAndInitialize);

            //testing setVotePeriod method
            bettingGame.setVotePeriod(500);
            expect((await bettingGame.setPoolSize(500)).data.slice(71)).is.equal("1f4");
            bettingGame.setVotePeriod(2000);
            expect((await bettingGame.setPoolSize(2000)).data.slice(71)).is.equal("7d0");
            
        })
        
        /*
        * this test will automatically fail unless modifying the contract
        * for testing purposes only
        */
        it("Testing getTimeLeft", async function () {

            const bettingGame  = await loadFixture(deployContractAndInitialize);

            //testing getTimeLeft method
            await bettingGame.setVotePeriod(30);
            await bettingGame.startVoteTimer();
            await bettingGame.getTimeLeft();
            expect(await (await bettingGame.getTimeLeft()).toString()).is.equal("30");
            await time.increase(10);
            expect(await (await bettingGame.getTimeLeft()).toString()).is.equal("20");
            expect(bettingGame.getTimeLeft());

            
        })

        it("Testing addStake method", async function () {

            const bettingGame  = await loadFixture(deployContractAndInitialize);

            //testing addStake method
            await bettingGame.setPoolSize(ethers.utils.parseEther("1000"));
            await bettingGame.setMinStake(ethers.utils.parseEther("1"));
            expect(await bettingGame.addStake(false,  {value: ethers.utils.parseEther("1"), gasLimit: 1000000}));
            expect(await bettingGame.addStake(true,  {value: ethers.utils.parseEther("2"), gasLimit: 1000000}));
            await bettingGame.setMinStake(ethers.utils.parseEther("4"));
            await expect(bettingGame.addStake(false, {value: ethers.utils.parseEther("3"), gasLimit: 1000000})).to.be.reverted;
            
        })

        it("Testing voteWorldMove", async function () {

            const bettingGame  = await loadFixture(deployContractAndInitialize);

            //testing voteWorldMove method
            //testing invalid move
            await expect(bettingGame.voteWorldMove(0, {gasLimit: 100000})).to.be.reverted;
            //testing a valid move
            //await bettingGame.voteWorldMove(100, {gasLimit: 100000}); //not working

            
        })

        it("Testing callTimerOver", async function () {

            const bettingGame  = await loadFixture(deployContractAndInitialize);

            //testing callTimerOver method
            //testing vote timer over
            await bettingGame.setVotePeriod(30, {gasLimit: 100000});
            await bettingGame.startVoteTimer({gasLimit: 100000});
            await time.increase(30);
            await bettingGame.getTimeLeft({gasLimit: 100000});
            await bettingGame.callTimerOver({gasLimit: 100000}); //does not work
            //testing vote timer not over
            //await bettingGame.setVotePeriod(30, {gasLimit: 100000});
            //await bettingGame.startVoteTimer({gasLimit: 100000});
            //await time.increase(10);
            //await bettingGame.getTimeLeft({gasLimit: 100000});
            //await bettingGame.callTimerOver({gasLimit: 100000});

            
        })

        it("Testing getWorldMove", async function () {

            const bettingGame  = await loadFixture(deployContractAndInitialize);

            //testing getWorldMove method
            await bettingGame.getWorldMove();
            expect(await bettingGame.getWorldMove()).is.equal(0); //defualt value

            
        })

        it("Testing claimPayout", async function () {

            const bettingGame  = await loadFixture(deployContractAndInitialize);

            //testing claimPayout method
            expect((await bettingGame.claimPayout()).value.toString()).to.equal("0");
            await bettingGame.setPoolSize(100);
            await bettingGame.addStake(true,  {value: ethers.utils.parseEther("2"), gasLimit: 1000000});

        })

    })
})