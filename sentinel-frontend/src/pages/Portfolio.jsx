import { motion } from 'framer-motion';
import TokenList from '../components/TokenList';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { portfolioData } from '../data/dummyData';

const COLORS = ['#06b6d4', '#3b82f6', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981'];

export default function Portfolio() {
  const totalValue = portfolioData.reduce((sum, token) => sum + token.value, 0);

  const pieData = portfolioData.map((token, index) => ({
    name: token.symbol,
    value: token.allocation,
    realValue: token.value
  }));

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-slate-900/95 backdrop-blur-xl border border-cyan-500/30 rounded-xl p-3 shadow-xl">
          <p className="text-white font-bold">{payload[0].name}</p>
          <p className="text-cyan-400">
            ${payload[0].payload.realValue.toLocaleString()}
          </p>
          <p className="text-slate-400 text-sm">
            {payload[0].value}% of portfolio
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="p-6 space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <h1 className="text-4xl font-bold text-white mb-2">Portfolio</h1>
        <p className="text-slate-400">Manage your crypto assets and track performance.</p>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="rounded-2xl bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-xl border border-cyan-500/20 p-6 shadow-xl"
        >
          <h3 className="text-slate-400 text-sm mb-2">Total Portfolio Value</h3>
          <p className="text-4xl font-bold text-white mb-2">
            ${totalValue.toLocaleString()}
          </p>
          <p className="text-green-400 font-semibold flex items-center">
            +12.5% (24h)
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="rounded-2xl bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-xl border border-cyan-500/20 p-6 shadow-xl"
        >
          <h3 className="text-slate-400 text-sm mb-2">24h Change</h3>
          <p className="text-4xl font-bold text-green-400 mb-2">
            +$3,245
          </p>
          <p className="text-slate-400 font-semibold">
            Across {portfolioData.length} assets
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="rounded-2xl bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-xl border border-cyan-500/20 p-6 shadow-xl"
        >
          <h3 className="text-slate-400 text-sm mb-2">Best Performer</h3>
          <p className="text-4xl font-bold text-white mb-2">
            AVAX
          </p>
          <p className="text-green-400 font-semibold">
            +7.89% (24h)
          </p>
        </motion.div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
          >
            <h2 className="text-2xl font-bold text-white mb-4">Your Assets</h2>
            <TokenList tokens={portfolioData} />
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.5 }}
          className="rounded-2xl bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-xl border border-cyan-500/20 p-6 shadow-xl"
        >
          <h3 className="text-xl font-bold text-white mb-6">Portfolio Allocation</h3>

          <div className="h-80 flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={2}
                  dataKey="value"
                  animationDuration={1000}
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="space-y-3 mt-6">
            {portfolioData.map((token, index) => (
              <div key={token.id} className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: COLORS[index % COLORS.length] }}
                  />
                  <span className="text-slate-300 text-sm font-medium">{token.symbol}</span>
                </div>
                <span className="text-white font-semibold">{token.allocation}%</span>
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.6 }}
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
      >
        <div className="rounded-2xl bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-xl border border-cyan-500/20 p-6 shadow-xl">
          <h3 className="text-slate-400 text-sm mb-2">Largest Position</h3>
          <p className="text-2xl font-bold text-white">BTC</p>
          <p className="text-cyan-400 font-semibold">42.5% of portfolio</p>
        </div>

        <div className="rounded-2xl bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-xl border border-cyan-500/20 p-6 shadow-xl">
          <h3 className="text-slate-400 text-sm mb-2">Smallest Position</h3>
          <p className="text-2xl font-bold text-white">LINK</p>
          <p className="text-cyan-400 font-semibold">4.1% of portfolio</p>
        </div>

        <div className="rounded-2xl bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-xl border border-cyan-500/20 p-6 shadow-xl">
          <h3 className="text-slate-400 text-sm mb-2">Biggest Gainer</h3>
          <p className="text-2xl font-bold text-white">AVAX</p>
          <p className="text-green-400 font-semibold">+7.89% (24h)</p>
        </div>

        <div className="rounded-2xl bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-xl border border-cyan-500/20 p-6 shadow-xl">
          <h3 className="text-slate-400 text-sm mb-2">Biggest Loser</h3>
          <p className="text-2xl font-bold text-white">SOL</p>
          <p className="text-red-400 font-semibold">-2.15% (24h)</p>
        </div>
      </motion.div>
    </div>
  );
}
