import { motion } from 'framer-motion';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend
} from 'recharts';
import { equityCurveData, drawdownData, heatmapData } from '../data/dummyData';
import { ArrowTrendingUpIcon, ChartBarIcon, ArrowTrendingDownIcon } from '@heroicons/react/24/solid';

export default function Analytics() {
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-slate-900/95 backdrop-blur-xl border border-cyan-500/30 rounded-xl p-3 shadow-xl">
          <p className="text-slate-300 text-sm mb-1">Day {label}</p>
          {payload.map((entry, index) => (
            <p key={index} className="font-bold" style={{ color: entry.color }}>
              {entry.name}: ${entry.value.toLocaleString()}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  const HeatmapCell = ({ value }) => {
    const intensity = Math.abs(value) / 2500;
    const color = value >= 0
      ? `rgba(16, 185, 129, ${intensity})`
      : `rgba(239, 68, 68, ${intensity})`;

    return (
      <div
        className="h-16 rounded-lg flex items-center justify-center text-white font-semibold text-sm hover:scale-105 transition-transform cursor-pointer"
        style={{ backgroundColor: color, border: '1px solid rgba(255,255,255,0.1)' }}
      >
        ${value}
      </div>
    );
  };

  return (
    <div className="p-6 space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <h1 className="text-4xl font-bold text-white mb-2">Analytics</h1>
        <p className="text-slate-400">Deep insights into your trading performance and strategy effectiveness.</p>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="rounded-2xl bg-gradient-to-br from-green-500/10 to-green-600/10 border border-green-500/30 p-6 shadow-xl"
        >
          <div className="flex items-center justify-between mb-4">
            <ArrowTrendingUpIcon className="w-8 h-8 text-green-400" />
            <span className="px-3 py-1 rounded-full bg-green-500/20 text-green-400 text-xs font-bold">
              +24.5%
            </span>
          </div>
          <h3 className="text-slate-400 text-sm mb-2">Total Return</h3>
          <p className="text-4xl font-bold text-white">$58,945</p>
          <p className="text-green-400 text-sm mt-2">Since inception</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="rounded-2xl bg-gradient-to-br from-cyan-500/10 to-cyan-600/10 border border-cyan-500/30 p-6 shadow-xl"
        >
          <div className="flex items-center justify-between mb-4">
            <ChartBarIcon className="w-8 h-8 text-cyan-400" />
            <span className="px-3 py-1 rounded-full bg-cyan-500/20 text-cyan-400 text-xs font-bold">
              Excellent
            </span>
          </div>
          <h3 className="text-slate-400 text-sm mb-2">Sharpe Ratio</h3>
          <p className="text-4xl font-bold text-white">2.34</p>
          <p className="text-cyan-400 text-sm mt-2">Risk-adjusted returns</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="rounded-2xl bg-gradient-to-br from-red-500/10 to-red-600/10 border border-red-500/30 p-6 shadow-xl"
        >
          <div className="flex items-center justify-between mb-4">
            <ArrowTrendingDownIcon className="w-8 h-8 text-red-400" />
            <span className="px-3 py-1 rounded-full bg-red-500/20 text-red-400 text-xs font-bold">
              Low Risk
            </span>
          </div>
          <h3 className="text-slate-400 text-sm mb-2">Max Drawdown</h3>
          <p className="text-4xl font-bold text-white">-8.5%</p>
          <p className="text-red-400 text-sm mt-2">Lowest decline</p>
        </motion.div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.4 }}
        className="rounded-2xl bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-xl border border-cyan-500/20 p-6 shadow-xl"
      >
        <h2 className="text-2xl font-bold text-white mb-6">Equity Curve</h2>
        <div className="h-96">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={equityCurveData}>
              <defs>
                <linearGradient id="equityGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#06b6d4" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="benchmarkGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#64748b" stopOpacity={0.2}/>
                  <stop offset="95%" stopColor="#64748b" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.2} />
              <XAxis
                dataKey="day"
                stroke="#94a3b8"
                style={{ fontSize: '12px' }}
                tickLine={false}
                label={{ value: 'Days', position: 'insideBottom', offset: -5, fill: '#94a3b8' }}
              />
              <YAxis
                stroke="#94a3b8"
                style={{ fontSize: '12px' }}
                tickLine={false}
                tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend
                wrapperStyle={{ paddingTop: '20px' }}
                iconType="circle"
              />
              <Area
                type="monotone"
                dataKey="equity"
                name="Portfolio"
                stroke="#06b6d4"
                strokeWidth={3}
                fill="url(#equityGradient)"
                animationDuration={1500}
              />
              <Area
                type="monotone"
                dataKey="benchmark"
                name="Benchmark"
                stroke="#64748b"
                strokeWidth={2}
                strokeDasharray="5 5"
                fill="url(#benchmarkGradient)"
                animationDuration={1500}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.5 }}
          className="rounded-2xl bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-xl border border-cyan-500/20 p-6 shadow-xl"
        >
          <h2 className="text-2xl font-bold text-white mb-6">Drawdown Analysis</h2>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={drawdownData}>
                <defs>
                  <linearGradient id="drawdownGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.2} />
                <XAxis
                  dataKey="day"
                  stroke="#94a3b8"
                  style={{ fontSize: '12px' }}
                  tickLine={false}
                />
                <YAxis
                  stroke="#94a3b8"
                  style={{ fontSize: '12px' }}
                  tickLine={false}
                  tickFormatter={(value) => `${value.toFixed(1)}%`}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'rgba(15, 23, 42, 0.95)',
                    border: '1px solid rgba(6, 182, 212, 0.3)',
                    borderRadius: '12px'
                  }}
                  formatter={(value) => [`${value.toFixed(2)}%`, 'Drawdown']}
                  labelStyle={{ color: '#94a3b8' }}
                />
                <Area
                  type="monotone"
                  dataKey="drawdown"
                  stroke="#ef4444"
                  strokeWidth={2}
                  fill="url(#drawdownGradient)"
                  animationDuration={1500}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.6 }}
          className="rounded-2xl bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-xl border border-cyan-500/20 p-6 shadow-xl"
        >
          <h2 className="text-2xl font-bold text-white mb-6">Daily P/L Heatmap</h2>
          <div className="space-y-3">
            <div className="grid grid-cols-5 gap-2">
              <div></div>
              {['W1', 'W2', 'W3', 'W4'].map((week) => (
                <div key={week} className="text-center text-slate-400 text-sm font-medium">
                  {week}
                </div>
              ))}
            </div>
            {heatmapData.map((row) => (
              <div key={row.day} className="grid grid-cols-5 gap-2">
                <div className="flex items-center text-slate-400 text-sm font-medium">
                  {row.day}
                </div>
                <HeatmapCell value={row.week1} />
                <HeatmapCell value={row.week2} />
                <HeatmapCell value={row.week3} />
                <HeatmapCell value={row.week4} />
              </div>
            ))}
          </div>
          <div className="mt-6 flex items-center justify-center space-x-4">
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 rounded bg-red-500/50"></div>
              <span className="text-slate-400 text-sm">Loss</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 rounded bg-green-500/50"></div>
              <span className="text-slate-400 text-sm">Profit</span>
            </div>
          </div>
        </motion.div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.7 }}
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
      >
        <div className="rounded-2xl bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-xl border border-cyan-500/20 p-6 shadow-xl">
          <h3 className="text-slate-400 text-sm mb-2">Average Win</h3>
          <p className="text-3xl font-bold text-green-400">+$384.50</p>
          <p className="text-slate-500 text-sm mt-1">per winning trade</p>
        </div>

        <div className="rounded-2xl bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-xl border border-cyan-500/20 p-6 shadow-xl">
          <h3 className="text-slate-400 text-sm mb-2">Average Loss</h3>
          <p className="text-3xl font-bold text-red-400">-$172.30</p>
          <p className="text-slate-500 text-sm mt-1">per losing trade</p>
        </div>

        <div className="rounded-2xl bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-xl border border-cyan-500/20 p-6 shadow-xl">
          <h3 className="text-slate-400 text-sm mb-2">Profit Factor</h3>
          <p className="text-3xl font-bold text-cyan-400">2.23</p>
          <p className="text-slate-500 text-sm mt-1">ratio of wins/losses</p>
        </div>

        <div className="rounded-2xl bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-xl border border-cyan-500/20 p-6 shadow-xl">
          <h3 className="text-slate-400 text-sm mb-2">Recovery Factor</h3>
          <p className="text-3xl font-bold text-cyan-400">6.93</p>
          <p className="text-slate-500 text-sm mt-1">profit vs drawdown</p>
        </div>
      </motion.div>
    </div>
  );
}
