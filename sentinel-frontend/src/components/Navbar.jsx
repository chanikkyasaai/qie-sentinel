import { motion } from 'framer-motion';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { useAccount } from 'wagmi';
import { useEffect } from 'react';
import { useAppStore } from '../store/useAppStore';

export default function Navbar() {
  const { address } = useAccount();
  const setWalletAddress = useAppStore((state) => state.setWalletAddress);

  useEffect(() => {
    setWalletAddress(address || null);
  }, [address, setWalletAddress]);

  return (
    <motion.nav
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.8 }}
      className="sticky top-0 z-40 bg-black border-b content-wrapper"
      style={{ borderColor: '#202020' }}
    >
      <div className="px-4 md:px-6 lg:px-8 py-4 md:py-6 lg:py-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4 md:space-x-8">
            <div>
              <h1 className="font-bold text-lg md:text-xl tracking-wider" style={{ color: '#FAFAFA' }}>QIE SENTINEL</h1>
            </div>
          </div>

          <div className="flex items-center space-x-4 md:space-x-8 lg:space-x-12">
            <div className="hidden md:flex items-center space-x-2">
              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: '#C9B27A' }}></span>
              <p className="label-gold">LIVE</p>
            </div>

            <ConnectButton 
              showBalance={false}
              chainStatus="icon"
              accountStatus={{
                smallScreen: 'avatar',
                largeScreen: 'full',
              }}
            />
          </div>
        </div>
      </div>
    </motion.nav>
  );
}
