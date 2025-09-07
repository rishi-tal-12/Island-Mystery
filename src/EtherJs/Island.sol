// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

contract Island {
    address public owner;
    address public centralContract;
    uint256 public totalHexes;

    uint256 constant MAX_HEXES = 18;

    struct Stats {
        uint256 attack;
        uint256 defense;
        uint256 wheat;
        uint256 gold;
    }

    Stats public stats;

    enum BuildingType {
        None,
        Farm,
        Mine,
        Defense,
        TroopCamp
    }

    struct Building {
        BuildingType bType;
        uint256 lastUpdated;
    }

    mapping(uint256 => Building) public hexes;
    mapping(uint256 => bool) public unlockedHexes;

    event BuildPlaced(uint256 indexed hexIndex, BuildingType bType);
    event ResourcesGenerated(uint256 newWheat, uint256 newGold);
    event HexUnlocked(uint256 indexed hexIndex);
    event StatsRepaired(uint256 newAttackStat, uint256 newDefenseStat, uint256 newWheat, uint256 newGold);

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

        for (uint256 i = 0; i < 5; i++) {
            unlockedHexes[i] = true;
        }
    }

    function generateDailyResources() external onlyAuthorized {
        uint256 farms = countBuildingsOfType(BuildingType.Farm);
        uint256 mines = countBuildingsOfType(BuildingType.Mine);

        stats.wheat += farms * 5;
        stats.gold += mines * 5;

        emit ResourcesGenerated(stats.wheat, stats.gold);
    }

    function placeBuilding(uint256 hexIndex, BuildingType bType) external onlyOwner {
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

        hexes[hexIndex] = Building({bType: bType, lastUpdated: block.timestamp});

        emit BuildPlaced(hexIndex, bType);
    }

    function unlockHex(uint256 hexIndex) external onlyOwner {
        require(hexIndex < MAX_HEXES, "Invalid hex index");
        require(!unlockedHexes[hexIndex], "Hex already unlocked");
        require(totalHexes < MAX_HEXES, "Maximum hexes reached");
        require(stats.gold >= 50, "Not enough gold to unlock hex");

        stats.gold -= 50;
        unlockedHexes[hexIndex] = true;
        totalHexes += 1;

        emit HexUnlocked(hexIndex);
    }

    function updateStats(uint256 newAttack, uint256 newDefense, uint256 newWheat, uint256 newGold)
        external
        onlyAuthorized
    {
        stats.attack = newAttack;
        stats.defense = newDefense;
        stats.wheat = newWheat;
        stats.gold = newGold;
    }

    function repairStats(uint256 wheatSpent, bool isAttack) external onlyOwner {
        require(stats.wheat >= wheatSpent, "Not enough wheat");

        uint256 points = wheatSpent * 10;
        uint256 towerCount = countBuildingsOfType(BuildingType.Defense) + countBuildingsOfType(BuildingType.TroopCamp);
        uint256 maxCap = 100 + (towerCount * 100);

        stats.wheat -= wheatSpent;

        if (isAttack) {
            stats.attack = (stats.attack + points > maxCap) ? maxCap : stats.attack + points;
        } else {
            stats.defense = (stats.defense + points > maxCap) ? maxCap : stats.defense + points;
        }

        emit StatsRepaired(stats.attack, stats.defense, stats.wheat, stats.gold);
    }

    function getStats() external view returns (uint256 attack, uint256 defense, uint256 wheat, uint256 gold) {
        return (stats.attack, stats.defense, stats.wheat, stats.gold);
    }

    function getWheat() external view returns (uint256) {
        return stats.wheat;
    }

    function getGold() external view returns (uint256) {
        return stats.gold;
    }

    function getTotalHexes() external view returns (uint256) {
        return totalHexes;
    }

    function isHexUnlocked(uint256 hexIndex) external view returns (bool) {
        return unlockedHexes[hexIndex];
    }

    function getUnlockedHexes() external view returns (uint256[] memory) {
        uint256[] memory unlockedList = new uint256[](totalHexes);
        uint256 count = 0;

        for (uint256 i = 0; i < MAX_HEXES && count < totalHexes; i++) {
            if (unlockedHexes[i]) {
                unlockedList[count] = i;
                count++;
            }
        }

        return unlockedList;
    }

    function countBuildingsOfType(BuildingType bType) internal view returns (uint256 count) {
        for (uint256 i = 0; i < MAX_HEXES; i++) {
            if (unlockedHexes[i] && hexes[i].bType == bType) {
                count++;
            }
        }
    }

    function getAttackStat() external view returns (uint256) {
        return countBuildingsOfType(BuildingType.TroopCamp) * 10;
    }

    function getDefenseStat() external view returns (uint256) {
        return countBuildingsOfType(BuildingType.Defense) * 10;
    }
}
