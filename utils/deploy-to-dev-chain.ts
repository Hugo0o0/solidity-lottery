import { ethers, getNamedAccounts, network } from "hardhat";
import { DeploymentsExtension } from "hardhat-deploy/dist/types";
import getNetworkConfigByKey from "./get-network-config-by-key";
import getLotteryArgs from "./get-lottery-args";

const SUBSCRIPTION_AMOUNT = ethers.parseEther("2");

const deployToDevChain = async (deployments: DeploymentsExtension) => {
  const { deployer } = await getNamedAccounts();
  const vrfCordinatorAddress = (await deployments.get("VRFCoordinatorV2Mock"))
    .address;

  const vrfCoordinatorContract = await ethers.getContractAt(
    "VRFCoordinatorV2Mock",
    vrfCordinatorAddress
  );

  const txResponse = await vrfCoordinatorContract.createSubscription();
  const txReceipt = await txResponse.wait(1);

  // @ts-ignore
  const subscriptionId = txReceipt?.logs[0].args[0].toString();

  await vrfCoordinatorContract.fundSubscription(
    subscriptionId,
    SUBSCRIPTION_AMOUNT
  );

  const config = getNetworkConfigByKey(network.name);

  const args = getLotteryArgs(config, subscriptionId, vrfCordinatorAddress);

  const lottery = await deployments.deploy("Lottery", {
    from: deployer,
    args,
    log: true,
    waitConfirmations: 1,
  });

  await vrfCoordinatorContract.addConsumer(subscriptionId, lottery.address);
};

export default deployToDevChain;
