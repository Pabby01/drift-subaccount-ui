// components/OrdersTable.tsx
import { motion } from 'framer-motion';
import useStore from '../store/useStore';

interface Order {
  marketIndex: number;
  orderId: number;
  direction: 'long' | 'short';
  baseAssetAmount: number;
  price: number;
  orderType: string;
  timestamp: number;
}

interface OrdersTableProps {
  orders: Order[];
}

export default function OrdersTable({ orders }: OrdersTableProps) {
  const marketNames: Record<number, string> = {
    0: 'BTC-USD',
    1: 'ETH-USD',
    2: 'SOL-USD',
    3: 'XRP-USD',
    // Add more market names as needed
  };
  
  if (orders.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500">No open orders</p>
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
            <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Type
            </th>
            <th className="px-6 py-3 bg-gray-50 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
              Side
            </th>
            <th className="px-6 py-3 bg-gray-50 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
              Size
            </th>
            <th className="px-6 py-3 bg-gray-50 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
              Price
            </th>
            <th className="px-6 py-3 bg-gray-50 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
              Time
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {orders.map((order, index) => (
            <motion.tr 
              key={index}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.3, delay: index * 0.05 }}
            >
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="font-medium text-gray-900">
                  {marketNames[order.marketIndex] || `Market ${order.marketIndex}`}
                </div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="text-sm text-gray-900">
                  {order.orderType === 'limit' ? 'Limit' : 'Market'}
                </div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-right">
                <div className={`text-sm font-medium ${order.direction === 'long' ? 'text-green-600' : 'text-red-600'}`}>
                  {order.direction === 'long' ? 'Long' : 'Short'}
                </div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-right">
                <div className="text-sm text-gray-900">{order.baseAssetAmount.toFixed(4)}</div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-right">
                <div className="text-sm text-gray-900">${order.price.toFixed(2)}</div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-right">
                <div className="text-sm text-gray-500">
                  {new Date(order.timestamp * 1000).toLocaleTimeString()}
                </div>
              </td>
            </motion.tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
