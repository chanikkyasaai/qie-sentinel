import { motion } from 'framer-motion';

export default function ActivityFeed({ activities }) {
  return (
    <div className="bg-neutral-900 border border-neutral-800 p-8">
      <h3 className="text-xs uppercase tracking-widest font-medium text-neutral-500 mb-8">
        Recent Activity
      </h3>

      <div className="space-y-1 max-h-96 overflow-y-auto custom-scrollbar">
        {activities.map((activity, index) => (
          <motion.div
            key={activity.id}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.4, delay: index * 0.05 }}
            className="flex items-center justify-between py-4 border-b border-neutral-800 last:border-0 hover:opacity-60 transition-opacity duration-300"
          >
            <div className="flex-1">
              <p className="text-white text-sm font-medium tracking-wide">{activity.action}</p>
              <div className="flex items-center space-x-3 mt-1">
                <span className="text-xs text-neutral-500">{activity.pair}</span>
                <span className="text-xs text-neutral-700">•</span>
                <span className="text-xs text-neutral-500">{activity.time}</span>
              </div>
            </div>

            {activity.profit !== null && (
              <div className="text-white font-medium text-sm">
                {activity.profit >= 0 ? '+' : ''}${activity.profit.toFixed(2)}
              </div>
            )}
          </motion.div>
        ))}
      </div>
    </div>
  );
}
