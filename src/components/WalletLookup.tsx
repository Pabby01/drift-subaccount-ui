// components/WalletLookup.tsx
interface WalletLookupProps {
    value: string;
    onChange: (value: string) => void;
    onSubmit: (value: string) => void;
  }
  
  export default function WalletLookup({ value, onChange, onSubmit }: WalletLookupProps) {
    const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      onSubmit(value);
    };
    
    return (
      <form onSubmit={handleSubmit}>
        <h3 className="text-lg font-medium mb-2">Look up a wallet</h3>
        <div className="flex">
          <input
            type="text"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder="Enter wallet address"
            className="flex-1 px-4 py-2 border border-gray-300 rounded-l-lg focus:outline-none focus:ring-2 focus:ring-indigo-600"
          />
          <button
             type="submit"
             className="px-4 py-2 bg-indigo-600 text-white rounded-r-lg hover:bg-indigo-700"
           >
             Look up
           </button>
         </div>
       </form>
     );
   }
            