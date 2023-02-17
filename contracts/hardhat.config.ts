import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
import "hardhat-gas-reporter";
// import "hardhat-tracer";
// import 'hardhat-contract-sizer';
require('dotenv').config();
// require("@nomiclabs/hardhat-ethers");

const { API_URL, PRIVATE_KEY } = process.env;
const config: HardhatUserConfig = {
  solidity: {
    version: "0.8.17",
    settings: {
      optimizer: {
        enabled: true,
        runs: 500,
        details: {
          yul: false
        },
      },
    },

  },

  networks: {
    hardhat: {
      allowUnlimitedContractSize: true,
      gas: "auto",
      gasPrice: "auto",
      gasMultiplier: 4,
      chainId: 1337,
    },
    // polygon_mumbai: {
    //   url: API_URL,
    //   accounts: [`0x${PRIVATE_KEY}`]
    // }
  },

  // gasReporter: {
  //   enabled: true,
  // },

  mocha: {
    timeout: 400000
  }


};

export default config;
