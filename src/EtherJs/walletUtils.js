import { ethers } from 'ethers';
import { 
  ARBITRUM_CHAIN_ID, 
  ARBITRUM_RPC_URL, 
  MAIN_LOGIC_CONTRACT_ADDRESS,
  IslandLogicABI,
  IslandLogicBytecode 
} from './constants';
import { useStoreContract } from './useStoreContract';

export const handleWalletConnectAndDeployIslandContract = async () => {
  try {
    // Check if MetaMask is installed
    if (!window.ethereum) {
      throw new Error('MetaMask is not installed. Please install MetaMask to continue.');
    }

    // Request account access
    console.log('Connecting to wallet...');
    await window.ethereum.request({ method: 'eth_requestAccounts' });

    // Create provider and signer
    const provider = new ethers.BrowserProvider(window.ethereum);
    const signer = await provider.getSigner();
    
    // Get current network
    const network = await provider.getNetwork();
    const currentChainId = '0x' + network.chainId.toString(16);

    // Check if we're on Arbitrum Sepolia
    if (currentChainId !== ARBITRUM_CHAIN_ID) {
      console.log('Switching to Arbitrum Sepolia network...');
      
      try {
        // Try to switch to Arbitrum Sepolia
        await window.ethereum.request({
          method: 'wallet_switchEthereumChain',
          params: [{ chainId: ARBITRUM_CHAIN_ID }],
        });
        
        // Recreate provider and signer after network switch
        const newProvider = new ethers.BrowserProvider(window.ethereum);
        const newSigner = await newProvider.getSigner();
        return await deployContract(newSigner, newProvider);
      } catch (switchError) {
        // If the network doesn't exist, add it
        if (switchError.code === 4902) {
          console.log('Adding Arbitrum Sepolia network...');
          await window.ethereum.request({
            method: 'wallet_addEthereumChain',
            params: [{
              chainId: ARBITRUM_CHAIN_ID,
              chainName: 'Arbitrum Sepolia',
              nativeCurrency: {
                name: 'ETH',
                symbol: 'ETH',
                decimals: 18,
              },
              rpcUrls: [ARBITRUM_RPC_URL],
              blockExplorerUrls: ['https://sepolia.arbiscan.io/'],
            }],
          });
          
          // Recreate provider and signer after adding network
          const newProvider = new ethers.BrowserProvider(window.ethereum);
          const newSigner = await newProvider.getSigner();
          return await deployContract(newSigner, newProvider);
        } else {
          throw switchError;
        }
      }
    }

    return await deployContract(signer, provider);

  } catch (error) {
    console.error('Error in wallet connection or contract deployment:', error);
    
    // Handle specific errors
    let errorMessage = 'An unexpected error occurred';
    
    if (error?.code === 4001) {
      errorMessage = 'User rejected the wallet connection request';
    } else if (error?.code === -32002) {
      errorMessage = 'Wallet connection request is already pending. Please check your wallet.';
    } else if (error?.message?.includes('unsupported addressable value') || error?.message?.includes('INVALID_ARGUMENT')) {
      errorMessage = 'Invalid contract address configuration. Please check the MAIN_LOGIC_CONTRACT_ADDRESS in constants.js';
    } else if (error?.message?.includes('Invalid MAIN_LOGIC_CONTRACT_ADDRESS')) {
      errorMessage = error.message;
    } else if (error?.message?.includes('insufficient funds')) {
      errorMessage = 'Insufficient funds for gas fees. Please add more ETH to your wallet.';
    } else if (error?.message?.includes('gas') || error?.code === -32603) {
      errorMessage = 'Transaction failed due to gas issues. This could be network congestion. Please try again with more gas.';
    } else if (error?.message?.includes('nonce')) {
      errorMessage = 'Transaction nonce error. Please try again.';
    } else if (error?.message?.includes('replacement')) {
      errorMessage = 'Transaction replacement error. Please wait a moment and try again.';
    } else if (error?.message?.includes('network')) {
      errorMessage = 'Network connection error. Please check your internet connection and try again.';
    } else if (error?.message) {
      errorMessage = error.message;
    }

    return {
      success: false,
      error: errorMessage,
      originalError: error,
    };
  }
};

async function deployContract(signer, provider) {
  // Get wallet address
  const walletAddress = await signer.getAddress();
  console.log('Connected wallet:', walletAddress);

  // Check wallet balance
  const balance = await provider.getBalance(walletAddress);
  const balanceInEth = ethers.formatEther(balance);
  console.log('Wallet balance:', balanceInEth, 'ETH');

  if (parseFloat(balanceInEth) < 0.001) {
    console.warn('Low balance detected. Make sure you have enough ETH for gas fees.');
  }

  // Validate constructor arguments
  console.log('MAIN_LOGIC_CONTRACT_ADDRESS:', MAIN_LOGIC_CONTRACT_ADDRESS);
  
  if (!MAIN_LOGIC_CONTRACT_ADDRESS || MAIN_LOGIC_CONTRACT_ADDRESS === "0x" || MAIN_LOGIC_CONTRACT_ADDRESS.length !== 42) {
    throw new Error('Invalid MAIN_LOGIC_CONTRACT_ADDRESS. Please check your constants.js file.');
  }

  if (!ethers.isAddress(MAIN_LOGIC_CONTRACT_ADDRESS)) {
    throw new Error('MAIN_LOGIC_CONTRACT_ADDRESS is not a valid Ethereum address.');
  }

  if (!ethers.isAddress(walletAddress)) {
    throw new Error('Invalid wallet address received from signer.');
  }

  // Constructor arguments: owner (wallet address), centralContract (MAIN_LOGIC_CONTRACT_ADDRESS)
  const constructorArgs = [walletAddress, MAIN_LOGIC_CONTRACT_ADDRESS];

  // Clean bytecode (remove 0x prefix if present and ensure it's properly formatted)
  let cleanBytecode = IslandLogicBytecode;
  if (cleanBytecode.startsWith('0x')) {
    cleanBytecode = cleanBytecode.slice(2);
  }
  cleanBytecode = '0x' + cleanBytecode;

  console.log('Constructor args:', constructorArgs);
  console.log('Bytecode length:', cleanBytecode.length);

  // Create contract factory
  console.log('Creating contract factory...');
  const contractFactory = new ethers.ContractFactory(
    IslandLogicABI,
    cleanBytecode,
    signer
  );

  // Get current gas price from network
  const feeData = await provider.getFeeData();
  console.log('Network fee data:', feeData);

  // Estimate gas limit for deployment
  let gasLimit;
  try {
    gasLimit = await contractFactory.getDeployTransaction(...constructorArgs).then(tx => 
      provider.estimateGas(tx)
    );
    // Add 20% buffer to estimated gas
    gasLimit = gasLimit + (gasLimit * 20n / 100n);
    console.log('Estimated gas limit:', gasLimit.toString());
  } catch (estimateError) {
    console.warn('Gas estimation failed, using fixed gas limit:', estimateError);
    // Use a higher fixed gas limit for Arbitrum Sepolia
    gasLimit = BigInt(5000000); // 5M gas limit
  }

  // Prepare gas configuration for Arbitrum Sepolia
  const gasConfig = {
    gasLimit: gasLimit,
  };

  // Use EIP-1559 gas pricing if available
  if (feeData.maxFeePerGas && feeData.maxPriorityFeePerGas) {
    gasConfig.maxFeePerGas = feeData.maxFeePerGas * 2n; // Double the suggested fee for reliability
    gasConfig.maxPriorityFeePerGas = feeData.maxPriorityFeePerGas * 2n;
    console.log('Using EIP-1559 pricing:', gasConfig);
  } else if (feeData.gasPrice) {
    gasConfig.gasPrice = feeData.gasPrice * 2n; // Double the gas price for reliability
    console.log('Using legacy gas pricing:', gasConfig);
  } else {
    // Fallback gas prices for Arbitrum Sepolia
    gasConfig.maxFeePerGas = ethers.parseUnits('0.1', 'gwei'); // 0.1 gwei
    gasConfig.maxPriorityFeePerGas = ethers.parseUnits('0.01', 'gwei'); // 0.01 gwei
    console.log('Using fallback gas pricing:', gasConfig);
  }

  // Deploy the contract
  console.log('Deploying Island contract...');
  const deployTransaction = await contractFactory.deploy(...constructorArgs, gasConfig);

  console.log('Deployment transaction sent:', deployTransaction.deploymentTransaction().hash);
  console.log('Waiting for deployment to be mined...');

  // Wait for deployment to be mined with timeout
  const deployedContract = await deployTransaction.waitForDeployment();
  const contractAddress = await deployedContract.getAddress();

  console.log('Island contract deployed successfully!');
  console.log('Contract address:', contractAddress);
  console.log('Transaction hash:', deployTransaction.deploymentTransaction().hash);

  // Verify the contract was deployed correctly
  const code = await provider.getCode(contractAddress);
  if (code === '0x') {
    throw new Error('Contract deployment failed - no code at deployed address');
  }

  // Store contract, signer, and addresses in Zustand store for later use
  const { setContract, setSigner, setContractAddress, setWalletAddress } = useStoreContract.getState();
  setContract(deployedContract);
  setSigner(signer);
  setContractAddress(contractAddress);
  setWalletAddress(walletAddress);

  console.log('Contract and signer stored in Zustand store');

  return {
    success: true,
    contractAddress,
    transactionHash: deployTransaction.deploymentTransaction().hash,
    walletAddress,
    contract: deployedContract,
  };
}

// Usage example:
/*
import { handleWalletConnectAndDeployIslandContract } from './walletUtils';
import { useStoreContract } from './useStoreContract';

const deployIsland = async () => {
  const result = await handleWalletConnectAndDeployIslandContract();

  if (result.success) {
    console.log('Deployment successful:', result);
    // Handle successful deployment
    // result.contractAddress contains the deployed contract address
    // result.contract is the ethers contract instance for interactions
    
    // After deployment, you can access contract and signer from the store
    const { contract, signer } = useStoreContract.getState();
    
    if (contract && signer) {
      // Now you can call contract functions
      // const tx = await contract.anyFunction(args);
      // await tx.wait();
    }
  } else {
    console.error('Deployment failed:', result.error);
    // Handle error
  }
};
*/