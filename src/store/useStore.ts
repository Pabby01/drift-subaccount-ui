// store/useStore.ts
import { create } from 'zustand';
import { Connection, PublicKey, Transaction, VersionedTransaction } from '@solana/web3.js';
// 👇 import the SignerWalletAdapter interface
import type { SignerWalletAdapter } from '@solana/wallet-adapter-base';
import {
  DriftClient,
  UserMap,
  User,
  OrderType,
  PositionDirection,
  IWallet,
  IVersionedWallet,
} from '@drift-labs/sdk';

interface DriftStore {
  driftClient: DriftClient | null;
  userMap: UserMap | null;
  subaccounts: User[];
  selectedSubaccountIndex: number;
  isLoading: boolean;
  error: string | null;

  // 👇 change WalletAdapter to SignerWalletAdapter
  initializeDriftClient: (walletAdapter: SignerWalletAdapter, connection: Connection) => Promise<void>;
  lookupWallet: (walletAddress: string) => Promise<void>;
  setSelectedSubaccountIndex: (index: number) => void;
  placeMarketOrder: (marketIndex: number, direction: 'long' | 'short', amount: number) => Promise<void>;
  placeLimitOrder: (marketIndex: number, direction: 'long' | 'short', amount: number, price: number) => Promise<void>;
  deposit: (marketIndex: number, amount: number) => Promise<void>;
  withdraw: (marketIndex: number, amount: number) => Promise<void>;
}

const createDriftCompatibleWallet = (
  adapter: SignerWalletAdapter // 👈 now correctly typed
): IWallet & IVersionedWallet => {
  if (!adapter.publicKey) throw new Error('Wallet not connected');

  return {
    publicKey: adapter.publicKey,

    // Now TS knows signTransaction exists on SignerWalletAdapter
    signTransaction: async (tx: Transaction) => {
      return adapter.signTransaction(tx);
    },

    signAllTransactions: async (txs: Transaction[]) => {
      return adapter.signAllTransactions(txs);
    },

    signVersionedTransaction: async (tx: VersionedTransaction) => {
      // WalletAdapter uses signTransaction for versioned tx as well
      return adapter.signTransaction(tx);
    },

    signAllVersionedTransactions: async (txs: VersionedTransaction[]) => {
      return adapter.signAllTransactions(txs);
    },
    // payer is optional on IWallet/IVersionedWallet
  };
};

const useStore = create<DriftStore>((set, get) => ({
  driftClient: null,
  userMap: null,
  subaccounts: [],
  selectedSubaccountIndex: 0,
  isLoading: false,
  error: null,

  initializeDriftClient: async (
    walletAdapter: SignerWalletAdapter, // 👈 updated here too
    connection: Connection
  ): Promise<void> => {
    set({ isLoading: true, error: null });
    try {
      const driftWallet = createDriftCompatibleWallet(walletAdapter);
      const driftClient = new DriftClient({
        connection,
        wallet: driftWallet,
        env: 'devnet',
      });
      await driftClient.subscribe();

      const userMap = new UserMap({
        driftClient,
        connection,
        subscriptionConfig: { type: 'websocket' },
        skipInitialLoad: false,
        includeIdle: false,
      });
      await userMap.subscribe();

      const subaccounts = Array.from(userMap.values());
      set({ driftClient, userMap, subaccounts });
    } catch (err) {
      set({ error: (err as Error).message });
    } finally {
      set({ isLoading: false });
    }
  },

  lookupWallet: async (walletAddress: string): Promise<void> => {
    set({ isLoading: true, error: null });
    try {
      const { userMap } = get();
      if (!userMap) throw new Error('Drift client not initialized');

      const authority = new PublicKey(walletAddress);
      const filtered = Array.from(userMap.values()).filter((user) =>
        user.getUserAccount().authority.equals(authority)
      );
      set({ subaccounts: filtered, selectedSubaccountIndex: 0 });
    } catch (err) {
      set({ error: (err as Error).message });
    } finally {
      set({ isLoading: false });
    }
  },

  setSelectedSubaccountIndex: (index: number): void => {
    set({ selectedSubaccountIndex: index });
  },

  placeMarketOrder: async (
    marketIndex: number,
    direction: 'long' | 'short',
    amount: number
  ): Promise<void> => {
    set({ isLoading: true, error: null });
    try {
      const { driftClient, userMap } = get();
      if (!driftClient) throw new Error('Drift client not initialized');

      const dir =
        direction === 'long' ? PositionDirection.LONG : PositionDirection.SHORT;
      const baseAssetAmount = driftClient.convertToPerpPrecision(amount);

      await driftClient.placePerpOrder({
        orderType: OrderType.MARKET,
        marketIndex,
        direction: dir,
        baseAssetAmount,
      });

      if (userMap) {
        set({ subaccounts: Array.from(userMap.values()) });
      }
    } catch (err) {
      set({ error: (err as Error).message });
    } finally {
      set({ isLoading: false });
    }
  },

  placeLimitOrder: async (
    marketIndex: number,
    direction: 'long' | 'short',
    amount: number,
    price: number
  ): Promise<void> => {
    set({ isLoading: true, error: null });
    try {
      const { driftClient, userMap } = get();
      if (!driftClient) throw new Error('Drift client not initialized');

      const dir =
        direction === 'long' ? PositionDirection.LONG : PositionDirection.SHORT;
      const baseAssetAmount = driftClient.convertToPerpPrecision(amount);
      const pricePrecision = driftClient.convertToPricePrecision(price);

      await driftClient.placePerpOrder({
        orderType: OrderType.LIMIT,
        marketIndex,
        direction: dir,
        baseAssetAmount,
        price: pricePrecision,
      });

      if (userMap) {
        set({ subaccounts: Array.from(userMap.values()) });
      }
    } catch (err) {
      set({ error: (err as Error).message });
    } finally {
      set({ isLoading: false });
    }
  },

  deposit: async (marketIndex: number, amount: number): Promise<void> => {
    set({ isLoading: true, error: null });
    try {
      const { driftClient, userMap } = get();
      if (!driftClient) throw new Error('Drift client not initialized');

      const amt = driftClient.convertToSpotPrecision(marketIndex, amount);
      const ata = await driftClient.getAssociatedTokenAccount(marketIndex);
      await driftClient.deposit(amt, marketIndex, ata);

      if (userMap) {
        set({ subaccounts: Array.from(userMap.values()) });
      }
    } catch (err) {
      set({ error: (err as Error).message });
    } finally {
      set({ isLoading: false });
    }
  },

  withdraw: async (marketIndex: number, amount: number): Promise<void> => {
    set({ isLoading: true, error: null });
    try {
      const { driftClient, userMap } = get();
      if (!driftClient) throw new Error('Drift client not initialized');

      const amt = driftClient.convertToSpotPrecision(marketIndex, amount);
      const ata = await driftClient.getAssociatedTokenAccount(marketIndex);
      await driftClient.withdraw(amt, marketIndex, ata);

      if (userMap) {
        set({ subaccounts: Array.from(userMap.values()) });
      }
    } catch (err) {
      set({ error: (err as Error).message });
    } finally {
      set({ isLoading: false });
    }
  },
}));

export default useStore;
