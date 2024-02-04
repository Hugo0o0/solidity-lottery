import { getNamedAccounts, network } from "hardhat";
import { DeploymentsExtension } from "hardhat-deploy/dist/types";
import getNetworkConfigByKey from "./get-network-config-by-key";
import verify from "./verify";
import getLotteryArgs from "./get-lottery-args";

const deployToActualChain = async (deployments: DeploymentsExtension) => {
  const config = getNetworkConfigByKey(network.name);
  const args = getLotteryArgs(config);
  const { deployer } = await getNamedAccounts();
  const lottery = await deployments.deploy("Lottery", {
    from: deployer,
    args,
    log: true,
    waitConfirmations: 1,
  });

  await verify(lottery.address, args);
};

export default deployToActualChain;
