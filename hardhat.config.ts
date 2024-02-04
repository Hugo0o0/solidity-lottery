import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
import "hardhat-contract-sizer";
import "dotenv/config";
import "hardhat-deploy";

const {
  PRIVATE_KEY = "",
  ETHERSCAN_API_KEY,
  LOCAL_NETWORK_URL,
  RPC_URL,
} = process.env;

const config: HardhatUserConfig = {
  defaultNetwork: "hardhat",
  solidity: {
    compilers: [
      { version: "0.8.19" },
      { version: "0.8.4" },
      { version: "0.8.0" },
    ],
  },
  etherscan: {
    apiKey: ETHERSCAN_API_KEY,
  },
  networks: {
    sepolia: {
      url: RPC_URL,
      accounts: [PRIVATE_KEY],
      chainId: 11155111,
    },
    localhost: {
      url: LOCAL_NETWORK_URL,
      chainId: 31337,
    },
  },
  namedAccounts: {
    deployer: {
      default: 0,
    },
    player: {
      default: 1,
    },
  },
};

export default config;
