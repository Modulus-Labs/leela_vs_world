import { BigNumber, providers, Wallet } from 'ethers';
import * as ethers from 'ethers';
import { CloudWatchClient, PutMetricDataCommand } from "@aws-sdk/client-cloudwatch";
import * as fs from 'fs';

import {execFile} from "child_process";

import { BettingGame__factory, Chess__factory, Validator__factory } from '../typechain-types';
require('dotenv').config();

const { API_KEY, BETTING_ADDR, PRIVATE_KEY, CHESS_ADDR, VALIDATOR_ADDR } = process.env;

const tx_params = {gasLimit: 1e8};

async function checkLeela() {
    const polygonMumbai = {
        name: "arbitrum",
        chainId: 42161
    };
    const provider = new providers.InfuraProvider(polygonMumbai, API_KEY);
    const owner = new Wallet(PRIVATE_KEY ?? "", provider);

    const bettingContract = BettingGame__factory.connect(BETTING_ADDR ?? "", owner);
    const chessContract = Chess__factory.connect(CHESS_ADDR ?? "", owner);
    const validatorContract = Validator__factory.connect(VALIDATOR_ADDR ?? "", owner);

    const client = new CloudWatchClient({ region: "us-west-2" });

    bettingContract.on(bettingContract.filters.worldMovePlayed(), async function () {
        console.log("-------- Starting Leela Move --------")

        fs.rmSync("./proof_dir", {recursive: true, force: true});
        fs.mkdirSync("./proof_dir");
        //ingest circuit input and start leela/hash inputs
        var nnBoardRepr = await chessContract.convertToCircuit();
        fs.writeFileSync("./proof_dir/leelaInputs.json", JSON.stringify(nnBoardRepr.map((x) => x.toString())));  
    
        execFile("./run_leela", (error, stdout, stderr) => {
            //some error handling?
            console.log("run leela exited");
            console.log(error);
            console.log(stdout);
            console.log(stderr);
        });
    
        console.log("run_leela is started!");
    
        await bettingContract.leelaHashInputs(tx_params);
    
        console.log("inputs hashed!");
    
        await bettingContract.giveLeelaLegalMoves(tx_params);
    
        //when output_calc.json is ready start hashing outputs
        await new Promise((resolve, reject) => {fs.watch("./proof_dir/", (eventType, fileName) => {
            if (fileName == "calc_output.json") {
                resolve(true)
            }
        })});
    
        await new Promise((resolve, reject) => setTimeout(() => resolve(true), 100));
    
        console.log("started hashing output!");
    
        var outputs = JSON.parse(fs.readFileSync("./proof_dir/calc_output.json").toString());
        var outputsBn: any[] = [];
        for (var i = 0; i < outputs.length; i++) {
          var outputBn = BigNumber.from(outputs[i])
          if (outputBn.isNegative()) {
            outputBn = outputBn.add(BigNumber.from("0x30644e72e131a029b85045b68181585d2833e84879b9709143e1f593f0000001"));
          }
          outputsBn.push(outputBn)
        }
    
        var outputChunks = [outputsBn.slice(0, 250), outputsBn.slice(250, 500), outputsBn.slice(500, 750), outputsBn.slice(750, 1000), outputsBn.slice(1000, 1250), outputsBn.slice(1250, 1500), outputsBn.slice(1500, 1750)];
    
        var chunkStart = 0;
        var chunkEnd = 250;
    
        for (var chunk of outputChunks) {
          var trans = await validatorContract.hashOutputChunk(chunk, chunkStart, chunkEnd, tx_params)
          await trans.wait();
          chunkStart += 250;
          chunkEnd += 250;
        }
    
        await validatorContract.hashOutputChunk(outputsBn.slice(1750, 1858), 1750, 1858, tx_params);
    
        console.log("finished hashing output")
        //when proof is ready and outputs are hashed send proof/instances to betting contract
        await new Promise((resolve, reject) => {fs.watch("./proof_dir/", (eventType, fileName) => {
            if (fileName == "limbs_instance") {
                resolve(true)
            }
        })});

        await new Promise((resolve, reject) => setTimeout(() => resolve(true), 100));
    
        console.log("verifying leela move!")
    
        var proof_raw = fs.readFileSync("./proof_dir/proof");
        var proof_hex = "0x" + proof_raw.reduce((output, elem) => (output + ('0' + elem.toString(16)).slice(-2)), '');
    
        var instance_raw = fs.readFileSync("./proof_dir/limbs_instance");
        var instance_hex = "0x" + instance_raw.reduce((output, elem) => (output + ('0' + elem.toString(16)).slice(-2)), '');  
    
        await bettingContract.makeLeelaMove(proof_hex, instance_hex, tx_params);
        var command = new PutMetricDataCommand({Namespace: "Leela/dev", MetricData: [{MetricName: "LeelaMove", Value: Date.now()}]});
        await client.send(command);
        console.log("-------- Leela Move Played --------")
        console.log("");
    });

    bettingContract.on(bettingContract.filters.leelaMovePlayed(), async function () {
        console.log("-------- Starting Vote Timer --------")
        //get current timer length
        var timerLength = await bettingContract.getTimeLeft();
        //set callback for timer, when finished play move.
        while (true) {
            await new Promise((resolve, reject) => setTimeout(() => resolve(true), timerLength.toNumber()*1000 + 60000));
            var move = await bettingContract.getWorldMove();
            if (move != 0) {
                await bettingContract.callTimerOver(tx_params)
                var command = new PutMetricDataCommand({Namespace: "Leela/dev", MetricData: [{MetricName: "WorldMove", Value: Date.now()}]});
                await client.send(command);
                console.log("-------- World Move Played --------")
                break;
            } else {
                await bettingContract.startVoteTimer(tx_params);
                console.log("-------- No World Move Ready --------")
            }
        }
        console.log("");
    });
}

// async function runLeelaTest() {
//     const polygonMumbai = {
//         name: "arbitrum-goerli",
//         chainId: 421613
//     };
//     const provider = new providers.InfuraProvider(polygonMumbai, API_KEY);
//     const owner = new Wallet(PRIVATE_KEY ?? "", provider);

//     const bettingContract = BettingGame__factory.connect(BETTING_ADDR ?? "", owner);
//     const chessContract = Chess__factory.connect(CHESS_ADDR ?? "", owner);
//     const validatorContract = Validator__factory.connect(VALIDATOR_ADDR ?? "", owner);

//     fs.rmSync("./proof_dir", {recursive: true, force: true});
//     fs.mkdirSync("./proof_dir");
//     //ingest circuit input and start leela/hash inputs
//     var nnBoardRepr = await chessContract.convertToCircuit();
//     fs.writeFileSync("./proof_dir/leelaInputs.json", JSON.stringify(nnBoardRepr.map((x) => x.toString())));  

//     execFile("./run_leela", (error, stdout, stderr) => {
//         //some error handling?
//         console.log("run leela exited");
//         console.log(error);
//         console.log(stdout);
//         console.log(stderr);
//     });

//     console.log("run_leela is started!");

//     await bettingContract.leelaHashInputs();

//     console.log("inputs hashed!");

//     await bettingContract.giveLeelaLegalMoves();

//     //when output_calc.json is ready start hashing outputs
//     await new Promise((resolve, reject) => {fs.watch("./proof_dir/", (eventType, fileName) => {
//         if (fileName == "calc_output.json") {
//             resolve(true)
//         }
//     })});

//     await new Promise((resolve, reject) => setTimeout(() => resolve(true), 100));

//     console.log("started hashing output!");

//     var outputs = JSON.parse(fs.readFileSync("./proof_dir/calc_output.json").toString());
//     var outputsBn: any[] = [];
//     for (var i = 0; i < outputs.length; i++) {
//       var outputBn = BigNumber.from(outputs[i])
//       if (outputBn.isNegative()) {
//         outputBn = outputBn.add(BigNumber.from("0x30644e72e131a029b85045b68181585d2833e84879b9709143e1f593f0000001"));
//       }
//       outputsBn.push(outputBn)
//     }

//     var outputChunks = [outputsBn.slice(0, 250), outputsBn.slice(250, 500), outputsBn.slice(500, 750), outputsBn.slice(750, 1000), outputsBn.slice(1000, 1250), outputsBn.slice(1250, 1500), outputsBn.slice(1500, 1750)];

//     var chunkStart = 0;
//     var chunkEnd = 250;

//     // for (var chunk of outputChunks) {
//     //   var trans = await validatorContract.hashOutputChunk(chunk, chunkStart, chunkEnd, {gasLimit: 15000000})
//     //   await trans.wait();
//     //   chunkStart += 250;
//     //   chunkEnd += 250;
//     // }

//     // await validatorContract.hashOutputChunk(outputsBn.slice(1750, 1858), 1750, 1858, {gasLimit: 15000000});

//     console.log("finished hashing output")
//     //when proof is ready and outputs are hashed send proof/instances to betting contract
//     await new Promise((resolve, reject) => {fs.watch("./proof_dir/", (eventType, fileName) => {
//         if (fileName == "limbs_instance") {
//             resolve(true)
//         }
//     })});

//     console.log("verifying leela move!")

//     var proof_raw = fs.readFileSync("./proof_dir/proof");
//     var proof_hex = "0x" + proof_raw.reduce((output, elem) => (output + ('0' + elem.toString(16)).slice(-2)), '');

//     var instance_raw = fs.readFileSync("./proof_dir/limbs_instance");
//     var instance_hex = "0x" + instance_raw.reduce((output, elem) => (output + ('0' + elem.toString(16)).slice(-2)), '');  

//     await bettingContract.makeLeelaMove(proof_hex, instance_hex, {gasLimit: 15000000});  
// }

// async function listenerTest() {
//     const polygonMumbai = {
//         name: "maticmum",
//         chainId: 80001
//     };
//     const provider = new providers.AlchemyProvider(polygonMumbai, API_KEY);
//     const owner = new Wallet(PRIVATE_KEY ?? "", provider);

//     const bettingContract = BettingGame__factory.connect(BETTING_ADDR ?? "", owner);

//     bettingContract.on(bettingContract.filters.leelaMovePlayed(), async function () {
//         //get current timer length
//         //set callback for timer, when finished play move.
//         console.log("Leela played move!")
//     });

// }

checkLeela();
// runLeelaTest();
//listenerTest();