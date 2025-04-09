// components/SubaccountDetail.tsx
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import DepositWithdrawForm from './DepositWithdrawForm';
import OrderForm from './OrderForm';
import PositionsTable from './PositionsTable';
import OrdersTable from './OrdersTable';

// Update these types to match what PositionsTable expects
interface Position {
  marketIndex: number;
  baseAssetAmount: number;
  quoteAssetAmount: number;
  entryPrice: number;
  breakEvenPrice: number;
  unrealizedPnl: number;
  // Add any other position properties needed by PositionsTable
}
// Update these types to match what OrdersTable expects
interface Order {
  marketIndex: number;
  orderId: number;
  baseAssetAmount: number;
  price: number;
  direction: 'long' | 'short';
  orderType: string;
  timestamp: number;
  // Add any other order properties needed by OrdersTable
}

// Define user account type only (no collisions with this one)
interface UserAccount {
  id: string;
  address?: string;
  name?: string;
}

interface SubaccountData {
  userAccount: UserAccount;
  balance: number;
  perpPositions: Position[];
  openOrders: Order[];
}

interface SubaccountDetailProps {
  subaccount: SubaccountData;
}

export default function SubaccountDetail({ subaccount }: SubaccountDetailProps) {
  const [activeTab, setActiveTab] = useState('overview');
  
  const tabs = [
    { id: 'overview', label: 'Overview' },
    { id: 'positions', label: 'Positions' },
    { id: 'orders', label: 'Orders' },
    { id: 'deposit', label: 'Deposit/Withdraw' },
    { id: 'trade', label: 'Trade' }
  ];
  
  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-medium">
          Subaccount Details
        </h3>
        <div className="text-right">
          <div className="text-2xl font-bold">${subaccount.balance.toFixed(2)}</div>
          <div className="text-sm text-gray-500">Total Balance</div>
        </div>
      </div>
      
      {/* Tab Navigation */}
      <div className="flex overflow-x-auto space-x-2 mb-6 pb-2">
        {tabs.map(tab => (
          <button
            key={tab.id}
            className={`px-4 py-2 rounded-full whitespace-nowrap ${
              activeTab === tab.id
                ? 'bg-indigo-600 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </div>
      
      {/* Tab Content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.2 }}
        >
          {activeTab === 'overview' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-medium mb-2">Positions Summary</h4>
                <div className="text-sm">
                  {subaccount.perpPositions.length > 0 ? (
                    <div className="space-y-2">
                      {subaccount.perpPositions.slice(0, 3).map((position, i) => (
                        <div key={i} className="flex justify-between">
                          <span>Position {i + 1}</span>
                          <span className="font-medium">
                            {position.baseAssetAmount > 0 ? 'Long' : 'Short'} {Math.abs(position.baseAssetAmount)}
                          </span>
                        </div>
                      ))}
                      {subaccount.perpPositions.length > 3 && (
                        <div className="text-indigo-600 text-center mt-2">
                          +{subaccount.perpPositions.length - 3} more positions
                        </div>
                      )}
                    </div>
                  ) : (
                    <p className="text-gray-500">No positions</p>
                  )}
                </div>
              </div>
              
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-medium mb-2">Orders Summary</h4>
                <div className="text-sm">
                  {subaccount.openOrders.length > 0 ? (
                    <div className="space-y-2">
                      {subaccount.openOrders.slice(0, 3).map((order, i) => (
                        <div key={i} className="flex justify-between">
                          <span>Order {i + 1}</span>
                          <span className="font-medium">
                            {order.direction} {order.baseAssetAmount} @ {order.price}
                          </span>
                        </div>
                      ))}
                      {subaccount.openOrders.length > 3 && (
                        <div className="text-indigo-600 text-center mt-2">
                          +{subaccount.openOrders.length - 3} more orders
                        </div>
                      )}
                    </div>
                  ) : (
                    <p className="text-gray-500">No open orders</p>
                  )}
                </div>
              </div>
              
              <div className="md:col-span-2 bg-gray-50 p-4 rounded-lg">
                <h4 className="font-medium mb-2">Quick Actions</h4>
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => setActiveTab('deposit')}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                  >
                    Deposit
                  </button>
                  <button
                    onClick={() => setActiveTab('trade')}
                    className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
                  >
                    Trade
                  </button>
                  <button
                    onClick={() => setActiveTab('withdraw')}
                    className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                  >
                    Withdraw
                  </button>
                </div>
              </div>
            </div>
          )}
          
          {activeTab === 'positions' && (
            <PositionsTable positions={subaccount.perpPositions} />
          )}
          
          {activeTab === 'orders' && (
            <OrdersTable orders={subaccount.openOrders} />
          )}
          
          {activeTab === 'deposit' && (
            <DepositWithdrawForm />
          )}
          
          {activeTab === 'trade' && (
            <OrderForm />
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}