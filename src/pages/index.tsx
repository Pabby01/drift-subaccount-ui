// pages/index.tsx
import { useState, useEffect } from 'react';
import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { motion } from 'framer-motion';
import { useRouter } from 'next/router';
import useStore from '../store/useStore';
import SubaccountsList from '../components/SubaccountsList';
import SubaccountDetail from '../components/SubaccountDetail';
import WalletLookup from '../components/WalletLookup';
import Header from '../components/Header';
import LoadingSpinner from '../components/LoadingSpinner';
import { gsap } from 'gsap';

export default function Home() {
  const router = useRouter();
  const { connection } = useConnection();
  const { publicKey, connected, wallet } = useWallet();
  const { 
    initializeDriftClient, 
    fetchSubaccounts,
    subaccounts,
    selectedSubaccountIndex,
    setSelectedSubaccountIndex,
    isLoading,
    error
  } = useStore();
  
  const [walletQuery, setWalletQuery] = useState('');
  
  useEffect(() => {
    // Initialize the client when wallet connects
    if (connected && wallet && publicKey) {
      initializeDriftClient(wallet, connection);
    }
  }, [connected, wallet, publicKey, connection, initializeDriftClient]);
  
  // Animation for page load
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
    // Implement wallet lookup functionality
    console.log("Looking up wallet:", walletAddress);
    // You could add logic here to look up a specific wallet's data
  };
  
  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <main className="container mx-auto px-4 py-8">
        <div className="page-content flex flex-col md:flex-row gap-6">
          {/* Wallet Connection */}
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
          
          {/* Main Content Area */}
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
                    subaccounts={subaccounts}
                    selectedIndex={selectedSubaccountIndex}
                    onSelect={setSelectedSubaccountIndex}
                  />
                </div>
                
                <div className="md:col-span-2 bg-white rounded-lg shadow-md p-6">
                  <h2 className="text-xl font-semibold mb-4">Account Details</h2>
                  {subaccounts.length > 0 ? (
                    <SubaccountDetail subaccount={subaccounts[selectedSubaccountIndex]} />
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