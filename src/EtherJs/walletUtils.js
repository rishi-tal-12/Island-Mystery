import { ethers } from "ethers";
import {
  ARBITRUM_CHAIN_ID,
  ARBITRUM_RPC_URL,
  MAIN_LOGIC_CONTRACT_ADDRESS,
  MainLogicABI,
  IslandLogicABI,
  IslandLogicBytecode,
} from "./constants.js";
import { useStoreContract } from "./useStoreContract.js";

export const handleWalletConnectAndDeployIslandContract = async () => {
  try {
    // Check if MetaMask is installed
    if (!window.ethereum) {
      throw new Error(
        "MetaMask is not installed. Please install MetaMask to continue."
      );
    }

    // Request account access
    console.log("Connecting to wallet...");
    const accounts = await window.ethereum.request({
      method: "eth_requestAccounts",
    });

    if (!accounts || accounts.length === 0) {
      throw new Error("No accounts found. Please unlock your wallet.");
    }

    // Create provider and signer
    const provider = new ethers.BrowserProvider(window.ethereum);
    const signer = await provider.getSigner();

    // Get current network
    const network = await provider.getNetwork();
    const currentChainId = "0x" + network.chainId.toString(16);

    // Check if we're on Arbitrum Sepolia
    if (currentChainId !== ARBITRUM_CHAIN_ID) {
      console.log("Switching to Arbitrum Sepolia network...");

      try {
        // Try to switch to Arbitrum Sepolia
        await window.ethereum.request({
          method: "wallet_switchEthereumChain",
          params: [{ chainId: ARBITRUM_CHAIN_ID }],
        });
      } catch (switchError) {
        // If the network doesn't exist, add it
        if (switchError.code === 4902) {
          console.log("Adding Arbitrum Sepolia network...");
          await window.ethereum.request({
            method: "wallet_addEthereumChain",
            params: [
              {
                chainId: ARBITRUM_CHAIN_ID,
                chainName: "Arbitrum Sepolia",
                nativeCurrency: {
                  name: "ETH",
                  symbol: "ETH",
                  decimals: 18,
                },
                rpcUrls: [ARBITRUM_RPC_URL],
                blockExplorerUrls: ["https://sepolia.arbiscan.io/"],
              },
            ],
          });
        } else {
          throw switchError;
        }
      }

      // Wait for network switch to complete
      console.log("Waiting for network switch to complete...");
      await new Promise((resolve) => setTimeout(resolve, 1500));

      // Verify network switch was successful
      const newProvider = new ethers.BrowserProvider(window.ethereum);
      const newNetwork = await newProvider.getNetwork();
      const newChainId = "0x" + newNetwork.chainId.toString(16);

      if (newChainId !== ARBITRUM_CHAIN_ID) {
        throw new Error("Failed to switch to Arbitrum Sepolia network");
      }

      const newSigner = await newProvider.getSigner();
      return await deployContract(newSigner, newProvider);
    }

    return await deployContract(signer, provider);
  } catch (error) {
    console.error("Error in wallet connection or contract deployment:", error);

    let errorMessage = "An unexpected error occurred";

    if (error?.code === 4001) {
      errorMessage = "User rejected the wallet connection request";
    } else if (error?.code === 4902) {
      errorMessage =
        "Unable to add Arbitrum Sepolia network. Please add it manually.";
    } else if (error?.message?.includes("insufficient funds")) {
      errorMessage =
        "Insufficient funds for gas fees. Please add more ETH to your wallet.";
    } else if (error?.message?.includes("gas")) {
      errorMessage =
        "Transaction failed due to gas estimation issues. Please try again.";
    } else if (error?.message?.includes("user rejected")) {
      errorMessage = "Transaction was rejected by user";
    } else if (error?.message) {
      errorMessage = error.message;
    }

    return {
      success: false,
      error: errorMessage,
      details: error,
    };
  }
};

async function deployContract(signer, provider) {
  try {
    // Get wallet address and validate
    const walletAddress = await signer.getAddress();
    console.log("Connected wallet:", walletAddress);

    if (!walletAddress || !ethers.isAddress(walletAddress)) {
      throw new Error("Invalid wallet address obtained from signer");
    }

    // Validate main logic contract address
    if (
      !MAIN_LOGIC_CONTRACT_ADDRESS ||
      !ethers.isAddress(MAIN_LOGIC_CONTRACT_ADDRESS)
    ) {
      throw new Error("Invalid MAIN_LOGIC_CONTRACT_ADDRESS in constants.js");
    }

    // Validate and clean bytecode
    if (!IslandLogicBytecode || typeof IslandLogicBytecode !== "string") {
      throw new Error("Invalid or missing IslandLogicBytecode in constants.js");
    }

    let cleanBytecode = IslandLogicBytecode.trim();

    // Remove whitespace and newlines but preserve hex structure
    cleanBytecode = cleanBytecode.replace(/\s+/g, "");

    // Ensure proper hex format
    if (!cleanBytecode.startsWith("0x")) {
      cleanBytecode = "0x" + cleanBytecode;
    }

    // Validate hex format
    if (!/^0x[0-9a-fA-F]+$/.test(cleanBytecode)) {
      throw new Error("Invalid bytecode format - contains non-hex characters");
    }

    if (cleanBytecode.length < 10) {
      throw new Error("Bytecode appears to be too short");
    }

    // Validate ABI
    if (!IslandLogicABI || !Array.isArray(IslandLogicABI)) {
      throw new Error("Invalid or missing IslandLogicABI in constants.js");
    }

    // Constructor arguments: owner (wallet address), centralContract (MAIN_LOGIC_CONTRACT_ADDRESS)
    const constructorArgs = [walletAddress, MAIN_LOGIC_CONTRACT_ADDRESS];

    console.log("Constructor args:", constructorArgs);
    console.log("Bytecode length:", cleanBytecode.length);
    console.log("ABI functions count:", IslandLogicABI.length);

    // Check wallet balance
    const balance = await provider.getBalance(walletAddress);
    console.log("Wallet balance:", ethers.formatEther(balance), "ETH");

    if (balance === 0n) {
      throw new Error("Wallet has no ETH for gas fees");
    }

    // Create contract factory
    console.log("Creating contract factory...");
    const contractFactory = new ethers.ContractFactory(
      IslandLogicABI,
      cleanBytecode,
      signer
    );

    // Deploy the contract with gas estimation
    console.log("Deploying Island contract...");
    let deployedContract;

    try {
      // First try with automatic gas estimation
      console.log("Attempting deployment with automatic gas estimation...");
      deployedContract = await contractFactory.deploy(...constructorArgs);
      console.log("deplloyed contract", deployedContract);
    } catch (gasError) {
      console.log("Gas estimation failed, trying with manual gas limit...");

      // If gas estimation fails, try with manual gas limit
      if (
        gasError.code === "UNPREDICTABLE_GAS_LIMIT" ||
        gasError.message?.includes("gas")
      ) {
        try {
          deployedContract = await contractFactory.deploy(...constructorArgs, {
            gasLimit: 3000000, // 3M gas limit for Arbitrum Sepolia
            gasPrice: await provider.getFeeData().then((fees) => fees.gasPrice),
          });
        } catch (manualGasError) {
          // Try with higher gas limit
          console.log("Trying with higher gas limit...");
          deployedContract = await contractFactory.deploy(...constructorArgs, {
            gasLimit: 5000000, // 5M gas limit as last resort
          });
        }
      } else {
        throw gasError;
      }
    }

    const deploymentTx = deployedContract.deploymentTransaction();
    console.log("Deployment transaction sent:", deploymentTx.hash);
    console.log("Waiting for deployment to be mined...");

    // Wait for deployment to be mined with timeout
    const deploymentReceipt = await Promise.race([
      deployedContract.waitForDeployment(),
      new Promise((_, reject) =>
        setTimeout(
          () => reject(new Error("Deployment timeout after 5 minutes")),
          300000
        )
      ),
    ]);

    const contractAddress = await deployedContract.getAddress();
    console.log("Island contract deployed successfully!");
    console.log("Contract address:", contractAddress);

    // Verify deployment by checking if contract exists
    const code = await provider.getCode(contractAddress);
    if (code === "0x") {
      throw new Error(
        "Contract deployment failed - no code at contract address"
      );
    }

    // ---- Register the island on MainLogic ----
    console.log("Registering new island on MainLogic...");
    const mainContract = new ethers.Contract(
      MAIN_LOGIC_CONTRACT_ADDRESS,
      MainLogicABI,
      signer
    );

    let registerTx;
    try {
      registerTx = await mainContract.registerNewIsland(contractAddress);
      console.log("Register tx sent:", registerTx.hash);

      const registerReceipt = await registerTx.wait();
      console.log(
        `Island registered successfully in block ${registerReceipt.blockNumber}`
      );
    } catch (err) {
      console.error("Failed to register island on MainLogic:", err);
      throw new Error("Island deployment succeeded but registration failed.");
    }

    // Store contract, signer, and addresses in Zustand store for later use
    // Store contract, signer, and addresses in Zustand store for later use
    try {
      const {
        setContract,
        setSigner,
        setContractAddress,
        setWalletAddress,
        setMainContract,
      } = useStoreContract.getState();

      // Store deployed Island contract
      setContract(deployedContract);
      setSigner(signer);
      setContractAddress(contractAddress);
      setWalletAddress(walletAddress);

      // Create instance of already deployed Main Logic contract
      const mainContractInstance = new ethers.Contract(
        MAIN_LOGIC_CONTRACT_ADDRESS,
        MainLogicABI, // ABI for Main Logic contract
        signer
      );

      console.log("Main contract instance:", mainContractInstance);
      console.log("contract instance:", deployedContract);

      setMainContract(mainContractInstance);

      console.log("Contract, mainContract, and signer stored in Zustand store");
    } catch (storeError) {
      console.warn("Failed to store in Zustand store:", storeError);
    }

    return {
      success: true,
      contractAddress,
      transactionHash: deploymentTx.hash,
      walletAddress,
      contract: deployedContract,
      blockNumber: deploymentReceipt?.blockNumber || "unknown",
      gasUsed: deploymentReceipt?.gasUsed?.toString() || "unknown",
    };
  } catch (error) {
    console.error("Error in contract deployment:", error);

    // Provide more specific error messages
    let errorMessage = "Contract deployment failed";

    if (error?.message?.includes("insufficient funds")) {
      errorMessage =
        "Insufficient funds for gas fees. Please add more ETH to your wallet.";
    } else if (error?.message?.includes("gas")) {
      errorMessage =
        "Gas estimation or execution failed. The contract might be too complex or have errors.";
    } else if (error?.message?.includes("revert")) {
      errorMessage =
        "Contract deployment was reverted. Check constructor parameters and contract code.";
    } else if (error?.message?.includes("timeout")) {
      errorMessage =
        "Deployment timed out. The transaction might still be pending on the network.";
    } else if (
      error?.message?.includes("bytecode") ||
      error?.message?.includes("Invalid")
    ) {
      errorMessage = error.message; // Use the specific validation error
    } else if (error?.message) {
      errorMessage = `Deployment failed: ${error.message}`;
    }

    throw new Error(errorMessage);
  }
}
