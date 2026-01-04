import { motion, AnimatePresence } from 'framer-motion';
import { NavLink } from 'react-router-dom';
import { XMarkIcon } from '@heroicons/react/24/outline';

const menuItems = [
  { name: 'Dashboard', path: '/dashboard' },
  { name: 'Portfolio', path: '/portfolio' },
  { name: 'Strategies', path: '/strategies' },
  { name: 'Trades', path: '/trades' },
  { name: 'Alerts', path: '/alerts' },
  { name: 'Analytics', path: '/analytics' },
  { name: 'Settings', path: '/settings' }
];

export default function Sidebar({ isOpen, toggleSidebar }) {
  return (
    <>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 z-40 lg:hidden"
            onClick={toggleSidebar}
          />
        )}
      </AnimatePresence>

      <motion.aside
        initial={{ x: -300 }}
        animate={{ x: isOpen ? 0 : -300 }}
        transition={{ duration: 0.3, ease: 'easeInOut' }}
        className="fixed left-0 top-0 bottom-0 w-48 bg-black border-r z-50 lg:translate-x-0 lg:static content-wrapper"
        style={{ borderColor: '#202020' }}
      >
        <div className="flex flex-col h-full">
          <div className="flex items-center justify-between px-4 py-6 border-b" style={{ borderColor: '#202020' }}>
            <h2 className="font-bold text-lg tracking-wider" style={{ color: '#F2EBDD' }}>QIE SENTINEL</h2>
            <button
              onClick={toggleSidebar}
              className="lg:hidden transition-opacity hover:opacity-60"
              style={{ color: '#F2EBDD' }}
            >
              <XMarkIcon className="w-5 h-5" />
            </button>
          </div>

          <nav className="flex-1 px-4 py-8 overflow-y-auto" style={{ marginTop: '16px' }}>
            <div className="space-y-6">
              {menuItems.map((item, index) => (
                <motion.div
                  key={item.path}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.6, delay: index * 0.08 }}
                >
                  <NavLink
                    to={item.path}
                    onClick={() => window.innerWidth < 1024 && toggleSidebar()}
                    className={({ isActive }) =>
                      `relative flex items-center py-2 text-sm uppercase tracking-widest transition-all duration-600 ${
                        isActive
                          ? 'font-medium'
                          : ''
                      }`
                    }
                    style={({ isActive }) => ({
                      color: isActive ? '#F2EBDD' : '#6B6B6B',
                      backgroundColor: isActive ? '#0B0B0B' : 'transparent',
                      paddingLeft: isActive ? '16px' : '0',
                      borderLeft: isActive ? '2px solid #C9B27A' : '2px solid transparent'
                    })}
                  >
                    {({ isActive }) => (
                      <>
                        {item.name}
                        {isActive && (
                          <motion.span
                            layoutId="goldDot"
                            className="absolute right-0 w-1.5 h-1.5 rounded-full"
                            style={{ backgroundColor: '#C9B27A' }}
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ duration: 0.3 }}
                          />
                        )}
                      </>
                    )}
                  </NavLink>
                </motion.div>
              ))}
            </div>
          </nav>

          <div className="px-6 md:px-8 py-6 md:py-8 border-t" style={{ borderColor: '#202020' }}>
            <div className="space-y-2 md:space-y-3">
              <p className="label-gold">Portfolio Value</p>
              <p
                className="font-bold tracking-tight"
                style={{
                  color: '#FAFAFA',
                  fontSize: 'clamp(1.875rem, 4vw, 2.25rem)'
                }}
              >
                $256,063
              </p>
              <p className="text-xs tracking-wide" style={{ color: '#C9B27A' }}>+12.5%</p>
            </div>
          </div>
        </div>
      </motion.aside>
    </>
  );
}
