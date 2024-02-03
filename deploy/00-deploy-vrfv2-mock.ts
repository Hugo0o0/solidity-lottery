import { DeployFunction } from "hardhat-deploy/dist/types";
import { devChains } from "../hardhat-config-helper";
import { ethers, network } from "hardhat";

const BASE_FEE = ethers.parseEther("0.25");
const GAS_PRICE_LINK = 1e9;

const func: DeployFunction = async ({ deployments, getNamedAccounts }) => {
  if (!devChains.includes(network.name)) return;

  const { deployer } = await getNamedAccounts();

  deployments.log("Local network detected! Deploying mocks...");

  await deployments.deploy("VRFCoordinatorV2Mock", {
    from: deployer,
    args: [BASE_FEE, GAS_PRICE_LINK],
    log: true,
  });
  deployments.log("----------------------------------------------------------");
};

func.tags = ["mock", "all"];

export default func;
