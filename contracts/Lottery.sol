// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@chainlink/contracts/src/v0.8/interfaces/VRFCoordinatorV2Interface.sol";
import "@chainlink/contracts/src/v0.8/vrf/VRFConsumerBaseV2.sol";
import "@chainlink/contracts/src/v0.8/automation/AutomationCompatible.sol";

error Lottery__NotEnoughETH();
error Lottery__TransferFailed();
error Lottery__NotOpen();
error Lottery__UpkeepNotNeeded(uint256 balance, uint256 players, uint256 state);

contract Lottery is VRFConsumerBaseV2, AutomationCompatibleInterface {
    enum LotteryState {
        OPEN,
        CALCULATING
    }

    address payable[] private s_players;
    address private s_recentWinner;
    LotteryState private s_lotteryState;
    uint256 private s_lastTimestamp;

    uint256 private immutable i_entranceFee;
    VRFCoordinatorV2Interface private immutable i_vrfCoordinatorV2;
    bytes32 private immutable i_keyHash;
    uint64 private immutable i_subscriptionId;
    uint32 private immutable i_callbackGasLimit;
    uint256 private immutable i_interval;

    uint16 private constant REQUEST_CONFIRMATIONS = 3;
    uint32 private constant NUM_WORDS = 1;

    event LotteryEnter(address indexed player);
    event RequestedLotteryWinner(uint256 indexed requestId);
    event WinnerPick(address indexed winner);

    modifier onlyEnoughETH() {
        if (msg.value < i_entranceFee) {
            revert Lottery__NotEnoughETH();
        }
        _;
    }

    modifier onlyOpen() {
        if (s_lotteryState != LotteryState.OPEN) {
            revert Lottery__NotOpen();
        }
        _;
    }

    constructor(
        address vrfCoordinatorV2,
        uint256 entranceFee,
        bytes32 keyHash,
        uint64 subscriptionId,
        uint32 callbackGasLimit,
        uint256 interval
    ) VRFConsumerBaseV2(vrfCoordinatorV2) {
        i_entranceFee = entranceFee;
        i_vrfCoordinatorV2 = VRFCoordinatorV2Interface(vrfCoordinatorV2);
        i_keyHash = keyHash;
        i_subscriptionId = subscriptionId;
        i_callbackGasLimit = callbackGasLimit;
        i_interval = interval;
        s_lotteryState = LotteryState.OPEN;
        s_lastTimestamp = block.timestamp;
    }

    function enterLottery() public payable onlyOpen onlyEnoughETH {
        s_players.push(payable(msg.sender));
        emit LotteryEnter(msg.sender);
    }

    function performUpkeep(bytes calldata performData) external override {
        (bool upkeepNeeded, ) = checkUpkeep(performData);
        if (!upkeepNeeded) {
            revert Lottery__UpkeepNotNeeded(
                address(this).balance,
                s_players.length,
                uint256(s_lotteryState)
            );
        }
        s_lotteryState = LotteryState.CALCULATING;
        uint256 requestId = i_vrfCoordinatorV2.requestRandomWords(
            i_keyHash,
            i_subscriptionId,
            REQUEST_CONFIRMATIONS,
            i_callbackGasLimit,
            NUM_WORDS
        );
    }

    function fulfillRandomWords(
        uint256 /* requestId */,
        uint256[] memory randomWords
    ) internal override {
        uint256 winnerIndex = randomWords[0] % s_players.length;
        address recentWinner = s_players[winnerIndex];
        s_recentWinner = recentWinner;
        s_lotteryState = LotteryState.OPEN;
        s_players = new address payable[](0);
        s_lastTimestamp = block.timestamp;

        (bool success, ) = recentWinner.call{value: address(this).balance}("");

        if (!success) {
            revert Lottery__TransferFailed();
        }
        emit WinnerPick(recentWinner);
    }

    function checkUpkeep(
        bytes memory /* checkData */
    )
        public
        view
        override
        returns (bool upkeepNeeded, bytes memory /* performData */)
    {
        bool isOpen = s_lotteryState == LotteryState.OPEN;
        bool isInterval = block.timestamp >= s_lastTimestamp + i_interval;
        bool hasEnoughPlayers = s_players.length > 0;
        bool hasEnoughETH = address(this).balance >= i_entranceFee;
        upkeepNeeded = isOpen && isInterval && hasEnoughPlayers && hasEnoughETH;
    }

    function getEntranceFee() public view returns (uint256) {
        return i_entranceFee;
    }

    function getPlayer(uint256 index) public view returns (address payable) {
        return s_players[index];
    }

    function getRecentWinner() public view returns (address) {
        return s_recentWinner;
    }

    function getLotteryState() public view returns (LotteryState) {
        return s_lotteryState;
    }

    function getNumWords() public pure returns (uint256) {
        return NUM_WORDS;
    }

    function getNumberOfPlayers() public view returns (uint256) {
        return s_players.length;
    }

    function getLatestTimeStamp() public view returns (uint256) {
        return s_lastTimestamp;
    }

    function getRequestConfirmations() public pure returns (uint256) {
        return REQUEST_CONFIRMATIONS;
    }

    function getVrfV2Coordinator() public view returns (address) {
        return address(i_vrfCoordinatorV2);
    }

    function getKeyHash() public view returns (bytes32) {
        return i_keyHash;
    }

    function getSubscriptionId() public view returns (uint64) {
        return i_subscriptionId;
    }

    function getCallbackGasLimit() public view returns (uint32) {
        return i_callbackGasLimit;
    }

    function getInterval() public view returns (uint256) {
        return i_interval;
    }
}
