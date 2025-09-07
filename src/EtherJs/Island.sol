// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

contract Island {

    address public owner;
    address public centralContract;
    uint public totalHexes;

    uint constant MAX_HEXES = 18;

    struct Stats {
        uint attack;
        uint defense;
        uint wheat;
        uint gold;
    }

    Stats public stats;

    enum BuildingType { None, Farm, Mine, Defense, TroopCamp }

    struct Building {
        BuildingType bType;
        uint lastUpdated;
    }

    mapping(uint => Building) public hexes;
    mapping(uint => bool) public unlockedHexes;

    event BuildPlaced(uint indexed hexIndex, BuildingType bType);
    event ResourcesGenerated(uint newWheat, uint newGold);
    event HexUnlocked(uint indexed hexIndex);
    event StatsRepaired(uint newAttackStat, uint newDefenseStat, uint newWheat, uint newGold);

    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner can call this");
        _;
    }

    modifier onlyAuthorized() {
        require(msg.sender == centralContract, "Only authorized contract can call this");
        _;
    }

    constructor(address _owner, address _centralContract) {
        owner = _owner;
        centralContract = _centralContract;
        stats.attack = 0;
        stats.defense = 0;
        // Initial Resources
        stats.wheat = 100;
        stats.gold = 100;
        totalHexes = 5;
        
        for (uint i = 0; i < 5; i++) {
            unlockedHexes[i] = true;
        }
    }

    function generateDailyResources() external onlyAuthorized {
        uint farms = countBuildingsOfType(BuildingType.Farm);
        uint mines = countBuildingsOfType(BuildingType.Mine);

        stats.wheat += farms * 5;
        stats.gold += mines * 5;

        emit ResourcesGenerated(stats.wheat, stats.gold);
    }

    function placeBuilding(uint hexIndex, BuildingType bType) external onlyOwner {
        require(unlockedHexes[hexIndex], "Hex not unlocked");
        require(hexes[hexIndex].bType == BuildingType.None, "Hex already occupied");

        if (bType == BuildingType.Farm || bType == BuildingType.Mine) {
            require(stats.wheat >= 5 && stats.gold >= 5, "Insufficient resources");
            stats.wheat -= 5;
            stats.gold -= 5;
        } else if (bType == BuildingType.Defense || bType == BuildingType.TroopCamp) {
            require(stats.gold >= 30, "Not enough gold");
            stats.gold -= 30;
        } else {
            revert("Invalid building type");
        }

        hexes[hexIndex] = Building({ bType: bType, lastUpdated: block.timestamp });

        emit BuildPlaced(hexIndex, bType);
    }

    function unlockHex(uint hexIndex) external onlyOwner {
        require(hexIndex < MAX_HEXES, "Invalid hex index");
        require(!unlockedHexes[hexIndex], "Hex already unlocked");
        require(totalHexes < MAX_HEXES, "Maximum hexes reached");
        require(stats.gold >= 50, "Not enough gold to unlock hex");

        stats.gold -= 50;
        unlockedHexes[hexIndex] = true;
        totalHexes += 1;

        emit HexUnlocked(hexIndex);
    }

    function updateStats(uint newAttack, uint newDefense, uint newWheat, uint newGold) external onlyAuthorized {
        stats.attack = newAttack;
        stats.defense = newDefense;
        stats.wheat = newWheat;
        stats.gold = newGold;
    }

    function repairStats(uint wheatSpent, bool isAttack) external onlyOwner {
        require(stats.wheat >= wheatSpent, "Not enough wheat");

        uint points = wheatSpent * 10;
        uint towerCount = countBuildingsOfType(BuildingType.Defense) + countBuildingsOfType(BuildingType.TroopCamp);
        uint maxCap = 100 + (towerCount * 100);

        stats.wheat -= wheatSpent;

        if (isAttack) {
            stats.attack = (stats.attack + points > maxCap) ? maxCap : stats.attack + points;
        } else {
            stats.defense = (stats.defense + points > maxCap) ? maxCap : stats.defense + points;
        }

        emit StatsRepaired(stats.attack, stats.defense, stats.wheat, stats.gold);
    }

    function getStats() external view returns (uint attack, uint defense, uint wheat, uint gold) {
        return (stats.attack, stats.defense, stats.wheat, stats.gold);
    }

    function getDefenseStat() external view returns (uint) {
        return stats.defense;
    }

    function getAttackStat() external view returns (uint) {
        return stats.attack;
    }

    function getWheat() external view returns (uint) {
        return stats.wheat;
    }

    function getGold() external view returns (uint) {
        return stats.gold;
    }

    function getTotalHexes() external view returns (uint) {
        return totalHexes;
    }

    function isHexUnlocked(uint hexIndex) external view returns (bool) {
        return unlockedHexes[hexIndex];
    }

    function getUnlockedHexes() external view returns (uint[] memory) {
        uint[] memory unlockedList = new uint[](totalHexes);
        uint count = 0;
        
        for (uint i = 0; i < MAX_HEXES && count < totalHexes; i++) {
            if (unlockedHexes[i]) {
                unlockedList[count] = i;
                count++;
            }
        }
        
        return unlockedList;
    }

    function countBuildingsOfType(BuildingType bType) internal view returns (uint count) {
        for (uint i = 0; i < MAX_HEXES; i++) {
            if (unlockedHexes[i] && hexes[i].bType == bType) {
                count++;
            }
        }
    }
}