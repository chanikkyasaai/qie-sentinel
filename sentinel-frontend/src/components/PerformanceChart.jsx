import { motion } from 'framer-motion';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export default function PerformanceChart({ data }) {
  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-black border border-white p-4">
          <p className="text-white font-bold text-sm">
            ${payload[0].value.toLocaleString()}
          </p>
          <p className="text-neutral-500 text-xs mt-1">
            {payload[0].payload.date}
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.6 }}
      className="bg-neutral-900 border border-neutral-800 p-8"
    >
      <div className="flex items-center justify-between mb-8">
        <h3 className="text-xs uppercase tracking-widest font-medium text-neutral-500">
          Portfolio Performance
        </h3>
        <div className="flex space-x-1">
          <button className="px-4 py-1 bg-white text-black text-xs uppercase tracking-wide font-medium">
            7D
          </button>
          <button className="px-4 py-1 border border-neutral-700 text-neutral-500 text-xs uppercase tracking-wide font-medium hover:opacity-60">
            1M
          </button>
          <button className="px-4 py-1 border border-neutral-700 text-neutral-500 text-xs uppercase tracking-wide font-medium hover:opacity-60">
            1Y
          </button>
        </div>
      </div>

      <div className="h-80">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="1 1" stroke="#262626" />
            <XAxis
              dataKey="date"
              stroke="#525252"
              style={{ fontSize: '10px', fontWeight: 500 }}
              tickLine={false}
            />
            <YAxis
              stroke="#525252"
              style={{ fontSize: '10px', fontWeight: 500 }}
              tickLine={false}
              tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
            />
            <Tooltip content={<CustomTooltip />} />
            <Line
              type="monotone"
              dataKey="value"
              stroke="#FFFFFF"
              strokeWidth={1}
              dot={false}
              animationDuration={800}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </motion.div>
  );
}
