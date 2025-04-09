// components/Header.tsx
import { motion } from 'framer-motion';
import Link from 'next/link';
import { useRouter } from 'next/router';

export default function Header() {
  const router = useRouter();
  
  return (
    <header className="bg-white shadow-md">
      <div className="container mx-auto px-4 py-4">
        <div className="flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <motion.div
              whileHover={{ rotate: 10, scale: 1.1 }}
              transition={{ duration: 0.3 }}
            >
              <svg className="w-8 h-8 text-indigo-600" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"></path>
              </svg>
            </motion.div>
            <h1 className="text-2xl font-bold text-gray-800">Drift</h1>
          </div>
          
          <nav className="hidden md:flex items-center space-x-4">
            <Link 
              href="/" 
              className={`px-3 py-2 ${router.pathname === '/' ? 'border-b-2 border-indigo-600 text-indigo-600' : 'text-gray-600'}`}
            >
              Subaccounts
            </Link>
            <Link 
              href="/wallet" 
              className={`px-3 py-2 ${router.pathname === '/wallet' ? 'border-b-2 border-indigo-600 text-indigo-600' : 'text-gray-600'}`}
            >
              Wallet
            </Link>
            <Link 
              href="/integrations" 
              className={`px-3 py-2 ${router.pathname === '/integrations' ? 'border-b-2 border-indigo-600 text-indigo-600' : 'text-gray-600'}`}
            >
              Integrations
            </Link>
          </nav>
          
          <div className="relative">
            <input
              type="text"
              placeholder="Search..."
              className="px-4 py-2 pl-10 bg-gray-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-600"
            />
            <svg 
              className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={2} 
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" 
              />
            </svg>
          </div>
        </div>
      </div>
    </header>
  );
}
