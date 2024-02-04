import { deployments, ethers, getNamedAccounts, network } from "hardhat";
import { Lottery, VRFCoordinatorV2Mock } from "../../typechain-types";
import { assert, expect } from "chai";
import { Address } from "hardhat-deploy/dist/types";
import { networkConfig } from "../../hardhat-config-helper";
import { devChains } from "../../hardhat-config-helper";

!devChains.includes(network.name)
  ? describe.skip
  : describe("Lottery", () => {
      let lottery: Lottery,
        deployer: Address,
        vrfCoordinator: VRFCoordinatorV2Mock,
        interval: bigint,
        lotteryAddress: Address;

      const lotteryEntranceFee = networkConfig[network.name].entranceFee;

      beforeEach(async () => {
        deployer = (await getNamedAccounts()).deployer;
        const contracts = await deployments.fixture(["all"]);
        lottery = await ethers.getContractAt(
          "Lottery",
          contracts.Lottery.address
        );
        vrfCoordinator = await ethers.getContractAt(
          "VRFCoordinatorV2Mock",
          contracts.VRFCoordinatorV2Mock.address
        );

        interval = await lottery.getInterval();
        lotteryAddress = await lottery.getAddress();
      });

      describe("constructor", () => {
        it("Should set constructor arguments correctly", async () => {
          assert.equal(
            await lottery.getVrfV2Coordinator(),
            await vrfCoordinator.getAddress()
          );
          assert.equal(await lottery.getEntranceFee(), lotteryEntranceFee);
          assert.equal(
            await lottery.getKeyHash(),
            networkConfig[network.name].keyHash
          );
          assert.equal(
            (await lottery.getCallbackGasLimit()).toString(),
            networkConfig[network.name].callbackGasLimit
          );
          assert.equal(
            (await lottery.getInterval()).toString(),
            networkConfig[network.name].interval
          );
        });
      });

      describe("Enter Lottery", () => {
        it("Should not allow user to enter if entrance fee is not enough", async () => {
          await expect(
            lottery.enterLottery({ value: 9 })
          ).to.be.revertedWithCustomError(lottery, "Lottery__NotEnoughETH");
        });

        it("Should add new player to players array", async () => {
          const txResponse = await lottery.enterLottery({
            value: lotteryEntranceFee,
          });
          await txResponse.wait(1);
          const player = await lottery.getPlayer(0);
          assert.equal(player, deployer);
        });

        it("Should emit an event", async () => {
          await expect(
            lottery.enterLottery({ value: lotteryEntranceFee })
          ).to.emit(lottery, "LotteryEnter");
        });

        it("Should not allow entrance when lottery state CALCULATING", async () => {
          await lottery.enterLottery({ value: lotteryEntranceFee });
          await network.provider.send("evm_increaseTime", [Number(interval)]);
          await network.provider.send("evm_mine", []);
          await lottery.performUpkeep("0x");

          await expect(
            lottery.enterLottery({ value: lotteryEntranceFee })
          ).to.be.revertedWithCustomError(lottery, "Lottery__NotOpen");
        });
      });

      describe("Check upkeep", () => {
        it("returns false if people have not send any ETH", async () => {
          const [upKeed] = await lottery.checkUpkeep.staticCall("0x");
          assert.equal(upKeed, false);
        });

        it("returns true if conditions fulfilled", async () => {
          await lottery.enterLottery({ value: lotteryEntranceFee });
          await network.provider.send("evm_increaseTime", [Number(interval)]);
          await network.provider.send("evm_mine", []);
          const [upKeed] = await lottery.checkUpkeep.staticCall("0x");
          assert.equal(upKeed, true);
        });
      });

      describe("Perform upkeep", () => {
        it("can only run if checkUpkeep returns true", async () => {
          await lottery.enterLottery({ value: lotteryEntranceFee });
          await network.provider.send("evm_increaseTime", [Number(interval)]);
          await network.provider.send("evm_mine", []);
          const tx = await lottery.performUpkeep("0x");

          assert(tx);
        });

        it("should revert if checkUpkeep returns false", async () => {
          await expect(
            lottery.performUpkeep("0x")
          ).to.be.revertedWithCustomError(lottery, "Lottery__UpkeepNotNeeded");
        });

        it("should change LotteryState", async () => {
          await lottery.enterLottery({ value: lotteryEntranceFee });
          await network.provider.send("evm_increaseTime", [Number(interval)]);
          await network.provider.send("evm_mine", []);
          const tx = await lottery.performUpkeep("0x");
          const txReceipt = await tx.wait(1);

          const filter = vrfCoordinator.filters.RandomWordsRequested;
          const events = await vrfCoordinator.queryFilter(
            filter,
            txReceipt?.blockHash
          );

          const requestId = events[0].args?.requestId;

          assert(Number(requestId) > 0);
          assert(Number(await lottery.getLotteryState()) === 1);
          // @ts-ignore
        });
      });

      describe("Fulfill random words", () => {
        beforeEach(async () => {
          await lottery.enterLottery({ value: lotteryEntranceFee });
          await network.provider.send("evm_increaseTime", [Number(interval)]);
          await network.provider.send("evm_mine", []);
        });
        it("can only be called after performUpKeep", async () => {
          await expect(
            vrfCoordinator.fulfillRandomWords(0, lotteryAddress)
          ).to.be.revertedWith("nonexistent request");

          await expect(
            vrfCoordinator.fulfillRandomWords(0, lotteryAddress)
          ).to.be.revertedWith("nonexistent request");
        });

        it("picks winner, reset the lottery,and send money", async () => {
          const additionalEntrance = 3;
          const startingAccountIndex = 1;
          const accounts = await ethers.getSigners();

          for (
            let i = startingAccountIndex;
            i < startingAccountIndex + additionalEntrance;
            i++
          ) {
            const accountConnectedLottery = lottery.connect(accounts[i]);
            await accountConnectedLottery.enterLottery({
              value: lotteryEntranceFee,
            });
          }

          const startingTimeStamp = await lottery.getLatestTimeStamp();

          await new Promise(async (resolve, reject) => {
            lottery.once(lottery.filters.WinnerPick, async () => {
              console.log("Winner picked event detected");
              try {
                const raffleState = await lottery.getLotteryState();
                const endingTimeStamp = await lottery.getLatestTimeStamp();
                const numPlayers = await lottery.getNumberOfPlayers();
                assert.equal(numPlayers.toString(), "0");
                assert.equal(raffleState.toString(), "0");
                assert(endingTimeStamp > startingTimeStamp);
              } catch (error) {
                reject(error);
              }

              resolve("done");
            });

            const tx = await lottery.performUpkeep("0x");
            const txReceipt = await tx.wait(1);

            const filter = vrfCoordinator.filters.RandomWordsRequested;
            const events = await vrfCoordinator.queryFilter(
              filter,
              txReceipt?.blockHash
            );

            const requestId = events[0].args?.requestId;

            await vrfCoordinator.fulfillRandomWords(requestId, lotteryAddress);
          });
        });
      });
    });
