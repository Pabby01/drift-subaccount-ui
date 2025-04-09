// store/useStore.ts
import { create } from 'zustand';
import { Connection, PublicKey } from '@solana/web3.js';
import { 
  DriftClient, 
  initialize, 
  UserAccount, 
  UserStatsAccount, 
  PerpPosition, 
  OrderRecord
} from '@drift-labs/sdk';

interface SubaccountData {
  userAccountPublicKey: PublicKey;
  userAccount: UserAccount | null;
  balance: number;
  perpPositions: PerpPosition[];
  openOrders: OrderRecord[];
}

interface DriftStore {
  driftClient: DriftClient | null;
  userStatsAccount: UserStatsAccount | null;
  subaccounts: SubaccountData[];
  selectedSubaccountIndex: number;
  isLoading: boolean;
  error: string | null;
  
  // Actions
  initializeDriftClient: (wallet: any, connection: Connection) => Promise<void>;
  fetchSubaccounts: (walletPubkey: PublicKey) => Promise<void>;
  setSelectedSubaccountIndex: (index: number) => void;
  
  // Orders and Transactions
  placeMarketOrder: (
    marketIndex: number, 
    direction: 'long' | 'short', 
    amount: number
  ) => Promise<void>;
  placeLimitOrder: (
    marketIndex: number, 
    direction: 'long' | 'short', 
    amount: number, 
    price: number
  ) => Promise<void>;
  deposit: (
    tokenIndex: number, 
    amount: number
  ) => Promise<void>;
  withdraw: (
    tokenIndex: number, 
    amount: number
  ) => Promise<void>;
}

const useStore = create<DriftStore>((set, get) => ({
  driftClient: null,
  userStatsAccount: null,
  subaccounts: [],
  selectedSubaccountIndex: 0,
  isLoading: false,
  error: null,
  
  initializeDriftClient: async (wallet, connection) => {
    try {
      set({ isLoading: true, error: null });
      
      // Initialize the Drift client
      const driftClient = await initialize({
        wallet,
        connection,
        env: 'devnet', // Change to 'mainnet-beta' for production
      });
      
      set({ driftClient });
      
      // After initializing, fetch the subaccounts
      if (wallet.publicKey) {
        await get().fetchSubaccounts(wallet.publicKey);
      }
      
    } catch (err) {
      set({ error: (err as Error).message });
    } finally {
      set({ isLoading: false });
    }
  },
  
  fetchSubaccounts: async (walletPubkey) => {
    const { driftClient } = get();
    if (!driftClient) {
      set({ error: 'Drift client not initialized' });
      return;
    }
    
    try {
      set({ isLoading: true, error: null });
      
      // Fetch user stats account
      const userStatsAccount = await driftClient.getUserStats(walletPubkey);
      set({ userStatsAccount });
      
      // Fetch all subaccounts (User accounts)
      const subaccountsData: SubaccountData[] = [];
      
      // We can have up to 8 subaccounts
      for (let i = 0; i < 8; i++) {
        try {
          const userAccountPublicKey = driftClient.getUserAccountPublicKey(walletPubkey, i);
          const userAccount = await driftClient.getUserAccount(userAccountPublicKey);
          
          if (userAccount) {
            // Get balance
            const balance = userAccount.getQuoteAssetTokenAmount().toNumber();
            
            // Get perp positions
            const perpPositions = userAccount.getPerpPositions();
            
            // Get open orders
            const openOrders = userAccount.getOpenOrders();
            
            subaccountsData.push({
              userAccountPublicKey,
              userAccount,
              balance,
              perpPositions,
              openOrders,
            });
          }
        } catch (err) {
          // Skip errors - this subaccount may not exist
          console.error(`Error fetching subaccount ${i}:`, err);
        }
      }
      
      set({ subaccounts: subaccountsData });
      
    } catch (err) {
      set({ error: (err as Error).message });
    } finally {
      set({ isLoading: false });
    }
  },
  
  setSelectedSubaccountIndex: (index) => {
    set({ selectedSubaccountIndex: index });
  },
  
  placeMarketOrder: async (marketIndex, direction, amount) => {
    const { driftClient, selectedSubaccountIndex } = get();
    if (!driftClient) {
      set({ error: 'Drift client not initialized' });
      return;
    }
    
    try {
      set({ isLoading: true, error: null });
      
      await driftClient.placePerpOrder({
        marketIndex,
        orderType: 'market',
        direction: direction === 'long' ? 'long' : 'short',
        baseAssetAmount: amount,
        subaccountIndex: selectedSubaccountIndex,
      });
      
      // Refresh subaccounts after order
      if (driftClient.wallet.publicKey) {
        await get().fetchSubaccounts(driftClient.wallet.publicKey);
      }
      
    } catch (err) {
      set({ error: (err as Error).message });
    } finally {
      set({ isLoading: false });
    }
  },
  
  placeLimitOrder: async (marketIndex, direction, amount, price) => {
    const { driftClient, selectedSubaccountIndex } = get();
    if (!driftClient) {
      set({ error: 'Drift client not initialized' });
      return;
    }
    
    try {
      set({ isLoading: true, error: null });
      
      await driftClient.placePerpOrder({
        marketIndex,
        orderType: 'limit',
        direction: direction === 'long' ? 'long' : 'short',
        baseAssetAmount: amount,
        price,
        subaccountIndex: selectedSubaccountIndex,
      });
      
      // Refresh subaccounts after order
      if (driftClient.wallet.publicKey) {
        await get().fetchSubaccounts(driftClient.wallet.publicKey);
      }
      
    } catch (err) {
      set({ error: (err as Error).message });
    } finally {
      set({ isLoading: false });
    }
  },
  
  deposit: async (tokenIndex, amount) => {
    const { driftClient, selectedSubaccountIndex } = get();
    if (!driftClient) {
      set({ error: 'Drift client not initialized' });
      return;
    }
    
    try {
      set({ isLoading: true, error: null });
      
      await driftClient.deposit({
        tokenIndex,
        amount,
        subaccountIndex: selectedSubaccountIndex,
      });
      
      // Refresh subaccounts after deposit
      if (driftClient.wallet.publicKey) {
        await get().fetchSubaccounts(driftClient.wallet.publicKey);
      }
      
    } catch (err) {
      set({ error: (err as Error).message });
    } finally {
      set({ isLoading: false });
    }
  },
  
  withdraw: async (tokenIndex, amount) => {
    const { driftClient, selectedSubaccountIndex } = get();
    if (!driftClient) {
      set({ error: 'Drift client not initialized' });
      return;
    }
    
    try {
      set({ isLoading: true, error: null });
      
      await driftClient.withdraw({
        tokenIndex,
        amount,
        subaccountIndex: selectedSubaccountIndex,
      });
      
      // Refresh subaccounts after withdrawal
      if (driftClient.wallet.publicKey) {
        await get().fetchSubaccounts(driftClient.wallet.publicKey);
      }
      
    } catch (err) {
      set({ error: (err as Error).message });
    } finally {
      set({ isLoading: false });
    }
  },
}));

export default useStore;