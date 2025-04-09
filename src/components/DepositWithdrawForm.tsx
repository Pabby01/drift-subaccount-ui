// components/DepositWithdrawForm.tsx
import { useState } from 'react';
import { motion } from 'framer-motion';
import useStore from '../store/useStore';

export default function DepositWithdrawForm() {
  const [mode, setMode] = useState<'deposit' | 'withdraw'>('deposit');
  const [tokenIndex, setTokenIndex] = useState(0); // 0 for USDC
  const [amount, setAmount] = useState('');
  const { deposit, withdraw, isLoading } = useStore();
  
  const tokens = [
    { index: 0, symbol: 'USDC', name: 'USD Coin' },
    { index: 1, symbol: 'SOL', name: 'Solana' },
    // Add more tokens as needed
  ];
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      return;
    }
    
    if (mode === 'deposit') {
      await deposit(tokenIndex, parsedAmount);
    } else {
      await withdraw(tokenIndex, parsedAmount);
    }
    
    // Reset form
    setAmount('');
  };
  
  return (
    <div className="max-w-md mx-auto">
      <div className="flex justify-center mb-6">
        <div className="inline-flex bg-gray-100 p-1 rounded-full">
          <button
            className={`px-6 py-2 rounded-full ${
              mode === 'deposit' 
                ? 'bg-white shadow-md text-indigo-600' 
                : 'text-gray-600'
            }`}
            onClick={() => setMode('deposit')}
          >
            Deposit
          </button>
          <button
            className={`px-6 py-2 rounded-full ${
              mode === 'withdraw' 
                ? 'bg-white shadow-md text-indigo-600' 
                : 'text-gray-600'
            }`}
            onClick={() => setMode('withdraw')}
          >
            Withdraw
          </button>
        </div>
      </div>
      
      <motion.form 
        onSubmit={handleSubmit}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.4 }}
      >
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Token
          </label>
          <select
            value={tokenIndex}
            onChange={(e) => setTokenIndex(parseInt(e.target.value))}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-600"
          >
            {tokens.map(token => (
              <option key={token.index} value={token.index}>
                {token.symbol} - {token.name}
              </option>
            ))}
          </select>
        </div>
        
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Amount
          </label>
          <div className="relative">
            <input
              type="text"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.00"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-600"
            />
            <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
              <span className="text-gray-500">{tokens.find(t => t.index === tokenIndex)?.symbol}</span>
            </div>
          </div>
        </div>
        
        <button
          type="submit"
          disabled={isLoading}
          className={`w-full py-2 px-4 rounded-lg ${
            mode === 'deposit'
              ? 'bg-indigo-600 hover:bg-indigo-700 text-white'
              : 'bg-red-600 hover:bg-red-700 text-white'
          } ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          {isLoading ? (
            <span className="flex items-center justify-center">
              <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Processing...
            </span>
          ) : (
            `${mode === 'deposit' ? 'Deposit' : 'Withdraw'} ${tokens.find(t => t.index === tokenIndex)?.symbol}`
          )}
        </button>
      </motion.form>
    </div>
  );
}
