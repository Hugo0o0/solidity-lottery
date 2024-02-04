import { networkConfig } from "../hardhat-config-helper";

const getNetworkConfigByKey = (key: string) => {
  return networkConfig[key];
};
export default getNetworkConfigByKey;
