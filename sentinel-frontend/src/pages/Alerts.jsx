import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  CheckCircleIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon,
  XCircleIcon,
  BellAlertIcon
} from '@heroicons/react/24/solid';
import { alertsData } from '../data/dummyData';

const alertSettings = [
  { id: 1, label: 'Trade Execution Alerts', enabled: true },
  { id: 2, label: 'Price Movement Alerts', enabled: true },
  { id: 3, label: 'Stop Loss Notifications', enabled: true },
  { id: 4, label: 'Take Profit Alerts', enabled: true },
  { id: 5, label: 'Strategy Performance Updates', enabled: false },
  { id: 6, label: 'High Volatility Warnings', enabled: true },
  { id: 7, label: 'Risk Level Changes', enabled: false },
  { id: 8, label: 'Daily Summary Reports', enabled: true }
];

export default function Alerts() {
  const [settings, setSettings] = useState(alertSettings);

  const toggleSetting = (id) => {
    setSettings(settings.map(s =>
      s.id === id ? { ...s, enabled: !s.enabled } : s
    ));
  };

  const getAlertIcon = (type) => {
    switch (type) {
      case 'success': return CheckCircleIcon;
      case 'warning': return ExclamationTriangleIcon;
      case 'error': return XCircleIcon;
      case 'info': return InformationCircleIcon;
      default: return InformationCircleIcon;
    }
  };

  const getAlertColor = (type) => {
    switch (type) {
      case 'success': return { bg: 'from-green-500/20 to-green-600/20', border: 'border-green-500/30', icon: 'text-green-400', glow: 'shadow-green-500/20' };
      case 'warning': return { bg: 'from-yellow-500/20 to-orange-500/20', border: 'border-yellow-500/30', icon: 'text-yellow-400', glow: 'shadow-yellow-500/20' };
      case 'error': return { bg: 'from-red-500/20 to-red-600/20', border: 'border-red-500/30', icon: 'text-red-400', glow: 'shadow-red-500/20' };
      case 'info': return { bg: 'from-cyan-500/20 to-blue-500/20', border: 'border-cyan-500/30', icon: 'text-cyan-400', glow: 'shadow-cyan-500/20' };
      default: return { bg: 'from-slate-500/20 to-slate-600/20', border: 'border-slate-500/30', icon: 'text-slate-400', glow: 'shadow-slate-500/20' };
    }
  };

  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);

    if (diffMins < 60) return `${diffMins} mins ago`;
    if (diffHours < 24) return `${diffHours} hours ago`;
    return date.toLocaleDateString();
  };

  return (
    <div className="p-6 space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <h1 className="text-4xl font-bold text-white mb-2">Alerts & Notifications</h1>
        <p className="text-slate-400">Stay informed about your trading activity and system events.</p>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="rounded-2xl bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-xl border border-cyan-500/20 p-6 shadow-xl"
          >
            <h2 className="text-2xl font-bold text-white mb-6 flex items-center">
              <BellAlertIcon className="w-6 h-6 mr-3 text-cyan-400" />
              Recent Notifications
            </h2>

            <div className="space-y-3">
              {alertsData.map((alert, index) => {
                const Icon = getAlertIcon(alert.type);
                const colors = getAlertColor(alert.type);

                return (
                  <motion.div
                    key={alert.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.3, delay: index * 0.05 }}
                    className={`relative overflow-hidden rounded-xl bg-gradient-to-br ${colors.bg} backdrop-blur-xl border ${colors.border} p-6 shadow-lg ${colors.glow} hover:scale-[1.02] transition-all duration-300 group ${
                      !alert.read ? 'ring-2 ring-cyan-500/20' : ''
                    }`}
                  >
                    {!alert.read && (
                      <div className="absolute top-4 right-4 w-2 h-2 bg-cyan-400 rounded-full animate-pulse" />
                    )}

                    <div className="flex items-start space-x-4">
                      <div className={`p-3 rounded-xl bg-slate-900/50 ${colors.icon}`}>
                        <Icon className="w-6 h-6" />
                      </div>

                      <div className="flex-1">
                        <h3 className="text-white font-bold text-lg mb-1">{alert.title}</h3>
                        <p className="text-slate-300 mb-2">{alert.message}</p>
                        <p className="text-slate-500 text-sm">{formatTime(alert.timestamp)}</p>
                      </div>
                    </div>

                    <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-cyan-500 to-blue-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  </motion.div>
                );
              })}
            </div>
          </motion.div>
        </div>

        <div>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="rounded-2xl bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-xl border border-cyan-500/20 p-6 shadow-xl"
          >
            <h2 className="text-2xl font-bold text-white mb-6">Alert Settings</h2>

            <div className="space-y-4">
              {settings.map((setting, index) => (
                <motion.div
                  key={setting.id}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.05 }}
                  className="flex items-center justify-between p-4 rounded-xl bg-slate-800/30 border border-slate-700/30 hover:border-cyan-500/30 transition-all duration-300"
                >
                  <label htmlFor={`setting-${setting.id}`} className="text-slate-300 text-sm font-medium flex-1 cursor-pointer">
                    {setting.label}
                  </label>

                  <button
                    id={`setting-${setting.id}`}
                    onClick={() => toggleSetting(setting.id)}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-300 ${
                      setting.enabled ? 'bg-cyan-500' : 'bg-slate-600'
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform duration-300 ${
                        setting.enabled ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </motion.div>
              ))}
            </div>

            <button className="w-full mt-6 px-6 py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-semibold hover:shadow-lg hover:shadow-cyan-500/50 transition-all duration-300">
              Save Preferences
            </button>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="mt-6 rounded-2xl bg-gradient-to-br from-red-500/10 to-red-600/10 border border-red-500/30 p-6 shadow-xl"
          >
            <div className="flex items-start space-x-4">
              <ExclamationTriangleIcon className="w-8 h-8 text-red-400 flex-shrink-0" />
              <div>
                <h3 className="text-white font-bold text-lg mb-2">Risk Warning</h3>
                <p className="text-slate-300 text-sm leading-relaxed">
                  Current volatility levels are elevated. Consider reducing position sizes or enabling tighter stop-loss settings.
                </p>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
