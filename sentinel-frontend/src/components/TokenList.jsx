import { motion } from 'framer-motion';
import { LineChart, Line, ResponsiveContainer } from 'recharts';
import { ArrowUpIcon, ArrowDownIcon } from '@heroicons/react/24/solid';

export default function TokenList({ tokens }) {
  return (
    <div className="rounded-2xl bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-xl border border-cyan-500/20 shadow-xl overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-slate-700/50">
              <th className="px-6 py-4 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Asset
              </th>
              <th className="px-6 py-4 text-right text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Balance
              </th>
              <th className="px-6 py-4 text-right text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Price
              </th>
              <th className="px-6 py-4 text-right text-xs font-semibold text-slate-400 uppercase tracking-wider">
                24h Change
              </th>
              <th className="px-6 py-4 text-right text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Value
              </th>
              <th className="px-6 py-4 text-right text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Allocation
              </th>
              <th className="px-6 py-4 text-right text-xs font-semibold text-slate-400 uppercase tracking-wider">
                7D Chart
              </th>
            </tr>
          </thead>
          <tbody>
            {tokens.map((token, index) => (
              <motion.tr
                key={token.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3, delay: index * 0.05 }}
                className="border-b border-slate-700/30 hover:bg-cyan-500/5 transition-colors group"
              >
                <td className="px-6 py-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center text-white font-bold shadow-lg shadow-cyan-500/20">
                      {token.symbol.substring(0, 2)}
                    </div>
                    <div>
                      <p className="text-white font-semibold">{token.symbol}</p>
                      <p className="text-slate-400 text-sm">{token.name}</p>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 text-right text-white font-medium">
                  {token.balance.toFixed(4)}
                </td>
                <td className="px-6 py-4 text-right text-white font-medium">
                  ${token.price.toLocaleString()}
                </td>
                <td className="px-6 py-4 text-right">
                  <div className={`inline-flex items-center space-x-1 px-3 py-1 rounded-full ${
                    token.change24h >= 0 ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
                  }`}>
                    {token.change24h >= 0 ? (
                      <ArrowUpIcon className="w-3 h-3" />
                    ) : (
                      <ArrowDownIcon className="w-3 h-3" />
                    )}
                    <span className="font-semibold text-sm">{Math.abs(token.change24h)}%</span>
                  </div>
                </td>
                <td className="px-6 py-4 text-right text-white font-bold">
                  ${token.value.toLocaleString()}
                </td>
                <td className="px-6 py-4 text-right">
                  <div className="flex items-center justify-end space-x-2">
                    <div className="w-20 h-2 bg-slate-700 rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${token.allocation}%` }}
                        transition={{ duration: 1, delay: index * 0.1 }}
                        className="h-full bg-gradient-to-r from-cyan-500 to-blue-500"
                      />
                    </div>
                    <span className="text-cyan-400 font-medium text-sm w-12">
                      {token.allocation}%
                    </span>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="w-24 h-12">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={token.sparkline.map((v, i) => ({ value: v, index: i }))}>
                        <Line
                          type="monotone"
                          dataKey="value"
                          stroke={token.change24h >= 0 ? '#10b981' : '#ef4444'}
                          strokeWidth={2}
                          dot={false}
                        />
                      </LineChart>
                    </ResponsiveContainer>
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
