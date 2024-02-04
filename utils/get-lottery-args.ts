import { Address } from "hardhat-deploy/dist/types";
import { NetworkConfig } from "../hardhat-config-helper";

const getLotteryArgs = (
  config: NetworkConfig,
  subId?: string,
  vrfAddress?: Address
) => {
  return [
    vrfAddress || config.vrfAddress,
    config.entranceFee,
    config.keyHash,
    subId || config.subscriptionId,
    config.callbackGasLimit,
    config.interval,
  ];
};

export default getLotteryArgs;
