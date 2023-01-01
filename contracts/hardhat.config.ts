import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
import "hardhat-gas-reporter";
import "hardhat-tracer"

const config: HardhatUserConfig = {
  solidity: "0.8.17",
  networks: {
    hardhat: {
      allowUnlimitedContractSize: true,
      gas: "auto",
      gasPrice: "auto",
      gasMultiplier: 4,
    }
  },
  gasReporter: {
    enabled: true,
  }

};

export default config;
