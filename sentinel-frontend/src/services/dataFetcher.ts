import api from './api';

export interface Portfolio {
  tokens: Array<{
    symbol: string;
    balance: string;
    valueUsd: number;
  }>;
  totalValue: number;
}

export interface Strategy {
  id: number;
  name: string;
  activeSince: string;
  winRate: number;
  pnlContribution: number;
  enabled: boolean;
  description?: string;
}

export interface PerformanceMetrics {
  totalPnl: number;
  winRate: number;
  drawdown: number;
  volatility: number;
  sharpeRatio: number;
  dailyReturns: number;
  weeklyReturns: number;
  totalVolume: number;
  tradeCount: number;
  topPerformingStrategy?: string;
  mostProfitablePair?: string;
}

export interface Trade {
  timestamp: string;
  symbol: string;
  side: 'BUY' | 'SELL';
  pnl: number;
  confidence: number;
  gasFee: number;
  slippage: number;
  amount?: string;
  price?: string;
  strategyId?: number;
}

export interface LiveSignal {
  status: 'active' | 'idle' | 'error';
  lastTrade?: Trade;
  nextCheck?: string;
  currentAsset?: string;
}

/**
 * Fetch portfolio aggregation data
 */
export async function getPortfolio(): Promise<Portfolio> {
  try {
    const response = await api.get('/api/portfolio');
    return response.data;
  } catch (error) {
    console.error('Failed to fetch portfolio:', error);
    throw error;
  }
}

/**
 * Fetch strategies list with metrics
 */
export async function getStrategies(): Promise<Strategy[]> {
  try {
    const response = await api.get('/api/strategies');
    return response.data;
  } catch (error) {
    console.error('Failed to fetch strategies:', error);
    throw error;
  }
}

/**
 * Fetch performance metrics
 */
export async function getPerformanceMetrics(): Promise<PerformanceMetrics> {
  try {
    const response = await api.get('/api/metrics');
    return response.data;
  } catch (error) {
    console.error('Failed to fetch metrics:', error);
    throw error;
  }
}

/**
 * Fetch trade history
 */
export async function getTradeHistory(limit?: number): Promise<Trade[]> {
  try {
    const response = await api.get('/api/trade-history', {
      params: { limit }
    });
    return response.data;
  } catch (error) {
    console.error('Failed to fetch trade history:', error);
    throw error;
  }
}

/**
 * Fetch live signal/status
 */
export async function getLiveSignal(): Promise<LiveSignal> {
  try {
    const response = await api.get('/api/live');
    return response.data;
  } catch (error) {
    console.error('Failed to fetch live signal:', error);
    throw error;
  }
}

/**
 * Update strategy status (enable/disable)
 */
export async function updateStrategyStatus(strategyId: number, enabled: boolean): Promise<void> {
  try {
    await api.patch(`/api/strategies/${strategyId}`, { enabled });
  } catch (error) {
    console.error('Failed to update strategy:', error);
    throw error;
  }
}
