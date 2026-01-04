import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useAccount } from 'wagmi';
import { useAppStore } from '../store/useAppStore';
import { getStrategies, updateStrategyStatus } from '../services/dataFetcher';
import { ChartBarIcon, CheckCircleIcon, XCircleIcon } from '@heroicons/react/24/outline';

export default function Strategies() {
  const { isConnected } = useAccount();
  const { strategies, setStrategies } = useAppStore();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (isConnected) {
      fetchStrategies();
      const interval = setInterval(fetchStrategies, 30000);
      return () => clearInterval(interval);
    }
  }, [isConnected]);

  const fetchStrategies = async () => {
    try {
      setLoading(true);
      const data = await getStrategies();
      setStrategies(data);
      setError(null);
    } catch (err) {
      console.error('Failed to fetch strategies:', err);
      setError('Failed to load strategies. Backend may be offline.');
    } finally {
      setLoading(false);
    }
  };

  const toggleStrategy = async (strategyId, currentStatus) => {
    try {
      await updateStrategyStatus(strategyId, !currentStatus);
      await fetchStrategies();
    } catch (err) {
      console.error('Failed to update strategy:', err);
    }
  };

  if (!isConnected) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center">
          <h2 className="text-2xl font-bold mb-4" style={{ color: '#F2EBDD' }}>Connect Your Wallet</h2>
          <p className="text-gray-400">Please connect your wallet to view strategies</p>
        </motion.div>
      </div>
    );
  }

  if (loading && strategies.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-t-transparent rounded-full animate-spin mx-auto mb-4"
            style={{ borderColor: '#C9B27A', borderTopColor: 'transparent' }}></div>
          <p style={{ color: '#F2EBDD' }}>Loading strategies...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen content-wrapper">
      <div className="px-4 md:px-6 lg:px-8 py-8 md:py-12">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-12">
          <p className="label-gold mb-4">TRADING ALGORITHMS</p>
          <h1 className="text-4xl md:text-5xl font-bold tracking-wide" style={{ color: '#FAFAFA' }}>Strategies</h1>
        </motion.div>

        {error && (
          <div className="mb-8 p-4 rounded-lg bg-red-900/20 border border-red-500/30">
            <p style={{ color: '#ff6b6b' }}>{error}</p>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {strategies.map((strategy, index) => (
            <StrategyCard 
              key={strategy.id} 
              strategy={strategy} 
              index={index}
              onToggle={toggleStrategy}
            />
          ))}
        </div>

        {strategies.length === 0 && !loading && (
          <div className="text-center py-12">
            <ChartBarIcon className="w-16 h-16 mx-auto mb-4" style={{ color: '#666' }} />
            <p style={{ color: '#999' }}>No strategies available</p>
          </div>
        )}
      </div>
    </div>
  );
}

function StrategyCard({ strategy, index, onToggle }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
      className="p-6 rounded-lg"
      style={{ backgroundColor: '#111111', border: '1px solid #202020' }}
    >
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="text-xl font-bold mb-2" style={{ color: '#F2EBDD' }}>{strategy.name}</h3>
          <p className="text-sm" style={{ color: '#666' }}>
            Active since {new Date(strategy.activeSince).toLocaleDateString()}
          </p>
        </div>
        <button
          onClick={() => onToggle(strategy.id, strategy.enabled)}
          className={`p-2 rounded-lg transition-all ${strategy.enabled ? 'bg-green-500/20' : 'bg-gray-500/20'}`}
        >
          {strategy.enabled ? (
            <CheckCircleIcon className="w-6 h-6 text-green-400" />
          ) : (
            <XCircleIcon className="w-6 h-6 text-gray-400" />
          )}
        </button>
      </div>

      {strategy.description && (
        <p className="text-sm mb-6" style={{ color: '#999' }}>{strategy.description}</p>
      )}

      <div className="grid grid-cols-2 gap-4">
        <div className="p-4 rounded-lg" style={{ backgroundColor: '#0a0a0a' }}>
          <p className="text-xs mb-1" style={{ color: '#666' }}>Win Rate</p>
          <p className="text-lg font-bold" style={{ color: '#FAFAFA' }}>
            {strategy.winRate.toFixed(1)}%
          </p>
        </div>

        <div className="p-4 rounded-lg" style={{ backgroundColor: '#0a0a0a' }}>
          <p className="text-xs mb-1" style={{ color: '#666' }}>PnL Contribution</p>
          <p className={`text-lg font-bold ${strategy.pnlContribution >= 0 ? 'text-green-400' : 'text-red-400'}`}>
            ${strategy.pnlContribution.toFixed(2)}
          </p>
        </div>
      </div>

      <div className="mt-4 pt-4" style={{ borderTop: '1px solid #202020' }}>
        <div className="flex items-center justify-between text-xs" style={{ color: '#666' }}>
          <span>Status</span>
          <span className={strategy.enabled ? 'text-green-400' : 'text-gray-400'}>
            {strategy.enabled ? 'ACTIVE' : 'INACTIVE'}
          </span>
        </div>
      </div>
    </motion.div>
  );
}
