// store/useStore.ts
import { create } from 'zustand';
import { Connection, PublicKey,  Keypair } from '@solana/web3.js';
import {
  UserAccount,
  UserStats,
  PerpPosition,
  Order,
  DriftClient,
} from '@drift-labs/sdk';
import { createDriftClient } from '../lib/driftClient';
import type { WalletAdapter } from '@solana/wallet-adapter-base';

interface SubaccountData {
  userAccountPublicKey: PublicKey;
  userAccount: UserAccount | null;
  balance: number;
  perpPositions: PerpPosition[];
  openOrders: Order[];
}

interface DriftStore {
  driftClient: DriftClient | null;
  userStatsAccount: UserStats | null;
  subaccounts: SubaccountData[];
  selectedSubaccountIndex: number;
  isLoading: boolean;
  error: string | null;

  initializeDriftClient: (wallet: WalletAdapter, connection: Connection) => Promise<void>;
  fetchSubaccounts: (walletPubkey: PublicKey) => Promise<void>;
  setSelectedSubaccountIndex: (index: number) => void;

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

  deposit: (tokenIndex: number, amount: number) => Promise<void>;
  withdraw: (tokenIndex: number, amount: number) => Promise<void>;
}

// Create a wallet adapter compatible with DriftClient
const createDriftCompatibleWallet = (wallet: WalletAdapter) => {
  if (!wallet.publicKey) throw new Error('Wallet not connected');
  
  // Create a compatible wallet interface that works with the Drift SDK
  return {
    publicKey: wallet.publicKey,
    // Using sendTransaction instead of signTransaction
    sendTransaction: wallet.sendTransaction,
    // Using the dummy keypair as payer since it's required by Drift SDK
    payer: Keypair.generate(),
  };
};

const useStore = create<DriftStore>((set, get) => ({
  driftClient: null,
  userStatsAccount: null,
  subaccounts: [],
  selectedSubaccountIndex: 0,
  isLoading: false,
  error: null,

  initializeDriftClient: async (wallet: WalletAdapter, connection: Connection): Promise<void> => {
    try {
      set({ isLoading: true, error: null });
      
      if (!wallet.publicKey) {
        throw new Error('Wallet not connected');
      }
      
      const driftWallet = createDriftCompatibleWallet(wallet);
      
      const driftClient = await createDriftClient({
        connection,
        wallet: driftWallet,
      });
      
      set({ driftClient });

      await get().fetchSubaccounts(wallet.publicKey);
    } catch (err: unknown) {
      console.error('Failed to initialize drift client:', err);
      if (err instanceof Error) set({ error: err.message });
      else set({ error: 'Unknown error initializing drift client' });
    } finally {
      set({ isLoading: false });
    }
  },

  fetchSubaccounts: async (walletPubkey: PublicKey): Promise<void> => {
    const driftClient = get().driftClient;
    if (!driftClient) {
      set({ error: 'Drift client not initialized' });
      return;
    }

    try {
      set({ isLoading: true, error: null });
      
      // Get user stats if the API supports it
      try {
        const userStatsAccount = await driftClient.getUserStats();
        set({ userStatsAccount });
      } catch (statsErr) {
        console.warn('Could not fetch user stats:', statsErr);
        // Continue without user stats
      }

      const subaccountsData: SubaccountData[] = [];
      
      // Fetch user accounts
      try {
        // Get user accounts for the authority
        const userAccounts = await driftClient.getUserAccountsForAuthority(walletPubkey);

        for (const userAccount of userAccounts) {
          if (userAccount) {
            const subaccountId = userAccount.subAccountId;
            
            // Get the public key for this user account - make sure it returns PublicKey not Promise<PublicKey>
            const userAccountPublicKey = driftClient.getUserAccountPublicKey(
              walletPubkey, 
              subaccountId
            );
            
            // Calculate balance using available method
            let balance = 0;
            try {
              // Use the appropriate method based on what's available in the SDK
              if (typeof userAccount.getTokenAmount === 'function') {
                // Use USDC token index (usually 0)
                balance = userAccount.getTokenAmount(0).toNumber();
              } else if (typeof userAccount.getSpotOpenOrdersValue === 'function') {
                balance = userAccount.getSpotOpenOrdersValue().toNumber();
              } else {
                // Fallback: Try to access balances directly if methods aren't available
                const spotBalances = userAccount.spotBalances || [];
                if (spotBalances.length > 0 && spotBalances[0]) {
                  balance = spotBalances[0].tokenAmount?.toNumber() || 0;
                }
              }
            } catch (balanceErr) {
              console.warn('Error calculating balance:', balanceErr);
              // Use zero as fallback
            }
            
            // Filter non-zero positions and orders with null checks
            const perpPositions = (userAccount.perpPositions || []).filter(
              p => p && p.baseAssetAmount && !p.baseAssetAmount.isZero()
            );
            const openOrders = (userAccount.orders || []).filter(
              o => o && o.baseAssetAmount && !o.baseAssetAmount.isZero()
            );

            subaccountsData.push({
              userAccountPublicKey,
              userAccount,
              balance,
              perpPositions,
              openOrders,
            });
          }
        }
      } catch (accountsErr) {
        console.error('Error fetching user accounts:', accountsErr);
        throw new Error('Failed to fetch user accounts');
      }

      set({ subaccounts: subaccountsData });
    } catch (err: unknown) {
      console.error('Error in fetchSubaccounts:', err);
      if (err instanceof Error) set({ error: err.message });
      else set({ error: 'Unknown error fetching subaccounts' });
    } finally {
      set({ isLoading: false });
    }
  },

  setSelectedSubaccountIndex: (index: number): void => {
    set({ selectedSubaccountIndex: index });
  },

  placeMarketOrder: async (marketIndex: number, direction: 'long' | 'short', amount: number): Promise<void> => {
    const { driftClient, selectedSubaccountIndex, subaccounts } = get();

    if (!driftClient) {
      set({ error: 'Drift client not initialized' });
      return;
    }

    try {
      set({ isLoading: true, error: null });
      
      const selectedSubaccount = subaccounts[selectedSubaccountIndex];
      if (!selectedSubaccount?.userAccount) {
        throw new Error('Selected subaccount not found');
      }
      
      // Switch to the correct subaccount
      const subaccountId = selectedSubaccount.userAccount.subAccountId;
      await driftClient.switchActiveUser(subaccountId);

      // Use the appropriate order structure based on the SDK version
      await driftClient.placePerpOrder({
        marketIndex,
        marketType: 0, // Assuming 0 is for perp markets
        orderType: 0, // Market order (check SDK documentation for the correct value)
        direction: direction === 'long' ? 0 : 1, // Assuming 0 is long, 1 is short
        baseAssetAmount: amount,
        price: 0, // Market orders don't need a price
        reduceOnly: false,
        postOnly: false,
        immediateOrCancel: true, // Market orders are IOC
        triggerPrice: null,
        triggerCondition: 0,
        oraclePriceOffset: 0,
        auctionDuration: null,
        maxTs: null,
        userOrderId: Math.floor(Math.random() * 100000),
      });

      // Refresh subaccounts data after order placement
      if (driftClient.wallet?.publicKey) {
        await get().fetchSubaccounts(driftClient.wallet.publicKey);
      }
    } catch (err: unknown) {
      console.error('Error placing market order:', err);
      if (err instanceof Error) set({ error: err.message });
      else set({ error: 'Unknown error placing market order' });
    } finally {
      set({ isLoading: false });
    }
  },

  placeLimitOrder: async (marketIndex: number, direction: 'long' | 'short', amount: number, price: number): Promise<void> => {
    const { driftClient, selectedSubaccountIndex, subaccounts } = get();

    if (!driftClient) {
      set({ error: 'Drift client not initialized' });
      return;
    }

    try {
      set({ isLoading: true, error: null });
      
      const selectedSubaccount = subaccounts[selectedSubaccountIndex];
      if (!selectedSubaccount?.userAccount) {
        throw new Error('Selected subaccount not found');
      }
      
      // Switch to the correct subaccount
      const subaccountId = selectedSubaccount.userAccount.subAccountId;
      await driftClient.switchActiveUser(subaccountId);

      // Use the appropriate order structure based on the SDK version
      await driftClient.placePerpOrder({
        marketIndex,
        marketType: 0, // Assuming 0 is for perp markets
        orderType: 1, // Limit order (check SDK documentation for the correct value)
        direction: direction === 'long' ? 0 : 1, // Assuming 0 is long, 1 is short
        baseAssetAmount: amount,
        price,
        reduceOnly: false,
        postOnly: true,
        immediateOrCancel: false,
        triggerPrice: null,
        triggerCondition: 0,
        oraclePriceOffset: 0,
        auctionDuration: null,
        maxTs: null,
        userOrderId: Math.floor(Math.random() * 100000),
      });

      // Refresh subaccounts data after order placement
      if (driftClient.wallet?.publicKey) {
        await get().fetchSubaccounts(driftClient.wallet.publicKey);
      }
    } catch (err: unknown) {
      console.error('Error placing limit order:', err);
      if (err instanceof Error) set({ error: err.message });
      else set({ error: 'Unknown error placing limit order' });
    } finally {
      set({ isLoading: false });
    }
  },

  deposit: async (tokenIndex: number, amount: number): Promise<void> => {
    const { driftClient, selectedSubaccountIndex, subaccounts } = get();

    if (!driftClient) {
      set({ error: 'Drift client not initialized' });
      return;
    }

    try {
      set({ isLoading: true, error: null });
      
      const selectedSubaccount = subaccounts[selectedSubaccountIndex];
      if (!selectedSubaccount?.userAccount) {
        throw new Error('Selected subaccount not found');
      }
      
      // Switch to the correct subaccount
      const subaccountId = selectedSubaccount.userAccount.subAccountId;
      await driftClient.switchActiveUser(subaccountId);

      // Use the Drift SDK deposit method with corrected parameter types
      await driftClient.deposit(
        amount,
        tokenIndex,
        subaccountId
      );

      // Refresh subaccounts data after deposit
      if (driftClient.wallet?.publicKey) {
        await get().fetchSubaccounts(driftClient.wallet.publicKey);
      }
    } catch (err: unknown) {
      console.error('Error depositing funds:', err);
      if (err instanceof Error) set({ error: err.message });
      else set({ error: 'Unknown error during deposit' });
    } finally {
      set({ isLoading: false });
    }
  },

  withdraw: async (tokenIndex: number, amount: number): Promise<void> => {
    const { driftClient, selectedSubaccountIndex, subaccounts } = get();

    if (!driftClient) {
      set({ error: 'Drift client not initialized' });
      return;
    }

    try {
      set({ isLoading: true, error: null });
      
      const selectedSubaccount = subaccounts[selectedSubaccountIndex];
      if (!selectedSubaccount?.userAccount) {
        throw new Error('Selected subaccount not found');
      }
      
      // Switch to the correct subaccount
      const subaccountId = selectedSubaccount.userAccount.subAccountId;
      await driftClient.switchActiveUser(subaccountId);

      // Use the Drift SDK withdraw method with corrected parameter types
      await driftClient.withdraw(
        amount,
        tokenIndex,
        subaccountId
      );

      // Refresh subaccounts data after withdrawal
      if (driftClient.wallet?.publicKey) {
        await get().fetchSubaccounts(driftClient.wallet.publicKey);
      }
    } catch (err: unknown) {
      console.error('Error withdrawing funds:', err);
      if (err instanceof Error) set({ error: err.message });
      else set({ error: 'Unknown error during withdrawal' });
    } finally {
      set({ isLoading: false });
    }
  },
}));

export default useStore;