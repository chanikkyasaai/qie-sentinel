import { motion } from 'framer-motion';
import { CheckCircleIcon, ClockIcon } from '@heroicons/react/24/solid';

export default function TradeTable({ trades }) {
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="rounded-2xl bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-xl border border-cyan-500/20 shadow-xl overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-slate-700/50">
              <th className="px-6 py-4 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">
                ID
              </th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Date
              </th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Pair
              </th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Type
              </th>
              <th className="px-6 py-4 text-right text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Entry
              </th>
              <th className="px-6 py-4 text-right text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Exit
              </th>
              <th className="px-6 py-4 text-right text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Amount
              </th>
              <th className="px-6 py-4 text-right text-xs font-semibold text-slate-400 uppercase tracking-wider">
                P/L
              </th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Strategy
              </th>
              <th className="px-6 py-4 text-center text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Status
              </th>
            </tr>
          </thead>
          <tbody>
            {trades.map((trade, index) => (
              <motion.tr
                key={trade.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3, delay: index * 0.03 }}
                className="border-b border-slate-700/30 hover:bg-cyan-500/5 transition-colors"
              >
                <td className="px-6 py-4">
                  <span className="text-cyan-400 font-mono text-sm">{trade.id}</span>
                </td>
                <td className="px-6 py-4">
                  <span className="text-slate-300 text-sm">{formatDate(trade.date)}</span>
                </td>
                <td className="px-6 py-4">
                  <span className="text-white font-semibold">{trade.pair}</span>
                </td>
                <td className="px-6 py-4">
                  <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                    trade.type === 'BUY'
                      ? 'bg-green-500/20 text-green-400'
                      : 'bg-red-500/20 text-red-400'
                  }`}>
                    {trade.type}
                  </span>
                </td>
                <td className="px-6 py-4 text-right text-white font-medium">
                  ${trade.entry.toLocaleString()}
                </td>
                <td className="px-6 py-4 text-right text-white font-medium">
                  {trade.exit ? `$${trade.exit.toLocaleString()}` : '-'}
                </td>
                <td className="px-6 py-4 text-right text-slate-300">
                  {trade.amount}
                </td>
                <td className="px-6 py-4 text-right">
                  <div className="flex flex-col items-end">
                    <span className={`font-bold ${
                      trade.pnl >= 0 ? 'text-green-400' : 'text-red-400'
                    }`}>
                      {trade.pnl >= 0 ? '+' : ''}${trade.pnl.toFixed(2)}
                    </span>
                    <span className={`text-xs ${
                      trade.pnl >= 0 ? 'text-green-400/70' : 'text-red-400/70'
                    }`}>
                      ({trade.pnlPercent >= 0 ? '+' : ''}{trade.pnlPercent}%)
                    </span>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <span className="text-slate-300 text-sm">{trade.strategy}</span>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center justify-center">
                    {trade.status === 'CLOSED' ? (
                      <span className="flex items-center space-x-1 text-slate-400">
                        <CheckCircleIcon className="w-4 h-4" />
                        <span className="text-xs">Closed</span>
                      </span>
                    ) : (
                      <span className="flex items-center space-x-1 text-cyan-400">
                        <ClockIcon className="w-4 h-4 animate-pulse" />
                        <span className="text-xs">Open</span>
                      </span>
                    )}
                  </div>
                </td>
              </motion.tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
