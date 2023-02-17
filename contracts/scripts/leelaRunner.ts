import { providers, Wallet } from 'ethers';

import { BettingGame__factory, Chess__factory, Validator__factory } from '../typechain-types';
require('dotenv').config();

const { API_KEY, BETTING_ADDR, PRIVATE_KEY } = process.env;

async function checkLeela() {
    const provider = new providers.AlchemyProvider("polygon_mumbai", API_KEY);
    const owner = new Wallet(PRIVATE_KEY ?? "", provider);

    const bettingContract = BettingGame__factory.connect(BETTING_ADDR ?? "", owner);

    bettingContract.on(bettingContract.filters.worldMovePlayed(), async function () {
        //ingest circuit input and start leela/hash inputs

        //when output_calc.json is ready start hashing outputs

        //when proof is ready and outputs are hashed send proof/instances to betting contract
    });

    bettingContract.on(bettingContract.filters.leelaMovePlayed(), async function () {
        //get current timer length
        //set callback for timer, when finished play move.
    });
}

checkLeela();