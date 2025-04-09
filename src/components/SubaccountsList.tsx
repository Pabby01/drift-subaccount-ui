// components/SubaccountsList.tsx
import { motion } from 'framer-motion';
import { Position, Order } from '../types';

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

interface SubaccountsListProps {
  subaccounts: SubaccountData[];
  selectedIndex: number;
  onSelect: (index: number) => void;
}

export default function SubaccountsList({
  subaccounts,
  selectedIndex,
  onSelect
}: SubaccountsListProps) {
  if (subaccounts.length === 0) {
    return (
      <div className="text-center py-4">
        <p className="text-gray-500">No subaccounts found</p>
      </div>
    );
  }
  
  return (
    <ul className="space-y-2">
      {subaccounts.map((subaccount, index) => (
        <motion.li
          key={index}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          <button
            onClick={() => onSelect(index)}
            className={`w-full text-left p-3 rounded-lg transition ${
              selectedIndex === index 
                ? 'bg-indigo-100 border-l-4 border-indigo-600'
                : 'bg-gray-50 hover:bg-gray-100'
            }`}
          >
            <div className="font-medium">Subaccount {index}</div>
            <div className="text-sm text-gray-600 mt-1">
              Balance: ${subaccount.balance.toFixed(2)}
            </div>
            <div className="text-xs text-gray-500 mt-1">
              {subaccount.perpPositions.length} positions • {subaccount.openOrders.length} orders
            </div>
          </button>
        </motion.li>
      ))}
    </ul>
  );
}