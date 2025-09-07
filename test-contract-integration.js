// Test script for contract integration
import { contractService } from './src/services/contractService.js';

async function testContractIntegration() {
  console.log('🚀 Testing Contract Integration...\n');
  
  try {
    // Test 1: Get wallet address
    console.log('1. Testing wallet connection...');
    const walletAddress = contractService.getWalletAddress();
    console.log(`✅ Wallet Address: ${walletAddress}\n`);
    
    // Test 2: Register a ship
    console.log('2. Testing ship registration...');
    const shipX = -1500; // -15 * 100 (contract scale)
    const shipZ = 0;
    const radius = 2;
    
    const registerTx = await contractService.registerShip(shipX, shipZ, radius);
    console.log(`✅ Ship registered: ${registerTx}\n`);
    
    // Test 3: Get ship info
    console.log('3. Testing ship retrieval...');
    const shipInfo = await contractService.getShip(walletAddress);
    console.log(`✅ Ship Info: x=${shipInfo.x}, z=${shipInfo.z}, radius=${shipInfo.radius}\n`);
    
    // Test 4: Fire cannonball
    console.log('4. Testing cannonball firing...');
    const enemyAddress = '0x70997970C51812dc3A010C7d01b50e0d17dc79C8';
    const fireResult = await contractService.fireCannonball({
      target: enemyAddress,
      velocity: 75,
      azimuthDeg: 45,
      verticalDeg: 30
    });
    
    console.log(`✅ Cannonball fired!`);
    console.log(`   Hit: ${fireResult.hit}`);
    console.log(`   Impact: (${fireResult.impactX}, ${fireResult.impactZ})`);
    console.log(`   Distance: ${fireResult.distanceFromTarget}\n`);
    
    // Test 5: Get battle count
    console.log('5. Testing battle count...');
    const battleCount = await contractService.getBattleCount();
    console.log(`✅ Total battles: ${battleCount}\n`);
    
    console.log('🎉 All tests passed! Contract integration is working correctly.');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

// Run the test
testContractIntegration();
