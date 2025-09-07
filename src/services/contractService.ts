import { ethers } from 'ethers';

// Contract configuration
export const CONTRACT_ADDRESS = '0xc8a76303c110df2e130ab36477cc5e6598f83bf7';
export const RPC_URL = 'https://sepolia-rollup.arbitrum.io/rpc';
export const PRIVATE_KEY = 'f2462901bb4559fba7597a4dc717b0cfcbb8021b5a5f11d19c41dffb9800134f';

// Contract ABI
export const CONTRACT_ABI = [
  {
    "type": "function",
    "name": "registerShip",
    "inputs": [
      {"name": "x", "type": "int256"},
      {"name": "z", "type": "int256"},
      {"name": "radius", "type": "uint256"}
    ],
    "outputs": [],
    "stateMutability": "nonpayable"
  },
  {
    "type": "function",
    "name": "fireCannonball",
    "inputs": [
      {"name": "target", "type": "address"},
      {"name": "velocity", "type": "uint256"},
      {"name": "azimuth_deg", "type": "int256"},
      {"name": "vertical_deg", "type": "int256"}
    ],
    "outputs": [
      {"name": "", "type": "bool"},
      {"name": "", "type": "int256"},
      {"name": "", "type": "int256"},
      {"name": "", "type": "uint256"}
    ],
    "stateMutability": "nonpayable"
  },
  {
    "type": "function",
    "name": "getShip",
    "inputs": [
      {"name": "player", "type": "address"}
    ],
    "outputs": [
      {"name": "", "type": "int256"},
      {"name": "", "type": "int256"},
      {"name": "", "type": "uint256"}
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "getBattleResult",
    "inputs": [
      {"name": "battle_id", "type": "uint256"}
    ],
    "outputs": [
      {"name": "", "type": "bool"},
      {"name": "", "type": "int256"},
      {"name": "", "type": "int256"},
      {"name": "", "type": "uint256"}
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "getBattleCount",
    "inputs": [],
    "outputs": [
      {"name": "", "type": "uint256"}
    ],
    "stateMutability": "view"
  }
];

// Types
export interface ShipPosition {
  x: number;
  z: number;
  radius: number;
}

export interface BattleResult {
  hit: boolean;
  impactX: number;
  impactZ: number;
  distanceFromTarget: number;
}

export interface FireCannonballParams {
  target: string;
  velocity: number;
  azimuthDeg: number;
  verticalDeg: number;
}

class ContractService {
  private provider: ethers.JsonRpcProvider;
  private wallet: ethers.Wallet;
  private contract: ethers.Contract;

  constructor() {
    this.provider = new ethers.JsonRpcProvider(RPC_URL);
    this.wallet = new ethers.Wallet(PRIVATE_KEY, this.provider);
    this.contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, this.wallet);
  }

  // Register a ship at a specific position
  async registerShip(x: number, z: number, radius: number): Promise<string> {
    try {
      console.log('Registering ship:', { x, z, radius });
      const tx = await this.contract.registerShip(
        ethers.toBigInt(Math.floor(x * 100)), // Convert to contract scale
        ethers.toBigInt(Math.floor(z * 100)),
        ethers.toBigInt(radius)
      );
      await tx.wait();
      console.log('Ship registered successfully:', tx.hash);
      return tx.hash;
    } catch (error) {
      console.error('Error registering ship:', error);
      throw error;
    }
  }

  // Fire a cannonball at a target
  async fireCannonball(params: FireCannonballParams): Promise<BattleResult> {
    try {
      console.log('Firing cannonball:', params);
      const tx = await this.contract.fireCannonball(
        params.target,
        ethers.toBigInt(params.velocity * 10), // Scale velocity for contract
        ethers.toBigInt(params.azimuthDeg),
        ethers.toBigInt(params.verticalDeg)
      );
      
      const receipt = await tx.wait();
      console.log('Cannonball fired successfully:', tx.hash);

      // Get the latest battle result
      const battleCount = await this.contract.getBattleCount();
      const battleId = battleCount - 1n;
      const result = await this.contract.getBattleResult(battleId);

      return {
        hit: result[0],
        impactX: Number(result[1]) / 100, // Convert back from contract scale
        impactZ: Number(result[2]) / 100,
        distanceFromTarget: Number(result[3]) / 100
      };
    } catch (error) {
      console.error('Error firing cannonball:', error);
      throw error;
    }
  }

  // Get ship information
  async getShip(playerAddress: string): Promise<ShipPosition> {
    try {
      const result = await this.contract.getShip(playerAddress);
      return {
        x: Number(result[0]) / 100, // Convert back from contract scale
        z: Number(result[1]) / 100,
        radius: Number(result[2])
      };
    } catch (error) {
      console.error('Error getting ship:', error);
      throw error;
    }
  }

  // Get battle result by ID
  async getBattleResult(battleId: number): Promise<BattleResult> {
    try {
      const result = await this.contract.getBattleResult(ethers.toBigInt(battleId));
      return {
        hit: result[0],
        impactX: Number(result[1]) / 100,
        impactZ: Number(result[2]) / 100,
        distanceFromTarget: Number(result[3]) / 100
      };
    } catch (error) {
      console.error('Error getting battle result:', error);
      throw error;
    }
  }

  // Get total battle count
  async getBattleCount(): Promise<number> {
    try {
      const count = await this.contract.getBattleCount();
      return Number(count);
    } catch (error) {
      console.error('Error getting battle count:', error);
      throw error;
    }
  }

  // Get wallet address
  getWalletAddress(): string {
    return this.wallet.address;
  }

  // Convert 3D position to contract coordinates
  positionToContract(position: [number, number, number]): { x: number, z: number } {
    return {
      x: Math.floor(position[0] * 100), // Scale and convert to integer
      z: Math.floor(position[2] * 100)  // Use Z coordinate for depth
    };
  }

  // Convert contract coordinates back to 3D position
  contractToPosition(x: number, z: number, y: number = 0): [number, number, number] {
    return [x / 100, y, z / 100];
  }
}

// Export singleton instance
export const contractService = new ContractService();
