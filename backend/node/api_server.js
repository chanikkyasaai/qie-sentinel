/**
 * QIE Sentinel - REST API Server
 * 
 * Provides HTTP endpoints for frontend to access backend data
 */

const express = require('express');
const cors = require('cors');

class APIServer {
  constructor(dataAccess, riskManager, strategyResolver, performanceMetrics, config) {
    this.app = express();
    this.dataAccess = dataAccess;
    this.riskManager = riskManager;
    this.strategyResolver = strategyResolver;
    this.performanceMetrics = performanceMetrics;
    this.config = config || {};
    
    this.setupMiddleware();
    this.setupRoutes();
  }
  
  setupMiddleware() {
    // Enable CORS for frontend
    this.app.use(cors({
      origin: ['http://localhost:5173', 'http://localhost:3000'],
      credentials: true
    }));
    
    this.app.use(express.json());
  }
  
  setupRoutes() {
    // Health check
    this.app.get('/api/health', (req, res) => {
      res.json({
        status: 'online',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        killSwitch: this.riskManager ? this.riskManager.state.killSwitchActive : false,
        autoTrading: this.config.trading ? this.config.trading.enableAutoTrading : false
      });
    });
    
    // Performance metrics
    this.app.get('/api/metrics', async (req, res) => {
      try {
        const tradesData = await this.dataAccess.read('trades');
        const trades = tradesData ? (tradesData.trades || []) : [];
        
        // Calculate metrics
        const totalPnL = trades.reduce((sum, t) => sum + (t.pnl || 0), 0);
        const winningTrades = trades.filter(t => (t.pnl || 0) > 0);
        const losingTrades = trades.filter(t => (t.pnl || 0) < 0);
        const winRate = trades.length > 0 ? (winningTrades.length / trades.length) * 100 : 0;
        
        // Calculate max drawdown
        let maxDrawdown = 0;
        let peak = 0;
        let cumulativePnL = 0;
        
        trades.forEach(trade => {
          cumulativePnL += (trade.pnl || 0);
          if (cumulativePnL > peak) peak = cumulativePnL;
          const drawdown = ((peak - cumulativePnL) / Math.max(peak, 1)) * 100;
          if (drawdown > maxDrawdown) maxDrawdown = drawdown;
        });
        
        // Calculate Sharpe ratio (simplified)
        const returns = trades.map(t => (t.pnl || 0));
        const avgReturn = returns.reduce((a, b) => a + b, 0) / Math.max(returns.length, 1);
        const variance = returns.reduce((sum, r) => sum + Math.pow(r - avgReturn, 2), 0) / Math.max(returns.length, 1);
        const stdDev = Math.sqrt(variance);
        const sharpeRatio = stdDev > 0 ? (avgReturn / stdDev) * Math.sqrt(252) : 0; // Annualized
        
        res.json({
          totalPnL: parseFloat(totalPnL.toFixed(4)),
          winRate: parseFloat(winRate.toFixed(2)),
          maxDrawdown: parseFloat(maxDrawdown.toFixed(2)),
          sharpeRatio: parseFloat(sharpeRatio.toFixed(2)),
          totalTrades: trades.length,
          winningTrades: winningTrades.length,
          losingTrades: losingTrades.length
        });
      } catch (error) {
        console.error('Error fetching metrics:', error);
        res.status(500).json({ error: 'Failed to fetch metrics' });
      }
    });
    
    // Trade history
    this.app.get('/api/trade-history', async (req, res) => {
      try {
        const limit = parseInt(req.query.limit) || 100;
        const tradesData = await this.dataAccess.read('trades');
        const trades = tradesData ? (tradesData.trades || []) : [];
        
        // Sort by timestamp descending and limit
        const sortedTrades = trades
          .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
          .slice(0, limit);
        
        res.json({ trades: sortedTrades });
      } catch (error) {
        console.error('Error fetching trade history:', error);
        res.status(500).json({ error: 'Failed to fetch trade history' });
      }
    });
    
    // Portfolio data
    this.app.get('/api/portfolio', async (req, res) => {
      try {
        const tradesData = await this.dataAccess.read('trades');
        const trades = tradesData ? (tradesData.trades || []) : [];
        const totalPnL = trades.reduce((sum, t) => sum + (t.pnl || 0), 0);
        
        // Calculate portfolio value (starting with 1000 USDT equivalent)
        const initialValue = 1000;
        const currentValue = initialValue + totalPnL;
        
        res.json({
          totalValue: currentValue.toFixed(2),
          totalPnL: totalPnL.toFixed(4),
          pnlPercentage: ((totalPnL / initialValue) * 100).toFixed(2),
          positions: [] // Will be populated when we have active positions
        });
      } catch (error) {
        console.error('Error fetching portfolio:', error);
        res.status(500).json({ error: 'Failed to fetch portfolio' });
      }
    });
    
    // Strategies
    this.app.get('/api/strategies', async (req, res) => {
      try {
        const tradesData = await this.dataAccess.read('trades');
        const allTrades = tradesData ? (tradesData.trades || []) : [];
        
        const strategies = this.strategyResolver.strategies.map(strategy => {
          // Get trades for this strategy
          const strategyTrades = Promise.resolve(
            allTrades.filter(t => t.strategyId === strategy.id)
          );
          
          return strategyTrades.then(trades => {
            const totalPnL = trades.reduce((sum, t) => sum + (t.pnl || 0), 0);
            const winningTrades = trades.filter(t => (t.pnl || 0) > 0).length;
            const winRate = trades.length > 0 ? (winningTrades / trades.length) * 100 : 0;
            
            return {
              id: strategy.id,
              name: strategy.name,
              description: strategy.description || '',
              enabled: strategy.enabled,
              winRate: winRate.toFixed(2),
              totalPnL: totalPnL.toFixed(4),
              tradesCount: trades.length
            };
          });
        });
        
        const resolvedStrategies = await Promise.all(strategies);
        res.json(resolvedStrategies);
      } catch (error) {
        console.error('Error fetching strategies:', error);
        res.status(500).json({ error: 'Failed to fetch strategies' });
      }
    });
    
    // Update strategy status
    this.app.put('/api/strategies/:id', async (req, res) => {
      try {
        const strategyId = parseInt(req.params.id);
        const { enabled } = req.body;
        
        const strategy = this.strategyResolver.strategies.find(s => s.id === strategyId);
        if (!strategy) {
          return res.status(404).json({ error: 'Strategy not found' });
        }
        
        strategy.enabled = enabled;
        
        res.json({
          success: true,
          strategy: {
            id: strategy.id,
            name: strategy.name,
            enabled: strategy.enabled
          }
        });
      } catch (error) {
        console.error('Error updating strategy:', error);
        res.status(500).json({ error: 'Failed to update strategy' });
      }
    });
    
    // Live signal data (for real-time updates)
    this.app.get('/api/live', async (req, res) => {
      try {
        const tradesData = await this.dataAccess.read('trades');
        const trades = tradesData ? (tradesData.trades || []) : [];
        
        // Get recent decisions from trades
        const recentDecisions = trades
          .slice(-10)
          .reverse()
          .map(trade => ({
            asset: `${trade.tokenIn}/${trade.tokenOut}`,
            signal: trade.signalType || 'HOLD',
            strategy: `Strategy ${trade.strategyId}`,
            confidence: trade.confidence || 0,
            reason: trade.reason || 'AI evaluation',
            timestamp: trade.timestamp
          }));
        
        // Calculate uptime
        const uptimeSeconds = Math.floor((Date.now() - this.performanceMetrics.startTime) / 1000);
        const uptimeMinutes = Math.floor(uptimeSeconds / 60);
        const uptime = uptimeMinutes > 0 ? `${uptimeMinutes}m ${uptimeSeconds % 60}s` : `${uptimeSeconds}s`;
        
        // Get last trade
        const lastTrade = trades[trades.length - 1];
        
        res.json({
          timestamp: new Date().toISOString(),
          status: 'running',
          currentCycle: this.performanceMetrics.totalCycles,
          currentAsset: lastTrade ? `${lastTrade.tokenIn}/${lastTrade.tokenOut}` : '—',
          currentStrategy: lastTrade ? `Strategy ${lastTrade.strategyId}` : '—',
          lastExecution: lastTrade ? lastTrade.timestamp : null,
          uptime: uptime,
          recentDecisions: recentDecisions,
          killSwitch: this.riskManager ? this.riskManager.state.killSwitchActive : false
        });
      } catch (error) {
        console.error('Error fetching live data:', error);
        res.json({
          timestamp: new Date().toISOString(),
          status: 'running',
          currentCycle: this.performanceMetrics.totalCycles,
          currentAsset: '—',
          currentStrategy: '—',
          lastExecution: null,
          uptime: '—',
          recentDecisions: [],
          killSwitch: false
        });
      }
    });
  }
  
  start(port = 9000) {
    this.server = this.app.listen(port, () => {
      console.log(`🌐 API Server listening on http://localhost:${port}`);
      console.log(`   Available endpoints:`);
      console.log(`   - GET  /api/health`);
      console.log(`   - GET  /api/metrics`);
      console.log(`   - GET  /api/trade-history`);
      console.log(`   - GET  /api/portfolio`);
      console.log(`   - GET  /api/strategies`);
      console.log(`   - PUT  /api/strategies/:id`);
      console.log(`   - GET  /api/live`);
    });
    
    return this.server;
  }
  
  stop() {
    if (this.server) {
      this.server.close();
      console.log('🛑 API Server stopped');
    }
  }
}

module.exports = APIServer;
