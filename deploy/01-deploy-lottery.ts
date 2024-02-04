import { DeployFunction } from "hardhat-deploy/dist/types";
import { devChains } from "../hardhat-config-helper";
import { network } from "hardhat";
import deployToDevChain from "../utils/deploy-to-dev-chain";
import deployToActualChain from "../utils/deploy-to-actual-chain";

const func: DeployFunction = async ({ deployments }) => {
  const isDevChain = devChains.includes(network.name);
  if (isDevChain) {
    await deployToDevChain(deployments);
    return;
  }
  await deployToActualChain(deployments);
};

func.tags = ["lottery", "all"];
export default func;
