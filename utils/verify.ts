import { run, ethers } from "hardhat";
import { Address } from "hardhat-deploy/dist/types";

const verify = async (address: Address, constructorArguments: any[]) => {
  try {
    await run("verify:verify", {
      address,
      constructorArguments,
    });
  } catch (error) {
    console.error("Error verifying contract:", error);
    process.exit(1);
  }
};

export default verify;
