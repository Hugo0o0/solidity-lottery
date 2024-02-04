import { ethers } from "hardhat";

const devChains = ["hardhat", "localhost"];

export interface NetworkConfig {
  vrfAddress?: string;
  entranceFee: bigint;
  keyHash?: string;
  subscriptionId?: string;
  callbackGasLimit?: string;
  interval?: string;
}

interface NetworksConfig {
  [network: string]: NetworkConfig;
}

const networkConfig: NetworksConfig = {
  sepolia: {
    vrfAddress: "0x8103B0A8A00be2DDC778e6e7eaa21791Cd364625",
    entranceFee: ethers.parseEther("0.01"),
    keyHash:
      "0x474e34a077df58807dbe9c96d3c009b23b3c6d0cce433e59bbf5b34f823bc56c",
    subscriptionId: "9106",
    callbackGasLimit: "500000",
    interval: "30",
  },
  hardhat: {
    entranceFee: ethers.parseEther("0.01"),
    callbackGasLimit: "500000",
    interval: "30",
    keyHash:
      "0x474e34a077df58807dbe9c96d3c009b23b3c6d0cce433e59bbf5b34f823bc56c",
  },
};

export { devChains, networkConfig };
