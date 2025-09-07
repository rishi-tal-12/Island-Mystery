// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

interface IIsland {
    function getStats() external view returns (uint256 attack, uint256 defense, uint256 wheat, uint256 gold);
    function updateStats(uint256 attack, uint256 defense, uint256 wheat, uint256 gold) external;
    function owner() external view returns (address);
    function generateDailyResources() external; // Added this function to the interface
}

contract MainLogic {
    struct Stats {
        uint256 attack;
        uint256 defense;
        uint256 wheat;
        uint256 gold;
    }

    struct TradeRequest {
        address senderIsland;
        address receiverIsland;
        uint256 wheatOffered;
        uint256 goldOffered;
        uint256 wheatRequested;
        uint256 goldRequested;
        uint256 timestamp;
        bool active;
    }

    // State variables
    mapping(address => address) public playerToIsland; // player address to island address
    address[] public registeredIslands; // Array to keep track of all registered islands

    // Nested mapping: receiver address => sender address => TradeRequest
    mapping(address => mapping(address => TradeRequest)) public tradeRequests;

    // Events
    event IslandRegistered(address indexed player, address indexed island);
    event TradeRequestCreated(
        address indexed sender, address indexed receiver, address senderIsland, address receiverIsland
    );
    event TradeExecuted(address indexed sender, address indexed receiver, address senderIsland, address receiverIsland);
    event AttackExecuted(
        address indexed attacker,
        address indexed defender,
        address attackerIsland,
        address defenderIsland,
        bool attackerWon
    );
    event StatsUpdated(address indexed island);
    event DailyResourcesGenerated(uint256 timestamp, uint256 islandsProcessed);

    // Modifiers
    modifier onlyIslandOwner(address island) {
        require(IIsland(island).owner() == msg.sender, "Not island owner");
        _;
    }

    modifier validIsland(address island) {
        require(island != address(0), "Invalid island address");
        require(playerToIsland[IIsland(island).owner()] == island, "Island not registered");
        _;
    }

    // Register a new island
    function registerNewIsland(address islandAddress) external {
        require(islandAddress != address(0), "Invalid island address");

        playerToIsland[msg.sender] = islandAddress;
        registeredIslands.push(islandAddress);

        emit IslandRegistered(msg.sender, islandAddress);
    }

    function generateDailyResourcesForAllIslands() external {
        uint256 successfulGenerations = 0;

        for (uint256 i = 0; i < registeredIslands.length; i++) {
            address island = registeredIslands[i];
            try IIsland(island).generateDailyResources() {
                successfulGenerations++;
            } catch {
                continue;
            }
        }

        emit DailyResourcesGenerated(block.timestamp, successfulGenerations);
    }

    // Create a trade request
    function tradeRequest(
        address receiverIsland,
        uint256 wheatOffered,
        uint256 goldOffered,
        uint256 wheatRequested,
        uint256 goldRequested
    ) external validIsland(receiverIsland) {
        address senderIsland = playerToIsland[msg.sender];
        require(senderIsland != address(0), "Sender doesn't have an island");
        require(receiverIsland != senderIsland, "Cannot trade with yourself");

        address receiverPlayer = IIsland(receiverIsland).owner();

        (,, uint256 senderWheat, uint256 senderGold) = IIsland(senderIsland).getStats();
        require(senderWheat >= wheatOffered, "Insufficient wheat");
        require(senderGold >= goldOffered, "Insufficient gold");

        // Create trade request
        tradeRequests[receiverPlayer][msg.sender] = TradeRequest({
            senderIsland: senderIsland,
            receiverIsland: receiverIsland,
            wheatOffered: wheatOffered,
            goldOffered: goldOffered,
            wheatRequested: wheatRequested,
            goldRequested: goldRequested,
            timestamp: block.timestamp,
            active: true
        });

        emit TradeRequestCreated(msg.sender, receiverPlayer, senderIsland, receiverIsland);
    }

    function tradeExecute(address sender) external {
        TradeRequest storage request = tradeRequests[msg.sender][sender];

        require(request.active, "Trade request not active");
        require(request.receiverIsland == playerToIsland[msg.sender], "Not the receiver of this trade");

        (uint256 senderAttack, uint256 senderDefense, uint256 senderWheat, uint256 senderGold) =
            IIsland(request.senderIsland).getStats();
        (uint256 receiverAttack, uint256 receiverDefense, uint256 receiverWheat, uint256 receiverGold) =
            IIsland(request.receiverIsland).getStats();

        require(senderWheat >= request.wheatOffered, "Sender insufficient wheat");
        require(senderGold >= request.goldOffered, "Sender insufficient gold");
        require(receiverWheat >= request.wheatRequested, "Receiver insufficient wheat");
        require(receiverGold >= request.goldRequested, "Receiver insufficient gold");

        // Directly call updateStats without new local vars
        IIsland(request.senderIsland).updateStats(
            senderAttack,
            senderDefense,
            senderWheat - request.wheatOffered + request.wheatRequested,
            senderGold - request.goldOffered + request.goldRequested
        );

        IIsland(request.receiverIsland).updateStats(
            receiverAttack,
            receiverDefense,
            receiverWheat - request.wheatRequested + request.wheatOffered,
            receiverGold - request.goldRequested + request.goldOffered
        );

        request.active = false;

        emit TradeExecuted(sender, msg.sender, request.senderIsland, request.receiverIsland);
    }

    function attack(address defenderIsland) external validIsland(defenderIsland) {
        address attackerIsland = playerToIsland[msg.sender];
        require(attackerIsland != address(0), "Attacker doesn't have an island");
        require(defenderIsland != attackerIsland, "Cannot attack yourself");

        (uint256 attackerAttackStat, uint256 attackerDefense, uint256 attackerWheat, uint256 attackerGold) =
            IIsland(attackerIsland).getStats();
        (uint256 defenderAttack, uint256 defenderDefenseStat, uint256 defenderWheat, uint256 defenderGold) =
            IIsland(defenderIsland).getStats();

        bool attackerWon = false;

        if (attackerAttackStat > defenderDefenseStat) {
            attackerWon = true;

            IIsland(attackerIsland).updateStats(
                attackerAttackStat - defenderDefenseStat,
                attackerDefense,
                attackerWheat + defenderWheat / 2,
                attackerGold + defenderGold / 2
            );

            IIsland(defenderIsland).updateStats(
                defenderAttack, 0, defenderWheat - defenderWheat / 2, defenderGold - defenderGold / 2
            );

            emit AttackExecuted(
                msg.sender, IIsland(defenderIsland).owner(), attackerIsland, defenderIsland, attackerWon
            );
        } else {
            IIsland(attackerIsland).updateStats(0, attackerDefense, attackerWheat, attackerGold);
            IIsland(defenderIsland).updateStats(
                defenderAttack, defenderDefenseStat - attackerAttackStat, defenderWheat, defenderGold
            );

            emit AttackExecuted(
                msg.sender, IIsland(defenderIsland).owner(), attackerIsland, defenderIsland, attackerWon
            );
        }
    }

    function getPlayerIsland(address player) external view returns (address) {
        return playerToIsland[player];
    }

    function getRegisteredIslandsCount() external view returns (uint256) {
        return registeredIslands.length;
    }

    function getRegisteredIsland(uint256 index) external view returns (address) {
        require(index < registeredIslands.length, "Index out of bounds");
        return registeredIslands[index];
    }

    function getTradeRequest(address receiver, address sender) external view returns (TradeRequest memory) {
        return tradeRequests[receiver][sender];
    }

    function getAllRegisteredIslands() external view returns (address[] memory) {
        return registeredIslands;
    }
}
