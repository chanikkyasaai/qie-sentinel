import { http, createConfig } from 'wagmi';
import { defineChain } from 'viem';
import { injected } from 'wagmi/connectors';

// Define QIE Testnet chain
export const qieTestnet = defineChain({
  id: 1983,
  name: 'QIE Testnet',
  network: 'qie-testnet',
  nativeCurrency: {
    name: 'QIE',
    symbol: 'QIE',
    decimals: 18,
  },
  rpcUrls: {
    default: {
      http: ['https://rpc1testnet.qie.digital/']
    },
    public: {
      http: ['https://rpc1testnet.qie.digital/']
    }
  },
  blockExplorers: {
    default: {
      name: 'QIE Explorer',
      url: 'https://testnet.qie.digital/'
    }
  },
  testnet: true
});

// Wagmi configuration for wallet connection
export const wagmiConfig = createConfig({
  chains: [qieTestnet],
  connectors: [
    injected({ target: 'metaMask' })
  ],
  transports: {
    [qieTestnet.id]: http('https://rpc1testnet.qie.digital/')
  }
});

export const projectId = import.meta.env.VITE_WALLETCONNECT_PROJECT_ID || 'qie-sentinel-default';

