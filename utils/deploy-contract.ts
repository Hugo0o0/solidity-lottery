import { getNamedAccounts } from "hardhat";
import { DeploymentsExtension } from "hardhat-deploy/dist/types";
import { ENTRANCE_FEE } from "./constants";

const deployContract = async (deployments: DeploymentsExtension) => {
  const { deployer } = await getNamedAccounts();
  return await deployments.deploy("Lottery", {
    from: deployer,
    args: [ENTRANCE_FEE], // entrance fee
    waitConfirmations: 1,
    log: true,
  });
};

export default deployContract;
