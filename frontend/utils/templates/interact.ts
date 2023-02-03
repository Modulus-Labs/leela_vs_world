require('dotenv').config();
const alchemyKey = process.env.ALCHEMY_KEY;
const { createAlchemyWeb3 } = require("@alch/alchemy-web3");
const web3 = createAlchemyWeb3(alchemyKey);

const contractABI = require('../contract-abi.json');
const contractAddress = "0x";

export const bettingContract = new web3.eth.Contract(
    contractABI,
    contractAddress
);

export const getNextVotedMove = async () => {

};

export const timerToNextMove = async () => {
    
};

