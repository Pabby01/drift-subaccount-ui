// store/useStore.ts
import { create } from 'zustand';
import { Connection, PublicKey } from '@solana/web3.js';
import {
  UserAccount,
  UserStatsAccount,
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
  userStatsAccount: UserStatsAccount | null;
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
      const driftClient = await createDriftClient(wallet, connection);
      set({ driftClient });

      if (wallet.publicKey) {
        await get().fetchSubaccounts(wallet.publicKey);
      }
    } catch (err: unknown) {
      if (err instanceof Error) set({ error: err.message });
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
      const userStatsAccount = await driftClient.getUserStatsAccount();
      set({ userStatsAccount });

      const subaccountsData: SubaccountData[] = [];

      for (let i = 0; i < 8; i++) {
        try {
          const userAccountPublicKey = driftClient.getUserAccountPublicKey(walletPubkey, i);
          const userAccount = await driftClient.getUserAccount(i);

          if (userAccount) {
            const balance = userAccount.quoteAssetAmount.toNumber();
            const perpPositions = userAccount.perpPositions.filter(p => !p.baseAssetAmount.isZero());
            const openOrders = userAccount.orders.filter(o => !o.baseAssetAmount.isZero());

            subaccountsData.push({
              userAccountPublicKey,
              userAccount,
              balance,
              perpPositions,
              openOrders,
            });
          }
        } catch (err) {
          console.error(`Error fetching subaccount ${i}:`, err);
        }
      }

      set({ subaccounts: subaccountsData });
    } catch (err: unknown) {
      if (err instanceof Error) set({ error: err.message });
    } finally {
      set({ isLoading: false });
    }
  },

  setSelectedSubaccountIndex: (index: number): void => {
    set({ selectedSubaccountIndex: index });
  },

  placeMarketOrder: async (marketIndex: number, direction: 'long' | 'short', amount: number): Promise<void> => {
    const { driftClient, selectedSubaccountIndex } = get();

    if (!driftClient) {
      set({ error: 'Drift client not initialized' });
      return;
    }

    try {
      set({ isLoading: true, error: null });

      await driftClient.placePerpOrder({
        marketIndex,
        orderType: { market: {} },
        direction: direction === 'long' ? { long: {} } : { short: {} },
        baseAssetAmount: amount,
        userOrderId: Math.floor(Math.random() * 100000),
        subaccountIndex: selectedSubaccountIndex,
      });

      if (driftClient.wallet?.publicKey) {
        await get().fetchSubaccounts(driftClient.wallet.publicKey);
      }
    } catch (err: unknown) {
      if (err instanceof Error) set({ error: err.message });
    } finally {
      set({ isLoading: false });
    }
  },

  placeLimitOrder: async (marketIndex: number, direction: 'long' | 'short', amount: number, price: number): Promise<void> => {
    const { driftClient, selectedSubaccountIndex } = get();

    if (!driftClient) {
      set({ error: 'Drift client not initialized' });
      return;
    }

    try {
      set({ isLoading: true, error: null });

      await driftClient.placePerpOrder({
        marketIndex,
        orderType: { limit: {} },
        direction: direction === 'long' ? { long: {} } : { short: {} },
        baseAssetAmount: amount,
        price,
        userOrderId: Math.floor(Math.random() * 100000),
        subaccountIndex: selectedSubaccountIndex,
      });

      if (driftClient.wallet?.publicKey) {
        await get().fetchSubaccounts(driftClient.wallet.publicKey);
      }
    } catch (err: unknown) {
      if (err instanceof Error) set({ error: err.message });
    } finally {
      set({ isLoading: false });
    }
  },

  deposit: async (tokenIndex: number, amount: number): Promise<void> => {
    const { driftClient, selectedSubaccountIndex } = get();

    if (!driftClient) {
      set({ error: 'Drift client not initialized' });
      return;
    }

    try {
      set({ isLoading: true, error: null });

      await driftClient.deposit(
        amount,
        tokenIndex,
        selectedSubaccountIndex
      );

      if (driftClient.wallet?.publicKey) {
        await get().fetchSubaccounts(driftClient.wallet.publicKey);
      }
    } catch (err: unknown) {
      if (err instanceof Error) set({ error: err.message });
    } finally {
      set({ isLoading: false });
    }
  },

  withdraw: async (tokenIndex: number, amount: number): Promise<void> => {
    const { driftClient, selectedSubaccountIndex } = get();

    if (!driftClient) {
      set({ error: 'Drift client not initialized' });
      return;
    }

    try {
      set({ isLoading: true, error: null });

      await driftClient.withdraw(
        amount,
        tokenIndex,
        selectedSubaccountIndex
      );

      if (driftClient.wallet?.publicKey) {
        await get().fetchSubaccounts(driftClient.wallet.publicKey);
      }
    } catch (err: unknown) {
      if (err instanceof Error) set({ error: err.message });
    } finally {
      set({ isLoading: false });
    }
  },
}));

export default useStore;