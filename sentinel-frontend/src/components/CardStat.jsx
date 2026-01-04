import { motion } from 'framer-motion';

export default function CardStat({ title, value, change, delay = 0 }) {
  const isPositive = change >= 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8, delay }}
      className="card-luxury double-border p-6 md:p-8 content-wrapper min-w-0"
    >
      <div className="space-y-4 md:space-y-6">
        <p className="label-gold">{title}</p>
        <p
          className="font-bold tracking-tight break-words"
          style={{
            color: '#F2EBDD',
            fontSize: 'clamp(2rem, 4vw, 3.75rem)',
            lineHeight: '1.1',
            wordBreak: 'break-word',
            overflowWrap: 'break-word'
          }}
        >
          {value}
        </p>
        {change !== undefined && (
          <div className="flex items-center space-x-2">
            <div className="w-6 md:w-8 h-px" style={{ backgroundColor: isPositive ? '#C9B27A' : '#6B6B6B' }}></div>
            <p className="text-xs md:text-sm tracking-wide" style={{ color: isPositive ? '#C9B27A' : '#9B9B9B' }}>
              {isPositive ? '+' : ''}{change}%
            </p>
          </div>
        )}
      </div>
    </motion.div>
  );
}
