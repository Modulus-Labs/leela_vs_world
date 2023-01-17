import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
import "hardhat-gas-reporter";
import "hardhat-tracer";
import 'hardhat-contract-sizer';

const config: HardhatUserConfig = {
  solidity: {
    version: "0.8.17",
    settings: { 
      optimizer: { 
        enabled: true, 
        runs: 500, 
        details: { 
          yul: false }, 
        }, 
      },

  },

  networks: {
    hardhat: {
      allowUnlimitedContractSize: true,
      gas: "auto",
      gasPrice: "auto",
      gasMultiplier: 4,
    },
    
  },

  gasReporter: {
    enabled: true,
  },

  
};

export default config;
