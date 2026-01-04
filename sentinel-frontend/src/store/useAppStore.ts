import { create } from 'zustand';

interface Trade {
  timestamp: string;
  symbol: string;
  side: 'BUY' | 'SELL';
  pnl: number;
  confidence: number;
  gasFee: number;
  slippage: number;
}

interface Strategy {
  id: number;
  name: string;
  activeSince: string;
  winRate: number;
  pnlContribution: number;
  enabled: boolean;
}

interface PerformanceMetrics {
  totalPnl: number;
  winRate: number;
  drawdown: number;
  volatility: number;
  sharpeRatio: number;
  dailyReturns: number;
  weeklyReturns: number;
  totalVolume: number;
  tradeCount: number;
}

interface Portfolio {
  tokens: Array<{
    symbol: string;
    balance: string;
    valueUsd: number;
  }>;
  totalValue: number;
}

interface AppState {
  // Wallet
  walletAddress: string | null;
  setWalletAddress: (address: string | null) => void;

  // Portfolio
  portfolio: Portfolio | null;
  setPortfolio: (portfolio: Portfolio) => void;

  // Strategies
  strategies: Strategy[];
  setStrategies: (strategies: Strategy[]) => void;

  // Performance
  metrics: PerformanceMetrics | null;
  setMetrics: (metrics: PerformanceMetrics) => void;

  // Trades
  trades: Trade[];
  setTrades: (trades: Trade[]) => void;
  addTrade: (trade: Trade) => void;

  // Live signal
  liveSignal: any;
  setLiveSignal: (signal: any) => void;

  // Loading states
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;

  // Auto-refresh
  lastRefresh: number;
  setLastRefresh: (timestamp: number) => void;
}

export const useAppStore = create<AppState>((set) => ({
  // Wallet
  walletAddress: null,
  setWalletAddress: (address) => set({ walletAddress: address }),

  // Portfolio
  portfolio: null,
  setPortfolio: (portfolio) => set({ portfolio }),

  // Strategies
  strategies: [],
  setStrategies: (strategies) => set({ strategies }),

  // Performance
  metrics: null,
  setMetrics: (metrics) => set({ metrics }),

  // Trades
  trades: [],
  setTrades: (trades) => set({ trades }),
  addTrade: (trade) => set((state) => ({ trades: [trade, ...state.trades] })),

  // Live signal
  liveSignal: null,
  setLiveSignal: (signal) => set({ liveSignal: signal }),

  // Loading
  isLoading: false,
  setIsLoading: (loading) => set({ isLoading: loading }),

  // Refresh
  lastRefresh: Date.now(),
  setLastRefresh: (timestamp) => set({ lastRefresh: timestamp }),
}));
