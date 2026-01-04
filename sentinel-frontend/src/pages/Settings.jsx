import { useState } from 'react';
import { motion } from 'framer-motion';
import { UserCircleIcon, ShieldCheckIcon, BellIcon, CpuChipIcon } from '@heroicons/react/24/outline';

export default function Settings() {
  const [riskLevel, setRiskLevel] = useState(42);
  const [maxDrawdown, setMaxDrawdown] = useState(10);
  const [positionSize, setPositionSize] = useState(5);

  return (
    <div className="p-6 space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <h1 className="text-4xl font-bold text-white mb-2">Settings</h1>
        <p className="text-slate-400">Configure your trading preferences and account settings.</p>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="lg:col-span-2 space-y-6"
        >
          <div className="rounded-2xl bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-xl border border-cyan-500/20 p-6 shadow-xl">
            <h2 className="text-2xl font-bold text-white mb-6 flex items-center">
              <CpuChipIcon className="w-6 h-6 mr-3 text-cyan-400" />
              Trading Parameters
            </h2>

            <div className="space-y-6">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <label className="text-slate-300 font-medium">Risk Level</label>
                  <span className="text-cyan-400 font-bold text-lg">{riskLevel}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={riskLevel}
                  onChange={(e) => setRiskLevel(e.target.value)}
                  className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer slider"
                  style={{
                    background: `linear-gradient(to right, #06b6d4 0%, #06b6d4 ${riskLevel}%, #334155 ${riskLevel}%, #334155 100%)`
                  }}
                />
                <div className="flex justify-between text-xs text-slate-500 mt-2">
                  <span>Conservative</span>
                  <span>Moderate</span>
                  <span>Aggressive</span>
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-3">
                  <label className="text-slate-300 font-medium">Max Drawdown Limit</label>
                  <span className="text-cyan-400 font-bold text-lg">{maxDrawdown}%</span>
                </div>
                <input
                  type="range"
                  min="5"
                  max="25"
                  value={maxDrawdown}
                  onChange={(e) => setMaxDrawdown(e.target.value)}
                  className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer"
                  style={{
                    background: `linear-gradient(to right, #06b6d4 0%, #06b6d4 ${((maxDrawdown - 5) / 20) * 100}%, #334155 ${((maxDrawdown - 5) / 20) * 100}%, #334155 100%)`
                  }}
                />
                <p className="text-slate-500 text-sm mt-2">
                  Trading will pause if portfolio drawdown exceeds this limit
                </p>
              </div>

              <div>
                <div className="flex items-center justify-between mb-3">
                  <label className="text-slate-300 font-medium">Position Size</label>
                  <span className="text-cyan-400 font-bold text-lg">{positionSize}%</span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="20"
                  value={positionSize}
                  onChange={(e) => setPositionSize(e.target.value)}
                  className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer"
                  style={{
                    background: `linear-gradient(to right, #06b6d4 0%, #06b6d4 ${((positionSize - 1) / 19) * 100}%, #334155 ${((positionSize - 1) / 19) * 100}%, #334155 100%)`
                  }}
                />
                <p className="text-slate-500 text-sm mt-2">
                  Percentage of portfolio to allocate per trade
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-2xl bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-xl border border-cyan-500/20 p-6 shadow-xl">
            <h2 className="text-2xl font-bold text-white mb-6 flex items-center">
              <ShieldCheckIcon className="w-6 h-6 mr-3 text-cyan-400" />
              Strategy Settings
            </h2>

            <div className="space-y-4">
              {[
                { name: 'Momentum Surge', enabled: true },
                { name: 'Breakout Hunter', enabled: true },
                { name: 'Mean Reversion', enabled: true },
                { name: 'Scalper Pro', enabled: false },
                { name: 'Trend Following', enabled: true }
              ].map((strategy, index) => (
                <div
                  key={strategy.name}
                  className="flex items-center justify-between p-4 rounded-xl bg-slate-800/30 border border-slate-700/30 hover:border-cyan-500/30 transition-all duration-300"
                >
                  <div className="flex items-center space-x-3">
                    <div className={`w-3 h-3 rounded-full ${strategy.enabled ? 'bg-green-400' : 'bg-slate-600'}`} />
                    <span className="text-slate-300 font-medium">{strategy.name}</span>
                  </div>
                  <button
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-300 ${
                      strategy.enabled ? 'bg-cyan-500' : 'bg-slate-600'
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform duration-300 ${
                        strategy.enabled ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-2xl bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-xl border border-cyan-500/20 p-6 shadow-xl">
            <h2 className="text-2xl font-bold text-white mb-6 flex items-center">
              <BellIcon className="w-6 h-6 mr-3 text-cyan-400" />
              Notification Preferences
            </h2>

            <div className="space-y-4">
              {[
                'Email notifications for trades',
                'Push notifications for alerts',
                'Daily performance summary',
                'Weekly strategy reports',
                'Emergency stop-loss alerts'
              ].map((setting, index) => (
                <div
                  key={setting}
                  className="flex items-center justify-between p-4 rounded-xl bg-slate-800/30 border border-slate-700/30"
                >
                  <span className="text-slate-300">{setting}</span>
                  <button className="relative inline-flex h-6 w-11 items-center rounded-full bg-cyan-500">
                    <span className="inline-block h-4 w-4 transform rounded-full bg-white translate-x-6" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="space-y-6"
        >
          <div className="rounded-2xl bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-xl border border-cyan-500/20 p-6 shadow-xl">
            <h2 className="text-2xl font-bold text-white mb-6 flex items-center">
              <UserCircleIcon className="w-6 h-6 mr-3 text-cyan-400" />
              Profile
            </h2>

            <div className="flex flex-col items-center mb-6">
              <div className="w-24 h-24 rounded-full bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center shadow-lg shadow-cyan-500/30 mb-4">
                <UserCircleIcon className="w-16 h-16 text-white" />
              </div>
              <button className="px-4 py-2 rounded-xl bg-cyan-500/20 text-cyan-400 text-sm font-medium hover:bg-cyan-500/30 transition-colors">
                Change Avatar
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-slate-400 text-sm mb-2 block">Full Name</label>
                <input
                  type="text"
                  defaultValue="Admin User"
                  className="w-full px-4 py-3 rounded-xl bg-slate-800/50 border border-slate-700 text-white focus:outline-none focus:ring-2 focus:ring-cyan-500/50 transition-all"
                />
              </div>

              <div>
                <label className="text-slate-400 text-sm mb-2 block">Email</label>
                <input
                  type="email"
                  defaultValue="admin@qie.ai"
                  className="w-full px-4 py-3 rounded-xl bg-slate-800/50 border border-slate-700 text-white focus:outline-none focus:ring-2 focus:ring-cyan-500/50 transition-all"
                />
              </div>

              <div>
                <label className="text-slate-400 text-sm mb-2 block">Account Type</label>
                <div className="px-4 py-3 rounded-xl bg-slate-800/50 border border-slate-700">
                  <span className="text-cyan-400 font-semibold">Premium</span>
                </div>
              </div>

              <div>
                <label className="text-slate-400 text-sm mb-2 block">Member Since</label>
                <div className="px-4 py-3 rounded-xl bg-slate-800/50 border border-slate-700">
                  <span className="text-white">January 2024</span>
                </div>
              </div>
            </div>

            <button className="w-full mt-6 px-6 py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-semibold hover:shadow-lg hover:shadow-cyan-500/50 transition-all duration-300">
              Save Changes
            </button>
          </div>

          <div className="rounded-2xl bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-xl border border-cyan-500/20 p-6 shadow-xl">
            <h3 className="text-xl font-bold text-white mb-4">API Keys</h3>
            <p className="text-slate-400 text-sm mb-4">
              Connect your exchange accounts to enable automated trading.
            </p>
            <button className="w-full px-6 py-3 rounded-xl bg-slate-800/50 border border-slate-700 text-cyan-400 font-semibold hover:bg-slate-800 transition-colors">
              Manage API Keys
            </button>
          </div>

          <div className="rounded-2xl bg-gradient-to-br from-red-500/10 to-red-600/10 border border-red-500/30 p-6 shadow-xl">
            <h3 className="text-xl font-bold text-white mb-4">Danger Zone</h3>
            <p className="text-slate-400 text-sm mb-4">
              Irreversible and destructive actions.
            </p>
            <button className="w-full px-6 py-3 rounded-xl bg-red-500/20 border border-red-500/30 text-red-400 font-semibold hover:bg-red-500/30 transition-colors">
              Close Account
            </button>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
