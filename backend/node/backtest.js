/**
 * Backtesting Engine - Historical strategy performance analysis
 * 
 * Tests trading strategies against historical price data
 * Generates comprehensive performance reports
 */

const fs = require('fs');
const path = require('path');
const StrategyResolver = require('./strategy_resolver');

class BacktestEngine {
  constructor(config = {}) {
    this.config = config;
    this.strategyResolver = new StrategyResolver();
    this.dataPath = config.dataPath || path.join(__dirname, 'backtest', 'data');
    this.outputPath = config.outputPath || path.join(__dirname, 'backtest', 'results');
    
    // Ensure directories exist
    [this.dataPath, this.outputPath].forEach(dir => {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
    });
  }

  /**
   * Load historical price data from CSV
   * @param {String} filename - CSV filename
   * @returns {Array} Array of {timestamp, price} objects
   */
  loadHistoricalData(filename) {
    try {
      const filePath = path.join(this.dataPath, filename);
      
      if (!fs.existsSync(filePath)) {
        console.error(`❌ Data file not found: ${filePath}`);
        return this._generateSampleData();
      }

      const content = fs.readFileSync(filePath, 'utf8');
      const lines = content.trim().split('\n');
      
      // Skip header
      const data = lines.slice(1).map(line => {
        const [timestamp, price] = line.split(',');
        return {
          timestamp: new Date(timestamp),
          price: parseFloat(price)
        };
      });

      console.log(`📊 Loaded ${data.length} historical data points`);
      return data;
    } catch (error) {
      console.error(`❌ Error loading historical data: ${error.message}`);
      return this._generateSampleData();
    }
  }

  /**
   * Generate sample historical data for testing
   * @private
   */
  _generateSampleData() {
    console.log(`📊 Generating sample historical data...`);
    
    const data = [];
    let price = 100;
    const startDate = new Date('2025-01-01');

    // Generate 365 days of hourly data
    for (let i = 0; i < 365 * 24; i++) {
      const timestamp = new Date(startDate.getTime() + i * 60 * 60 * 1000);
      
      // Random walk with trend
      const change = (Math.random() - 0.48) * 2;
      price = Math.max(50, Math.min(200, price + change));
      
      data.push({ timestamp, price });
    }

    return data;
  }

  /**
   * Run backtest for specific strategy
   * @param {Number} strategyId - Strategy ID to test
   * @param {Array} historicalData - Historical price data
   * @param {Object} options - Backtest options
   * @returns {Object} Backtest results
   */
  async runBacktest(strategyId, historicalData, options = {}) {
    console.log(`\n🧪 Starting backtest for Strategy ${strategyId}...`);
    console.log(`   Data points: ${historicalData.length}`);
    console.log(`   Period: ${historicalData[0].timestamp.toISOString()} to ${historicalData[historicalData.length - 1].timestamp.toISOString()}`);

    const {
      initialBalance = 10000,
      tradeAmount = 100,
      slippage = 0.001, // 0.1%
      fee = 0.003 // 0.3%
    } = options;

    let balance = initialBalance;
    let position = null; // null, 'LONG', 'SHORT'
    let trades = [];
    let priceHistory = [];
    
    const minHistoryLength = 30;

    for (let i = 0; i < historicalData.length; i++) {
      const dataPoint = historicalData[i];
      priceHistory.push(dataPoint.price);

      // Keep price history manageable
      if (priceHistory.length > 100) {
        priceHistory.shift();
      }

      // Need minimum history for indicators
      if (priceHistory.length < minHistoryLength) {
        continue;
      }

      // Get signal from strategy
      const signalResult = await this.strategyResolver.getSignal(
        strategyId,
        priceHistory,
        'BACKTEST'
      );

      const { signal, reason, confidence } = signalResult;

      // Execute trades based on signal
      if (signal === 'BUY' && position === null) {
        // Open long position
        const entryPrice = dataPoint.price * (1 + slippage);
        const cost = tradeAmount + (tradeAmount * fee);
        
        if (balance >= cost) {
          position = 'LONG';
          balance -= cost;
          
          trades.push({
            type: 'OPEN_LONG',
            timestamp: dataPoint.timestamp,
            price: entryPrice,
            amount: tradeAmount,
            balance: balance,
            reason: reason
          });
        }
      } else if (signal === 'SELL' && position === 'LONG') {
        // Close long position
        const exitPrice = dataPoint.price * (1 - slippage);
        const entryTrade = [...trades].reverse().find(t => t.type === 'OPEN_LONG');
        
        if (entryTrade) {
          const proceeds = tradeAmount * (exitPrice / entryTrade.price);
          const netProceeds = proceeds - (proceeds * fee);
          balance += netProceeds;
          
          const profit = netProceeds - tradeAmount;
          
          trades.push({
            type: 'CLOSE_LONG',
            timestamp: dataPoint.timestamp,
            price: exitPrice,
            amount: tradeAmount,
            balance: balance,
            profit: profit,
            profitPercent: (profit / tradeAmount) * 100,
            reason: reason
          });
          
          position = null;
        }
      }
    }

    // Close any open positions at end
    if (position === 'LONG') {
      const lastPrice = historicalData[historicalData.length - 1].price;
      const entryTrade = [...trades].reverse().find(t => t.type === 'OPEN_LONG');
      
      if (entryTrade) {
        const proceeds = tradeAmount * (lastPrice / entryTrade.price);
        const netProceeds = proceeds - (proceeds * fee);
        balance += netProceeds;
        
        trades.push({
          type: 'FORCE_CLOSE',
          timestamp: historicalData[historicalData.length - 1].timestamp,
          price: lastPrice,
          amount: tradeAmount,
          balance: balance,
          profit: netProceeds - tradeAmount,
          reason: 'End of backtest period'
        });
      }
    }

    // Calculate metrics
    const metrics = this._calculateMetrics(trades, initialBalance, balance);

    const results = {
      strategyId,
      startDate: historicalData[0].timestamp,
      endDate: historicalData[historicalData.length - 1].timestamp,
      initialBalance,
      finalBalance: balance,
      totalReturn: ((balance - initialBalance) / initialBalance) * 100,
      trades,
      metrics
    };

    console.log(`✅ Backtest complete`);
    console.log(`   Total return: ${results.totalReturn.toFixed(2)}%`);
    console.log(`   Total trades: ${trades.length}`);
    console.log(`   Win rate: ${metrics.winRate.toFixed(2)}%`);

    return results;
  }

  /**
   * Calculate performance metrics
   * @private
   */
  _calculateMetrics(trades, initialBalance, finalBalance) {
    const completedTrades = trades.filter(t => t.type === 'CLOSE_LONG' || t.type === 'FORCE_CLOSE');
    
    const wins = completedTrades.filter(t => t.profit > 0).length;
    const losses = completedTrades.filter(t => t.profit <= 0).length;
    const winRate = completedTrades.length > 0 ? (wins / completedTrades.length) * 100 : 0;

    const totalProfit = completedTrades.reduce((sum, t) => sum + (t.profit || 0), 0);
    const avgProfit = completedTrades.length > 0 ? totalProfit / completedTrades.length : 0;

    // Calculate maximum drawdown
    let peak = initialBalance;
    let maxDrawdown = 0;

    for (const trade of trades) {
      if (trade.balance > peak) {
        peak = trade.balance;
      }
      const drawdown = ((peak - trade.balance) / peak) * 100;
      if (drawdown > maxDrawdown) {
        maxDrawdown = drawdown;
      }
    }

    // Sharpe ratio approximation (simplified)
    const returns = completedTrades.map(t => t.profitPercent || 0);
    const avgReturn = returns.reduce((a, b) => a + b, 0) / (returns.length || 1);
    const stdDev = Math.sqrt(
      returns.reduce((sum, r) => sum + Math.pow(r - avgReturn, 2), 0) / (returns.length || 1)
    );
    const sharpeRatio = stdDev !== 0 ? avgReturn / stdDev : 0;

    return {
      totalTrades: trades.length,
      completedTrades: completedTrades.length,
      wins,
      losses,
      winRate,
      totalProfit,
      avgProfit,
      maxDrawdown,
      sharpeRatio: sharpeRatio.toFixed(2)
    };
  }

  /**
   * Export backtest results to JSON
   * @param {Object} results - Backtest results
   * @param {String} filename - Output filename
   */
  exportResults(results, filename) {
    try {
      const filePath = path.join(this.outputPath, filename);
      fs.writeFileSync(filePath, JSON.stringify(results, null, 2), 'utf8');
      console.log(`📄 Results exported to: ${filePath}`);
    } catch (error) {
      console.error(`❌ Error exporting results: ${error.message}`);
    }
  }

  /**
   * Generate console report
   * @param {Object} results - Backtest results
   */
  generateReport(results) {
    console.log('\n' + '='.repeat(70));
    console.log('📊 BACKTEST RESULTS REPORT');
    console.log('='.repeat(70));
    
    console.log(`\nStrategy: ${results.strategyId}`);
    console.log(`Period: ${results.startDate.toISOString()} to ${results.endDate.toISOString()}`);
    
    console.log(`\n💰 Performance:`);
    console.log(`   Initial Balance:  $${results.initialBalance.toFixed(2)}`);
    console.log(`   Final Balance:    $${results.finalBalance.toFixed(2)}`);
    console.log(`   Total Return:     ${results.totalReturn.toFixed(2)}%`);
    console.log(`   Total Profit:     $${results.metrics.totalProfit.toFixed(2)}`);
    console.log(`   Avg Profit:       $${results.metrics.avgProfit.toFixed(2)}`);
    
    console.log(`\n📈 Trade Statistics:`);
    console.log(`   Total Trades:     ${results.metrics.totalTrades}`);
    console.log(`   Completed:        ${results.metrics.completedTrades}`);
    console.log(`   Wins:             ${results.metrics.wins}`);
    console.log(`   Losses:           ${results.metrics.losses}`);
    console.log(`   Win Rate:         ${results.metrics.winRate.toFixed(2)}%`);
    
    console.log(`\n⚠️  Risk Metrics:`);
    console.log(`   Max Drawdown:     ${results.metrics.maxDrawdown.toFixed(2)}%`);
    console.log(`   Sharpe Ratio:     ${results.metrics.sharpeRatio}`);
    
    console.log('\n' + '='.repeat(70) + '\n');
  }
}

// ============ CLI Interface ============

async function main() {
  const engine = new BacktestEngine();
  
  // Load or generate data
  const data = engine.loadHistoricalData('sample_prices.csv');
  
  // Run backtest for each strategy
  const strategyIds = [1, 2, 3];
  
  for (const strategyId of strategyIds) {
    const results = await engine.runBacktest(strategyId, data, {
      initialBalance: 10000,
      tradeAmount: 100,
      slippage: 0.001,
      fee: 0.003
    });
    
    engine.generateReport(results);
    engine.exportResults(results, `backtest_strategy_${strategyId}_${Date.now()}.json`);
  }
}

// Run if called directly
if (require.main === module) {
  main().catch(console.error);
}

module.exports = BacktestEngine;
