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
      <div className="p-4 text-center text-gray-500">
        No subaccounts found
      </div>
    );
  }

  // Only show the first 8 subaccounts
  const displayedSubaccounts = subaccounts.slice(0, 8);
  
  return (
    <div className="space-y-2">
      {displayedSubaccounts.map((subaccount, index) => (
        <motion.button
          key={subaccount.userAccount.id}
          onClick={() => onSelect(index)}
          className={`w-full text-left p-3 rounded-lg transition ${
            selectedIndex === index
              ? 'bg-indigo-100 border-l-4 border-indigo-600'
              : 'bg-gray-50 hover:bg-gray-100'
          }`}
        >
          <div className="font-medium">
            Subaccount {index}
          </div>
          <div className="text-sm text-gray-700">
            Balance: ${subaccount.balance.toFixed(2)}
          </div>
          <div className="text-xs text-gray-500">
            {subaccount.perpPositions.length} positions • {subaccount.openOrders.length} orders
          </div>
        </motion.button>
      ))}
      {subaccounts.length > 8 && (
        <div className="text-sm text-center text-gray-500 pt-2">
          Showing 8 of {subaccounts.length} subaccounts
        </div>
      )}
    </div>
  );
}