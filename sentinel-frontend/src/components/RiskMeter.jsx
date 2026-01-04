import { motion } from 'framer-motion';

export default function RiskMeter({ riskLevel = 42 }) {
  const getRiskLabel = (level) => {
    if (level < 30) return 'LOW RISK';
    if (level < 60) return 'MODERATE RISK';
    return 'HIGH RISK';
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.6 }}
      className="bg-neutral-900 border border-neutral-800 p-8"
    >
      <h3 className="text-xs uppercase tracking-widest font-medium text-neutral-500 mb-12">
        Risk Metrics
      </h3>

      <div className="mb-12">
        <p className="text-7xl font-bold text-white tracking-tight mb-2">{riskLevel}%</p>
        <p className="text-xs uppercase tracking-widest text-neutral-500">{getRiskLabel(riskLevel)}</p>
      </div>

      <div className="space-y-6">
        <div className="border-t border-neutral-800 pt-6">
          <p className="text-neutral-500 text-xs uppercase tracking-widest mb-2">Max Drawdown</p>
          <p className="text-white font-bold text-2xl tracking-tight">8.5%</p>
        </div>
        <div className="border-t border-neutral-800 pt-6">
          <p className="text-neutral-500 text-xs uppercase tracking-widest mb-2">Volatility</p>
          <p className="text-white font-bold text-2xl tracking-tight">12.3%</p>
        </div>
        <div className="border-t border-neutral-800 pt-6">
          <p className="text-neutral-500 text-xs uppercase tracking-widest mb-2">Sharpe Ratio</p>
          <p className="text-white font-bold text-2xl tracking-tight">2.34</p>
        </div>
        <div className="border-t border-neutral-800 pt-6">
          <p className="text-neutral-500 text-xs uppercase tracking-widest mb-2">Value at Risk</p>
          <p className="text-white font-bold text-2xl tracking-tight">5.2%</p>
        </div>
      </div>
    </motion.div>
  );
}
