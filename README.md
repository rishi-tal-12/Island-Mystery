# 🏝️ Arland- Island Strategy Game

[![Play Arland Now](https://img.shields.io/badge/Play_Arland_Now-7289DA?style=for-the-badge&logo=google-chrome&logoColor=white)](https://island-mystery.vercel.app/)
![Island Mystery Banner](https://img.shields.io/badge/Island%20Mystery-Blockchain%20Strategy%20Game-blue?style=for-the-badge&logo=ethereum)

[![Built with React](https://img.shields.io/badge/React-18.3.1-61DAFB?style=flat&logo=react)](https://reactjs.org/)
[![Solidity](https://img.shields.io/badge/Solidity-^0.8.19-363636?style=flat&logo=solidity)](https://soliditylang.org/)
[![Arbitrum](https://img.shields.io/badge/Arbitrum-Sepolia-28A0F0?style=flat&logo=arbitrum)](https://arbitrum.io/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.8.3-3178C6?style=flat&logo=typescript)](https://www.typescriptlang.org/)
[![Ethers.js](https://img.shields.io/badge/Ethers.js-6.15.0-2535A0?style=flat)](https://ethers.org/)

*A decentralized island strategy game where players build, battle, and trade on the Arbitrum blockchain*

[🎮 Play Arland Now](#play-online) • [🎮 Game Mechanics](#game-mechanics) • [🏗️ Architecture](#architecture) • [🚀 Getting Started](#getting-started) • [🤝 Contributing](#contributing)


---

## 🌟 Overview

*Arland* is an immersive blockchain-based strategy game that combines the excitement of territorial conquest with the innovation of decentralized gaming. Players manage their own islands, construct buildings, engage in strategic combat, and participate in a player-driven economy—all secured by smart contracts on the Arbitrum network.

### ✨ Key Features

- 🏝️ *Island Management*: Own and customize your unique island with hexagonal building placement
- ⚔️ *Strategic Combat*: Attack other players' islands using attack vs defense mechanics
- 🤝 *Resource Trading*: Engage in bilateral trades with wheat and gold resources
- 🏗️ *Building System*: Construct farms, mines, defense towers, and troop camps
- 🎯 *PVP Battles*: Real-time player vs player combat modes
- 🔗 *Blockchain Integration*: All game state secured on Arbitrum for true ownership
- 🎨 *3D Visuals*: Beautiful Spline 3D environments and modern UI design

---

## 🎮 Game Mechanics  <a name="game-mechanics"></a>

### 🏗️ Island Building System

Each player owns an island with *18 hexagonal plots* arranged in a unique 3-4-4-4-3 pattern. Players start with 5 unlocked hexes and can expand by purchasing additional plots.

#### Building Types

| Building | Cost | Production | Bonus |
|----------|------|------------|-------|
| 🌾 *Farm* | 5 Wheat + 5 Gold | +5 Wheat/day | Food production |
| ⛏️ *Mine* | 5 Wheat + 5 Gold | +5 Gold/day | Currency generation |
| 🛡️ *Defense Tower* | 30 Gold | None | +10 Defense Power |
| ⚔️ *Troop Camp* | 30 Gold | None | +10 Attack Power |

### 💰 Resource Economy

- *🌾 Wheat*: Primary food resource, essential for building and stat repairs
- *💰 Gold*: Currency for advanced buildings and hex expansion (50 gold per hex)

### ⚔️ Combat System

Strategic combat based on *Attack vs Defense* comparisons:
- *Victory*: Attacker gains 50% of defender's resources, defender loses defense
- *Defeat*: Attacker loses all attack power, defender maintains resources

### 🤝 Trading System

Players can create and execute bilateral trade proposals:
- Offer any combination of wheat and gold
- Request specific resources in return
- On-chain execution ensures trustless transactions

---

## 🎯 Game Modes

### 🗺️ *World Map Mode*
- Explore the persistent game world
- View all player islands and their power levels
- Select targets for trading or combat
- Manage your island's development

### ⚔️ *PVP Battle Mode*
- Real-time player vs player combat
- Matchmaking system for balanced fights
- Onchain projectile calculation and collision detection
- Victory rewards

### 🏝️ *Island Management*
- Detailed hex-based building interface
- Resource management and production tracking
- Building placement and upgrade system
- Trade inbox for incoming proposals

---

## 🏗️ Architecture <a name="architecture"></a>

### 📋 Smart Contracts

#### MainLogic Contract

*Address:* `0x358b989C4c5F1b849E3C3310134371767915f76e`

Core game controller managing:
- Island registration and discovery
- Combat resolution and validation
- Trade request creation and execution
- Daily resource generation for all islands (Chainlink Automation)

Solidity Key Functions

```
function getAllRegisteredIslands() external view returns (address[] memory);

function attack(address defenderIsland) external;

function tradeRequest(
    address receiverIsland, 
    uint256 wheatOffered, 
    uint256 goldOffered, 
    uint256 wheatRequested, 
    uint256 goldRequested
) external;

function tradeExecute(address sender) external;
```

#### Island Contract
Individual player-owned contracts containing:
- Island stats (attack, defense, wheat, gold)
- Hex unlock status and building placements
- Resource generation and management
- Building construction and upgrades

Solidity Key Functions

```
function placeBuilding(uint hexIndex, BuildingType bType) external

function unlockHex(uint hexIndex) external

function getStats() external view returns (uint attack, uint defense, uint wheat, uint gold)

function repairStats(uint wheatSpent, bool isAttack) external
```

#### PVP contract
Contract for heavy calculations for colllision and trajectory written in rust stylus for efficiency:
- Players set horizontal angle, vertical angle and speed of projectile
- Path calculation
- Collision detection
- Ship's mass and radius registration

### 🎨 Frontend Architecture

Built with modern React ecosystem:

```
src/
├── 📁 components/          # React UI components
│   ├── GameMap.tsx         # World map interface
│   ├── IslandViewHex.tsx   # Island management
│   ├── TradeProposalModal.tsx
│   └── PlayerActionDialog.tsx
├── 📁 EtherJs/            # Blockchain integration
│   ├── MainLogic.sol      # Smart contracts
│   ├── Island.sol
│   ├── constants.js       # Contract addresses & ABIs
│   └── useStoreContract.js # Zustand state management
├── 📁 pages/              # Route components
└── 📁 assets/             # Game assets and icons
```

### 🔧 Technology Stack

| Category | Technology | Version |
|----------|------------|---------|
| *Frontend* | React | 18.3.1 |
| *Language* | TypeScript | 5.8.3 |
| *Build Tool* | Vite | 7.1.4 |
| *Styling* | TailwindCSS | 3.4.17 |
| *UI Components* | Radix UI + Shadcn/ui | Latest |
| *3D Graphics* | React Three Fiber + Spline | Latest |
| *Blockchain* | Ethers.js | 6.15.0 |
| *Network* | Arbitrum Sepolia | Testnet |
| *State Management* | Zustand | 5.0.8 |

---

## 🚀 Getting Started <a name="getting-started"></a>

### Prerequisites

- Node.js 18+ and npm/yarn
- MetaMask or compatible Web3 wallet
- Arbitrum Sepolia testnet ETH

### Installation Guide

#### 1. Clone the repository

```bash
git clone https://github.com/rishi-tal-12/Island-Mystery
cd Island-Mystery
```

#### 2. Install dependencies

```bash
npm install
```

#### 3. Configure environment

Add **Arbitrum Sepolia** to your wallet:

* **Network Name:** Arbitrum Sepolia
* **RPC URL:** [https://sepolia-rollup.arbitrum.io/rpc](https://sepolia-rollup.arbitrum.io/rpc)
* **Chain ID:** 421614
* **Currency Symbol:** ETH

#### 4. Start the development server

```bash
npm run dev
```

#### 5. Open your browser

Go to 👉 [http://localhost:8000](http://localhost:8000)
*(Port may vary if already in use.)*

### 🎮 How to Play

1. *Connect Wallet*: Connect your MetaMask wallet to Arbitrum Sepolia
2. *Register Island*: Create your first island contract (if new player)
3. *Build & Expand*: Place buildings on your hexagonal island
4. *Gather Resources*: Farms produce wheat, mines produce gold
5. *Trade & Battle*: Interact with other players through trading and combat
6. *Grow Your Empire*: Expand your island and increase your power

---

## 🕹️ Play Arland Now <a name="play-online"></a>

The game is **live on the web**! Experience Arland directly in your browser—build your island, trade resources, and battle other players on Arbitrum Sepolia.

[🎮 Jump In & Play](https://island-mystery.vercel.app/)

---

## 📊 Game Statistics

### 🏝️ Island Specs
- *Total Hexes*: 18 per island
- *Starting Hexes*: 5 unlocked
- *Hex Unlock Cost*: 50 gold
- *Starting Resources*: 100 wheat, 100 gold
- *Max Building Level*: Currently 1 (upgrades planned)

### ⚔️ Combat Mechanics
- *Victory Reward*: 50% of defender's resources
- *Defeat Penalty*: Loss of attack power
- *Stat Repair*: 1 wheat = 10 stat points

### 💱 Economic Balance
- *Building Costs*: 5-30 resources depending on type
- *Daily Production*: 5 resources per building
- *Trade Flexibility*: Any resource combination
- *No Transaction Fees*: Beyond gas costs

---

## 🛣️ Roadmap

### Phase 1: Core Game ✅
- [x] Smart contract deployment
- [x] Basic island management
- [x] Building placement system
- [x] Resource management

### Phase 2: Social Features 🔄
- [x] Trading system
- [x] Combat mechanics
- [x] Attack function integration
- [x] Dynamic island loading

### Phase 3: Advanced Features 📋
- [ ] Building upgrades and levels
- [ ] Achievement system
- [ ] Leaderboards and rankings
- [ ] Guild/Alliance system

### Phase 4: Ecosystem 🔮
- [ ] NFT integration for unique islands
- [ ] Marketplace for resources and items
- [ ] Mobile app development
- [ ] Mainnet deployment

---

## 🤝 Contributing <a name="contributing"></a>

We welcome contributions from the community! Here's how you can help:

### 🐛 Bug Reports
- Use GitHub Issues to report bugs
- Include reproduction steps and environment details
- Check existing issues before creating new ones

### 💡 Feature Requests
- Propose new game mechanics or improvements
- Discuss ideas in GitHub Discussions
- Consider implementation complexity and game balance

### 🔧 Development
1. Fork the repository
2. Create a feature branch: git checkout -b feature/amazing-feature
3. Commit changes: git commit -m 'Add amazing feature'
4. Push to branch: git push origin feature/amazing-feature
5. Open a Pull Request

### 📝 Code Style
- Follow TypeScript best practices
- Use Prettier for code formatting
- Write meaningful commit messages
- Add comments for complex game logic

---

## 🙏 Acknowledgments

- *Arbitrum* for providing the scalable blockchain infrastructure
- *React Three Fiber* community for 3D web development tools
- *Shadcn/ui* for the beautiful component library
- *Spline* for 3D scene creation tools
- *OpenZeppelin* for secure smart contract patterns

---

## 📞 Support & Community

- 🐛 *Issues*: [GitHub Issues](https://github.com/rishi-tal-12/Island-Mystery/issues)

---

*Built with ❤️ for the Arbitrum ecosystem*

[![Star this repo](https://img.shields.io/github/stars/rishi-tal-12/Island-Mystery?style=social)](https://github.com/rishi-tal-12/Island-Mystery)