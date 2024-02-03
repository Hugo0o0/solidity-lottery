import { deployments, ethers, getNamedAccounts } from "hardhat";
import { Lottery } from "../../typechain-types";
import { assert, expect } from "chai";
import { Address } from "hardhat-deploy/dist/types";

describe("Lottery", () => {
  let lottery: Lottery;
  let deployer: Address;

  beforeEach(async () => {
    deployer = (await getNamedAccounts()).deployer;
    const contracts = await deployments.fixture(["all"]);
    lottery = await ethers.getContractAt("Lottery", contracts.Lottery.address);
  });

  describe("constructor", () => {
    it("Should set entrance fee correctly", async () => {
      const entranceFee = await lottery.getEntranceFee();
      assert.equal(entranceFee.toString(), "10");
    });
  });

  describe("Enter Lottery", () => {
    it("Should not allow user to enter if entrance fee is not enough", async () => {
      await expect(
        lottery.enterLottery({ value: 9 })
      ).to.be.revertedWithCustomError(lottery, "Lottery__NotEnoughETH");
    });

    it("Should add new player to players array", async () => {
      const txResponse = await lottery.enterLottery({ value: 11 });
      await txResponse.wait(1);
      const player = await lottery.getPlayer(0);
      assert.equal(player, deployer);
    });
  });
});
