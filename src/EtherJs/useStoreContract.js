import { create } from 'zustand';

export const useStoreContract = create((set) => ({
  // State variables
  contract: null,
  signer: null,
  contractAddress: null,
  walletAddress: null,
  isConnected: false,
  isLoading: false,
  error: null,

  // Setter functions
  setContract: (contract) => set({ contract }),
  setSigner: (signer) => set({ signer }),
  setContractAddress: (contractAddress) => set({ contractAddress }),
  setWalletAddress: (walletAddress) => set({ walletAddress }),
  setConnected: (isConnected) => set({ isConnected }),
  setLoading: (isLoading) => set({ isLoading }),
  setError: (error) => set({ error }),
}));