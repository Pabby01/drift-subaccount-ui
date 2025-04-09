// pages/index.tsx
import { useState, useEffect } from 'react';
import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { motion } from 'framer-motion';
import useStore from '../store/useStore';
import SubaccountsList from '../components/SubaccountsList';
import SubaccountDetail from '../components/SubaccountDetail';
import WalletLookup from '../components/WalletLookup';
import Header from '../components/Header';
import LoadingSpinner from '../components/LoadingSpinner';
import { gsap } from 'gsap';
import type { WalletAdapter } from '@solana/wallet-adapter-base';
import { BN } from '@drift-labs/sdk';

interface ComponentSubaccountData {
  userAccount: {
    id: string;
    address?: string;
    name?: string;
  };
  balance: number;
  perpPositions: {
    marketIndex: number;
    baseAssetAmount: number;
    quoteAssetAmount: number;
    entryPrice: number;
    breakEvenPrice: number;
    unrealizedPnl: number;
    lastCumulativeFundingRate: number;
    // lastFundingRate?: number; // Removed optional
    // lastMarkPriceTwap?: number; // Removed optional
    // lastBidPriceTwap?: number; // Removed optional
    // lastAskPriceTwap?: number; // Removed optional
  }[];
  openOrders: {
    marketIndex: number;
    orderId: number;
    baseAssetAmount: number;
    price: number;
    direction: 'long' | 'short';
    orderType: string;
    timestamp: number;
  }[];
}

interface PerpPosition {
  marketIndex: number;
  baseAssetAmount: BN;
  quoteAssetAmount: BN;
  quoteEntryAmount: BN;
  lastCumulativeFundingRate: BN;
  lastMarkPriceTwap: BN;
  lastFundingRate: BN; // Add this property to the interface
  lastBidPriceTwap: BN; // Add this property
  lastAskPriceTwap: BN; // Add this property
}

export default function Home() {
  const { connection } = useConnection();
  const { publicKey, connected, wallet } = useWallet();
  const {
    initializeDriftClient,
    subaccounts,
    selectedSubaccountIndex,
    setSelectedSubaccountIndex,
    isLoading,
    error
  } = useStore();

  const [walletQuery, setWalletQuery] = useState('');

  useEffect(() => {
    if (connected && wallet && publicKey) {
      initializeDriftClient(wallet.adapter as WalletAdapter, connection);
    }
  }, [connected, wallet, publicKey, connection, initializeDriftClient]);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.from(".page-content", {
        duration: 0.8,
        opacity: 0,
        y: 20,
        ease: "power2.out",
        stagger: 0.1
      });
    });
    return () => ctx.revert();
  }, []);

  const handleQueryWallet = async (walletAddress: string) => {
    console.log("Looking up wallet:", walletAddress);
  };

  const calculatePositionMetrics = (position: PerpPosition) => {
    const baseAmount = position.baseAssetAmount.toNumber();
    const quoteEntry = position.quoteEntryAmount.toNumber();
    const markPrice = position.lastMarkPriceTwap.toNumber();
    const fundingRate = position.lastCumulativeFundingRate.toNumber();

    const entryPrice = baseAmount === 0 ? 0 : quoteEntry / Math.abs(baseAmount);
    const breakEvenPrice = baseAmount === 0 ? 0 :
      (quoteEntry + fundingRate) / Math.abs(baseAmount);
    const unrealizedPnl = baseAmount * (markPrice - entryPrice);

    return {
      entryPrice,
      breakEvenPrice,
      unrealizedPnl
    };
  };

  const componentSubaccounts: ComponentSubaccountData[] = subaccounts.map(sub => ({
    userAccount: {
      id: sub.userAccountPublicKey.toString(),
      address: sub.userAccountPublicKey.toString(),
    },
    balance: sub.balance,
    perpPositions: sub.perpPositions.map(pos => {
      const { entryPrice, breakEvenPrice, unrealizedPnl } = calculatePositionMetrics({
        marketIndex: pos.marketIndex,
        baseAssetAmount: pos.baseAssetAmount,
        quoteAssetAmount: pos.quoteAssetAmount,
        quoteEntryAmount: pos.quoteEntryAmount,
        lastCumulativeFundingRate: pos.lastCumulativeFundingRate,
        lastMarkPriceTwap: undefined,
        lastFundingRate: undefined,
        lastBidPriceTwap: undefined,
        lastAskPriceTwap: undefined
      });

      return {
        marketIndex: pos.marketIndex,
        baseAssetAmount: pos.baseAssetAmount.toNumber(),
        quoteAssetAmount: pos.quoteAssetAmount.toNumber(),
        entryPrice,
        breakEvenPrice,
        unrealizedPnl,
        lastCumulativeFundingRate: pos.lastCumulativeFundingRate.toNumber(),
        // lastFundingRate: pos.lastFundingRate ? pos.lastFundingRate.toNumber() : 0, // Handle potential undefined
        // lastMarkPriceTwap: pos.lastMarkPriceTwap ? pos.lastMarkPriceTwap.toNumber() : 0, // Handle potential undefined
        // lastBidPriceTwap: pos.lastBidPriceTwap ? pos.lastBidPriceTwap.toNumber() : 0, // Handle potential undefined
        // lastAskPriceTwap: pos.lastAskPriceTwap ? pos.lastAskPriceTwap.toNumber() : 0 // Handle potential undefined
      };
    }),
    openOrders: sub.openOrders.map(order => ({
      marketIndex: order.marketIndex,
      orderId: order.orderId,
      baseAssetAmount: order.baseAssetAmount.toNumber(),
      price: order.price.toNumber(),
      direction: order.direction === 1 ? 'long' : 'short',
      orderType: order.orderType.toString(),
      timestamp: order.slot.toNumber(),
    })),
  }));

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <main className="container mx-auto px-4 py-8">
        <div className="page-content flex flex-col md:flex-row gap-6">
          <motion.div
            className="bg-white rounded-lg shadow-md p-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <h2 className="text-xl font-semibold mb-4">Connect Your Wallet</h2>
            <div className="flex justify-center">
              <WalletMultiButton className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded" />
            </div>

            {connected && (
              <div className="mt-4 text-center">
                <p className="text-green-600">Connected: {publicKey?.toString().slice(0, 6)}...{publicKey?.toString().slice(-4)}</p>
              </div>
            )}

            <div className="mt-8">
              <WalletLookup
                value={walletQuery}
                onChange={setWalletQuery}
                onSubmit={handleQueryWallet}
              />
            </div>
          </motion.div>

          <motion.div
            className="flex-1 page-content"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            {isLoading ? (
              <LoadingSpinner />
            ) : error ? (
              <div className="bg-red-50 text-red-700 p-4 rounded-lg">
                Error: {error}
              </div>
            ) : connected ? (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="md:col-span-1 bg-white rounded-lg shadow-md p-6">
                  <h2 className="text-xl font-semibold mb-4">Your Subaccounts</h2>
                  <SubaccountsList
                    subaccounts={componentSubaccounts}
                    selectedIndex={selectedSubaccountIndex}
                    onSelect={setSelectedSubaccountIndex}
                  />
                </div>

                <div className="md:col-span-2 bg-white rounded-lg shadow-md p-6">
                  <h2 className="text-xl font-semibold mb-4">Account Details</h2>
                  {componentSubaccounts.length > 0 ? (
                    <SubaccountDetail subaccount={componentSubaccounts[selectedSubaccountIndex]} />
                  ) : (
                    <p>No subaccounts found for this wallet.</p>
                  )}
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-lg shadow-md p-6 text-center">
                <h2 className="text-xl font-semibold mb-4">Welcome to Drift Subaccounts</h2>
                <p className="mb-4">Connect your wallet to view your subaccounts, balances, and positions.</p>
              </div>
            )}
          </motion.div>
        </div>
      </main>
    </div>
  );
}