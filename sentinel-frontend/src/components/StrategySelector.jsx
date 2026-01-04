import { motion } from 'framer-motion';

export default function StrategySelector({ strategies }) {
  return (
    <div className="bg-neutral-900 border border-neutral-800 p-8">
      <h3 className="text-xs uppercase tracking-widest font-medium text-neutral-500 mb-8">
        Strategies
      </h3>

      <div className="space-y-1">
        {strategies.map((strategy, index) => (
          <motion.div
            key={strategy.name}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.4, delay: index * 0.05 }}
            className="py-6 border-b border-neutral-800 last:border-0 hover:opacity-60 transition-opacity duration-300"
          >
            <div className="flex items-center justify-between mb-4">
              <div>
                <h4 className="text-white font-semibold tracking-wide">{strategy.name}</h4>
                <p className="text-neutral-500 text-xs mt-1 uppercase tracking-wide">
                  {strategy.active ? 'ACTIVE' : 'INACTIVE'} • {strategy.trades} TRADES
                </p>
              </div>
              <div className="text-right">
                <p className="text-white font-bold text-xl tracking-tight">
                  +${strategy.profit.toLocaleString()}
                </p>
              </div>
            </div>

            <div className="flex items-center justify-between text-xs">
              <span className="text-neutral-500 uppercase tracking-wide">
                Win Rate: {strategy.winRate}%
              </span>
              <button className="px-4 py-1 border border-neutral-700 text-neutral-400 uppercase tracking-wide hover:opacity-60 transition-opacity">
                {strategy.active ? 'Pause' : 'Activate'}
              </button>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
