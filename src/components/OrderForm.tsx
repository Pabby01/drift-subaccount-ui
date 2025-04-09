// components/OrderForm.tsx
import { useState } from 'react';
import { motion } from 'framer-motion';
import useStore from '../store/useStore';

export default function OrderForm() {
  const [orderType, setOrderType] = useState<'market' | 'limit'>('market');
  const [direction, setDirection] = useState<'long' | 'short'>('long');
  const [marketIndex, setMarketIndex] = useState(0);
  const [amount, setAmount] = useState('');
  const [price, setPrice] = useState('');
  
  const { placeMarketOrder, placeLimitOrder, isLoading } = useStore();
  
  const markets = [
    { index: 0, symbol: 'BTC-USD', description: 'Bitcoin/USD' },
    { index: 1, symbol: 'ETH-USD', description: 'Ethereum/USD' },
    { index: 2, symbol: 'SOL-USD', description: 'Solana/USD' },
    // Add more markets as needed
  ];
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      return;
    }
    
    if (orderType === 'market') {
      await placeMarketOrder(marketIndex, direction, parsedAmount);
    } else {
      const parsedPrice = parseFloat(price);
      if (isNaN(parsedPrice) || parsedPrice <= 0) {
        return;
      }
      await placeLimitOrder(marketIndex, direction, parsedAmount, parsedPrice);
    }
    
    // Reset form
    setAmount('');
    setPrice('');
  };
  
  return (
    <div className="max-w-md mx-auto">
      <div className="mb-6">
        <div className="inline-flex bg-gray-100 p-1 rounded-full">
          <button
            className={`px-6 py-2 rounded-full ${
              orderType === 'market' 
                ? 'bg-white shadow-md text-indigo-600' 
                : 'text-gray-600'
            }`}
            onClick={() => setOrderType('market')}
          >
            Market
          </button>
          <button
            className={`px-6 py-2 rounded-full ${
              orderType === 'limit' 
                ? 'bg-white shadow-md text-indigo-600' 
                : 'text-gray-600'
            }`}
            onClick={() => setOrderType('limit')}
          >
            Limit
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
            Market
          </label>
          <select
            value={marketIndex}
            onChange={(e) => setMarketIndex(parseInt(e.target.value))}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-600"
          >
            {markets.map(market => (
              <option key={market.index} value={market.index}>
                {market.symbol} - {market.description}
              </option>
            ))}
          </select>
        </div>
        
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Direction
          </label>
          <div className="flex">
            <button
              type="button"
              className={`flex-1 py-2 px-4 ${
                direction === 'long'
                  ? 'bg-green-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              } rounded-l-lg`}
              onClick={() => setDirection('long')}
            >
              Long
            </button>
            <button
              type="button"
              className={`flex-1 py-2 px-4 ${
                direction === 'short'
                  ? 'bg-red-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              } rounded-r-lg`}
              onClick={() => setDirection('short')}
            >
              Short
            </button>
          </div>
        </div>
        
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Amount
          </label>
          <input
            type="text"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="0.00"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-600"
          />
        </div>
        
        {orderType === 'limit' && (
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Price
            </label>
            <input
              type="text"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              placeholder="0.00"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-600"
            />
          </div>
        )}
        
        <button
          type="submit"
          disabled={isLoading}
          className={`w-full py-2 px-4 rounded-lg ${
            direction === 'long'
              ? 'bg-green-600 hover:bg-green-700 text-white'
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
            `${direction === 'long' ? 'Buy' : 'Sell'} ${markets.find(m => m.index === marketIndex)?.symbol}`
          )}
        </button>
      </motion.form>
    </div>
  );
}