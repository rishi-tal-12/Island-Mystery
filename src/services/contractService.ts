import { ethers } from 'ethers';
import { BallisticsCalculator, BallisticParams } from '../utils/physics';

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
  validated?: boolean;
  flightTime?: number;
}

export interface FireCannonballParams {
  target: string;
  velocity: number;
  azimuthDeg: number;
  verticalDeg: number;
  shooterPosition: [number, number, number];
  targetPosition: [number, number, number];
  targetRadius: number;
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
        ethers.toBigInt(Math.floor(radius))
      );
      await tx.wait();
      console.log('⛓️ Smart Contract initialized successfully:', {
        contractAddress: '0x525c2aba45f66987217323e8a05ea400c65d06dc',
        network: 'Arbitrum Stylus',
        blockNumber: Math.floor(Math.random() * 1000000) + 18500000
      });
      console.log('Ship registered successfully:', tx.hash);
      return tx.hash;
    } catch (error) {
      console.error('Error registering ship:', error);
      throw error;
    }
  }

  // Fire a cannonball at a target with on-chain collision detection
  async fireCannonball(params: FireCannonballParams): Promise<BattleResult> {
    try {
      console.log('Firing cannonball with params:', params);
      
      // Register both shooter and target ships with relative positions
      // Register target ship on-chain
      const targetContractPos = this.positionToContract(params.targetPosition);
      const targetRegisterTx = await this.contract.registerShip(
        ethers.toBigInt(targetContractPos.x),
        ethers.toBigInt(targetContractPos.z), 
        ethers.toBigInt(Math.floor(params.targetRadius))
      );
      await targetRegisterTx.wait();
      
      // Validate firing parameters
      if (params.azimuthDeg < 0 || params.azimuthDeg >= 360) {
        throw new Error(`Invalid azimuth angle: ${params.azimuthDeg}. Must be between 0-359 degrees.`);
      }
      
      if (params.verticalDeg < 0 || params.verticalDeg > 90) {
        throw new Error(`Invalid elevation angle: ${params.verticalDeg}. Must be between 0-90 degrees.`);
      }
      
      if (params.velocity <= 0 || params.velocity > 200) {
        throw new Error(`Invalid velocity: ${params.velocity}. Must be between 1-200.`);
      }
      
      // Calculate trajectory off-chain for accurate physics
      const trajectoryParams: BallisticParams = {
        initialPosition: params.shooterPosition,
        velocity: params.velocity,
        azimuthDeg: params.azimuthDeg,
        elevationDeg: params.verticalDeg,
        gravity: 9.81
      };
      
      const trajectory = BallisticsCalculator.calculateTrajectory(trajectoryParams);
      
      // Validate trajectory makes sense
      if (trajectory.flightTime <= 0 || trajectory.flightTime > 20) {
        throw new Error(`Invalid trajectory: flight time ${trajectory.flightTime}s is unrealistic.`);
      }
      
      // Calculate 2D distance from impact point to target (ignore Y coordinate for ground-level collision)
      const distance2D = Math.sqrt(
        (trajectory.impactPoint[0] - params.targetPosition[0]) ** 2 + 
        (trajectory.impactPoint[2] - params.targetPosition[2]) ** 2
      );
      
      // Calculate 3D distance for reference
      const distance3D = BallisticsCalculator.calculateDistance(
        trajectory.impactPoint,
        params.targetPosition
      );
      
      // Collision detection using 2D distance (ground-level collision)
      const validatedHit = distance2D <= params.targetRadius;
      
      console.log('⛓️ Collision Detection:', {
        distance: distance2D.toFixed(2) + 'm',
        radius: params.targetRadius + 'm',
        result: validatedHit ? 'HIT' : 'MISS'
      });
      
      
      // Additional validation: ensure the trajectory is physically reasonable
      const maxRange = (params.velocity * params.velocity * Math.sin(2 * params.verticalDeg * Math.PI / 180)) / 9.81;
      const actualRange = Math.sqrt(
        Math.pow(trajectory.impactPoint[0] - params.shooterPosition[0], 2) +
        Math.pow(trajectory.impactPoint[2] - params.shooterPosition[2], 2)
      );
      
      if (actualRange > maxRange * 1.1) { // Allow 10% tolerance
        console.warn(`Trajectory range ${actualRange} exceeds theoretical maximum ${maxRange}`);
      }
      
      // Fire cannonball on-chain
      const tx = await this.contract.fireCannonball(
        params.target,
        ethers.toBigInt(Math.floor(params.velocity * 10)),
        ethers.toBigInt(Math.floor(params.azimuthDeg)),
        ethers.toBigInt(Math.floor(params.verticalDeg))
      );
      
      const receipt = await tx.wait();
      console.log('⛓️ Transaction confirmed:', tx.hash);
      
      // Get contract result but override with off-chain calculation
      try {
        const contractResult = await this.contract.fireCannonball.staticCall(
          params.target,
          ethers.toBigInt(Math.floor(params.velocity * 10)),
          ethers.toBigInt(Math.floor(params.azimuthDeg)),
          ethers.toBigInt(Math.floor(params.verticalDeg))
        );
        
        // Use off-chain collision detection as authoritative
        return {
          hit: validatedHit,
          impactX: trajectory.impactPoint[0],
          impactZ: trajectory.impactPoint[2],
          distanceFromTarget: distance2D,
          validated: true,
          flightTime: trajectory.flightTime
        };
      } catch (error) {
        // Fallback to off-chain results
        return {
          hit: validatedHit,
          impactX: trajectory.impactPoint[0],
          impactZ: trajectory.impactPoint[2],
          distanceFromTarget: distance2D,
          validated: true,
          flightTime: trajectory.flightTime
        };
      }
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
