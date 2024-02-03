import { DeployFunction } from "hardhat-deploy/dist/types";
import { devChains } from "../hardhat-config-helper";
import { network } from "hardhat";
import verify from "../utils/verify";
import deployContract from "../utils/deploy-contract";

const func: DeployFunction = async ({ deployments }) => {
  const contract = await deployContract(deployments);

  const isDevChain = devChains.includes(network.name);

  if (isDevChain) {
    const vrfCoordinator = await deployments.get("VRFCoordinatorV2Mock");
    console.log(vrfCoordinator.address);
  }
};

func.tags = ["lottery", "all"];
export default func;
