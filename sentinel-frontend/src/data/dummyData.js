export const portfolioData = [
  {
    id: 1,
    symbol: 'BTC',
    name: 'Bitcoin',
    balance: 2.45,
    value: 108750.50,
    price: 44388.98,
    change24h: 3.24,
    allocation: 42.5,
    sparkline: [42000, 42500, 43200, 43800, 44100, 44388]
  },
  {
    id: 2,
    symbol: 'ETH',
    name: 'Ethereum',
    balance: 18.75,
    value: 47812.50,
    price: 2550.00,
    change24h: 5.67,
    allocation: 18.7,
    sparkline: [2400, 2450, 2480, 2520, 2540, 2550]
  },
  {
    id: 3,
    symbol: 'SOL',
    name: 'Solana',
    balance: 450.00,
    value: 40500.00,
    price: 90.00,
    change24h: -2.15,
    allocation: 15.8,
    sparkline: [95, 92, 91, 89, 88, 90]
  },
  {
    id: 4,
    symbol: 'AVAX',
    name: 'Avalanche',
    balance: 850.00,
    value: 29750.00,
    price: 35.00,
    change24h: 7.89,
    allocation: 11.6,
    sparkline: [32, 33, 34, 34.5, 34.8, 35]
  },
  {
    id: 5,
    symbol: 'MATIC',
    name: 'Polygon',
    balance: 12500.00,
    value: 18750.00,
    price: 1.50,
    change24h: -1.24,
    allocation: 7.3,
    sparkline: [1.55, 1.52, 1.51, 1.49, 1.48, 1.50]
  },
  {
    id: 6,
    symbol: 'LINK',
    name: 'Chainlink',
    balance: 650.00,
    value: 10400.00,
    price: 16.00,
    change24h: 4.12,
    allocation: 4.1,
    sparkline: [15.2, 15.5, 15.8, 15.9, 15.95, 16]
  }
];

export const tradesData = [
  {
    id: 'TXN-001',
    date: '2025-12-20T08:23:15',
    pair: 'BTC/USDT',
    type: 'BUY',
    entry: 43850.00,
    exit: 44388.98,
    amount: 0.5,
    pnl: 269.49,
    pnlPercent: 1.23,
    strategy: 'Momentum Surge',
    status: 'CLOSED'
  },
  {
    id: 'TXN-002',
    date: '2025-12-20T07:45:32',
    pair: 'ETH/USDT',
    type: 'BUY',
    entry: 2480.00,
    exit: 2550.00,
    amount: 5,
    pnl: 350.00,
    pnlPercent: 2.82,
    strategy: 'Breakout Hunter',
    status: 'CLOSED'
  },
  {
    id: 'TXN-003',
    date: '2025-12-20T06:12:48',
    pair: 'SOL/USDT',
    type: 'SELL',
    entry: 95.00,
    exit: 90.00,
    amount: 100,
    pnl: -500.00,
    pnlPercent: -5.26,
    strategy: 'Mean Reversion',
    status: 'CLOSED'
  },
  {
    id: 'TXN-004',
    date: '2025-12-20T05:34:21',
    pair: 'AVAX/USDT',
    type: 'BUY',
    entry: 32.50,
    exit: 35.00,
    amount: 200,
    pnl: 500.00,
    pnlPercent: 7.69,
    strategy: 'Momentum Surge',
    status: 'CLOSED'
  },
  {
    id: 'TXN-005',
    date: '2025-12-20T04:18:09',
    pair: 'MATIC/USDT',
    type: 'BUY',
    entry: 1.45,
    exit: 1.50,
    amount: 2500,
    pnl: 125.00,
    pnlPercent: 3.45,
    strategy: 'Scalper Pro',
    status: 'CLOSED'
  },
  {
    id: 'TXN-006',
    date: '2025-12-20T03:52:44',
    pair: 'LINK/USDT',
    type: 'BUY',
    entry: 15.20,
    exit: null,
    amount: 150,
    pnl: 120.00,
    pnlPercent: 5.26,
    strategy: 'Trend Following',
    status: 'OPEN'
  },
  {
    id: 'TXN-007',
    date: '2025-12-19T22:15:33',
    pair: 'BTC/USDT',
    type: 'SELL',
    entry: 44200.00,
    exit: 43850.00,
    amount: 0.3,
    pnl: -105.00,
    pnlPercent: -0.79,
    strategy: 'Momentum Surge',
    status: 'CLOSED'
  },
  {
    id: 'TXN-008',
    date: '2025-12-19T20:48:17',
    pair: 'ETH/USDT',
    type: 'BUY',
    entry: 2420.00,
    exit: 2480.00,
    amount: 8,
    pnl: 480.00,
    pnlPercent: 2.48,
    strategy: 'Breakout Hunter',
    status: 'CLOSED'
  }
];

export const alertsData = [
  {
    id: 1,
    type: 'success',
    title: 'Trade Executed',
    message: 'BTC/USDT buy order filled at $44,388.98',
    timestamp: '2025-12-20T08:23:15',
    read: false
  },
  {
    id: 2,
    type: 'warning',
    title: 'High Volatility Detected',
    message: 'SOL showing unusual price movements. Risk level elevated.',
    timestamp: '2025-12-20T07:45:22',
    read: false
  },
  {
    id: 3,
    type: 'info',
    title: 'Strategy Update',
    message: 'Momentum Surge strategy performance improved by 12%',
    timestamp: '2025-12-20T06:12:08',
    read: true
  },
  {
    id: 4,
    type: 'error',
    title: 'Stop Loss Triggered',
    message: 'SOL/USDT position closed at stop loss level',
    timestamp: '2025-12-20T05:34:44',
    read: true
  },
  {
    id: 5,
    type: 'success',
    title: 'Profit Target Reached',
    message: 'AVAX/USDT reached take-profit level (+7.69%)',
    timestamp: '2025-12-20T04:18:33',
    read: true
  }
];

export const activitiesData = [
  { id: 1, action: 'Trade Executed', pair: 'BTC/USDT', time: '2 mins ago', profit: 269.49 },
  { id: 2, action: 'Alert Triggered', pair: 'SOL/USDT', time: '45 mins ago', profit: null },
  { id: 3, action: 'Strategy Started', pair: 'ETH/USDT', time: '1 hour ago', profit: null },
  { id: 4, action: 'Trade Executed', pair: 'AVAX/USDT', time: '2 hours ago', profit: 500.00 },
  { id: 5, action: 'Position Closed', pair: 'MATIC/USDT', time: '3 hours ago', profit: 125.00 },
  { id: 6, action: 'Stop Loss Hit', pair: 'SOL/USDT', time: '4 hours ago', profit: -500.00 },
  { id: 7, action: 'Trade Executed', pair: 'LINK/USDT', time: '5 hours ago', profit: null }
];

export const performanceChartData = [
  { date: '12/14', value: 245000, trades: 12 },
  { date: '12/15', value: 248500, trades: 15 },
  { date: '12/16', value: 247200, trades: 10 },
  { date: '12/17', value: 251800, trades: 18 },
  { date: '12/18', value: 253400, trades: 14 },
  { date: '12/19', value: 255100, trades: 16 },
  { date: '12/20', value: 256063, trades: 8 }
];

export const strategyPerformance = [
  { name: 'Momentum Surge', winRate: 72.5, trades: 145, profit: 12458.50, active: true },
  { name: 'Breakout Hunter', winRate: 68.3, trades: 98, profit: 8932.75, active: true },
  { name: 'Mean Reversion', winRate: 65.8, trades: 122, profit: 6543.20, active: true },
  { name: 'Scalper Pro', winRate: 58.2, trades: 312, profit: 5234.80, active: false },
  { name: 'Trend Following', winRate: 71.9, trades: 87, profit: 9876.40, active: true }
];

export const equityCurveData = Array.from({ length: 30 }, (_, i) => ({
  day: i + 1,
  equity: 200000 + Math.random() * 60000 + i * 1500,
  benchmark: 200000 + i * 1200
}));

export const drawdownData = Array.from({ length: 30 }, (_, i) => ({
  day: i + 1,
  drawdown: -(Math.random() * 8 + Math.sin(i / 5) * 3)
}));

export const heatmapData = [
  { day: 'Mon', week1: 1200, week2: -450, week3: 890, week4: 1450 },
  { day: 'Tue', week1: 850, week2: 1100, week3: -320, week4: 980 },
  { day: 'Wed', week1: -280, week2: 1350, week3: 1520, week4: 1680 },
  { day: 'Thu', week1: 1450, week2: 720, week3: 1100, week4: -550 },
  { day: 'Fri', week1: 1680, week2: 1890, week3: 2100, week4: 1950 }
];

export const riskMetrics = {
  currentRisk: 42,
  sharpeRatio: 2.34,
  maxDrawdown: 8.5,
  volatility: 12.3,
  valueAtRisk: 5.2
};

export const dashboardStats = {
  totalProfit: 43964.65,
  profitChange: 12.5,
  winRate: 68.7,
  winRateChange: 3.2,
  activeStrategies: 4,
  strategiesChange: 0,
  totalTrades: 764,
  tradesChange: 8
};
