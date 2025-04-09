// components/PositionsTable.tsx
import { motion } from 'framer-motion';

interface Position {
  marketIndex: number;
  baseAssetAmount: number;
  quoteAssetAmount: number;
  entryPrice: number;
  breakEvenPrice: number;
  unrealizedPnl: number;
}

interface PositionsTableProps {
  positions: Position[];
}

export default function PositionsTable({ positions }: PositionsTableProps) {
  const marketNames: Record<number, string> = {
    0: 'BTC-USD',
    1: 'ETH-USD',
    2: 'SOL-USD',
    3: 'XRP-USD',
    // Add more market names as needed
  };
  
  if (positions.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500">No open positions</p>
      </div>
    );
  }
  
  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead>
          <tr>
            <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Market
            </th>
            <th className="px-6 py-3 bg-gray-50 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
              Size
            </th>
            <th className="px-6 py-3 bg-gray-50 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
              Entry Price
            </th>
            <th className="px-6 py-3 bg-gray-50 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
              Break-even Price
            </th>
            <th className="px-6 py-3 bg-gray-50 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
              PnL
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {positions.map((position, index) => (
            <motion.tr 
              key={index}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.3, delay: index * 0.05 }}
            >
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="font-medium text-gray-900">
                  {marketNames[position.marketIndex] || `Market ${position.marketIndex}`}
                </div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-right">
                <div className={`text-sm ${position.baseAssetAmount > 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {position.baseAssetAmount > 0 ? '+' : ''}{position.baseAssetAmount.toFixed(4)}
                </div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-right">
                <div className="text-sm text-gray-900">${position.entryPrice.toFixed(2)}</div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-right">
                <div className="text-sm text-gray-900">${position.breakEvenPrice.toFixed(2)}</div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-right">
                <div className={`text-sm font-medium ${position.unrealizedPnl >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {position.unrealizedPnl >= 0 ? '+' : ''}${position.unrealizedPnl.toFixed(2)}
                </div>
              </td>
            </motion.tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}