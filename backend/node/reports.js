/**
 * QIE Sentinel - Trade Analytics & Reporting
 * 
 * Read-only analytics module that processes trade logs
 * and generates comprehensive trading statistics.
 */

const fs = require('fs');
const path = require('path');

const LOGS_PATH = path.join(__dirname, 'logs');
const TRADES_LOG_FILE = path.join(LOGS_PATH, 'trades.json');

/**
 * Load all trade logs from persistent storage
 * @returns {Array} Array of trade log entries
 */
function loadTradeLogs() {
  try {
    if (!fs.existsSync(TRADES_LOG_FILE)) {
      console.log('⚠️  No trade logs found. File:', TRADES_LOG_FILE);
      return [];
    }
    
    const fileContent = fs.readFileSync(TRADES_LOG_FILE, 'utf8');
    
    if (!fileContent.trim()) {
      console.log('⚠️  Trade log file is empty.');
      return [];
    }
    
    const logs = JSON.parse(fileContent);
    console.log(`📊 Loaded ${logs.length} trade logs`);
    return logs;
    
  } catch (error) {
    console.error(`❌ Error loading trade logs: ${error.message}`);
    return [];
  }
}

/**
 * Calculate total number of trades
 * @param {Array} logs - Trade log entries
 * @returns {Object} Trade count statistics
 */
function calculateTotalTrades(logs) {
  const buyTrades = logs.filter(log => log.signalType === 'BUY').length;
  const sellTrades = logs.filter(log => log.signalType === 'SELL').length;
  
  return {
    total: logs.length,
    buyTrades,
    sellTrades
  };
}

/**
 * Calculate win/loss ratio based on balance changes
 * 
 * Strategy: A BUY-SELL pair is considered:
 * - WIN if SELL price > BUY price (profit)
 * - LOSS if SELL price <= BUY price (loss/break-even)
 * 
 * @param {Array} logs - Trade log entries
 * @returns {Object} Win/loss statistics
 */
function calculateWinLossRatio(logs) {
  if (logs.length === 0) {
    return {
      wins: 0,
      losses: 0,
      ratio: 'N/A',
      percentage: 'N/A'
    };
  }
  
  let wins = 0;
  let losses = 0;
  let lastBuyPrice = null;
  
  // Iterate through logs chronologically
  for (const log of logs) {
    if (log.signalType === 'BUY') {
      // Record buy price
      lastBuyPrice = parseFloat(log.price);
    } else if (log.signalType === 'SELL' && lastBuyPrice !== null) {
      // Evaluate sell against last buy
      const sellPrice = parseFloat(log.price);
      
      if (sellPrice > lastBuyPrice) {
        wins++;
      } else {
        losses++;
      }
      
      // Reset buy price after pair evaluation
      lastBuyPrice = null;
    }
  }
  
  const totalPairs = wins + losses;
  const ratio = totalPairs > 0 ? (wins / losses).toFixed(2) : 'N/A';
  const percentage = totalPairs > 0 ? ((wins / totalPairs) * 100).toFixed(2) : 'N/A';
  
  return {
    wins,
    losses,
    incompletePairs: lastBuyPrice !== null ? 1 : 0,
    ratio,
    winPercentage: percentage
  };
}

/**
 * Calculate profit statistics
 * 
 * Tracks:
 * - Total volume traded
 * - Average trade size
 * - Total gas costs
 * - Estimated profit/loss (based on price changes)
 * 
 * @param {Array} logs - Trade log entries
 * @returns {Object} Profit statistics
 */
function calculateProfitStatistics(logs) {
  if (logs.length === 0) {
    return {
      totalVolume: '0',
      averageTradeSize: '0',
      totalGasUsed: '0',
      estimatedProfitLoss: '0',
      profitableTrades: 0,
      unprofitableTrades: 0
    };
  }
  
  let totalVolume = 0;
  let totalGasUsed = BigInt(0);
  let estimatedProfit = 0;
  let profitableTrades = 0;
  let unprofitableTrades = 0;
  let lastBuyPrice = null;
  let lastBuyAmount = 0;
  
  for (const log of logs) {
    const amount = parseFloat(log.amount);
    totalVolume += amount;
    
    try {
      totalGasUsed += BigInt(log.gasUsed);
    } catch (e) {
      console.warn(`⚠️  Invalid gasUsed value: ${log.gasUsed}`);
    }
    
    if (log.signalType === 'BUY') {
      lastBuyPrice = parseFloat(log.price);
      lastBuyAmount = amount;
    } else if (log.signalType === 'SELL' && lastBuyPrice !== null) {
      const sellPrice = parseFloat(log.price);
      const priceDiff = sellPrice - lastBuyPrice;
      const tradeProfit = (priceDiff / lastBuyPrice) * lastBuyAmount;
      
      estimatedProfit += tradeProfit;
      
      if (tradeProfit > 0) {
        profitableTrades++;
      } else {
        unprofitableTrades++;
      }
      
      lastBuyPrice = null;
      lastBuyAmount = 0;
    }
  }
  
  const averageTradeSize = (totalVolume / logs.length).toFixed(4);
  
  return {
    totalVolume: totalVolume.toFixed(4),
    averageTradeSize,
    totalGasUsed: totalGasUsed.toString(),
    estimatedProfitLoss: estimatedProfit.toFixed(4),
    profitableTrades,
    unprofitableTrades
  };
}

/**
 * Calculate time-based statistics
 * @param {Array} logs - Trade log entries
 * @returns {Object} Time statistics
 */
function calculateTimeStatistics(logs) {
  if (logs.length === 0) {
    return {
      firstTrade: 'N/A',
      lastTrade: 'N/A',
      tradingPeriod: 'N/A',
      averageTradeInterval: 'N/A'
    };
  }
  
  const timestamps = logs.map(log => new Date(log.timestamp));
  const firstTrade = timestamps[0];
  const lastTrade = timestamps[timestamps.length - 1];
  
  const tradingPeriodMs = lastTrade - firstTrade;
  const tradingPeriodHours = (tradingPeriodMs / (1000 * 60 * 60)).toFixed(2);
  
  // Calculate average interval between trades
  let totalIntervalMs = 0;
  for (let i = 1; i < timestamps.length; i++) {
    totalIntervalMs += timestamps[i] - timestamps[i - 1];
  }
  const avgIntervalMinutes = timestamps.length > 1 
    ? (totalIntervalMs / (timestamps.length - 1) / (1000 * 60)).toFixed(2)
    : 'N/A';
  
  return {
    firstTrade: firstTrade.toISOString(),
    lastTrade: lastTrade.toISOString(),
    tradingPeriodHours,
    averageTradeIntervalMinutes: avgIntervalMinutes
  };
}

/**
 * Generate comprehensive trading report
 * @returns {Object} Complete analytics report
 */
function generateReport() {
  console.log('\n📊 QIE Sentinel - Trading Analytics Report');
  console.log('='.repeat(70));
  
  const logs = loadTradeLogs();
  
  if (logs.length === 0) {
    console.log('❌ No trades to analyze.');
    return {
      error: 'No trade data available'
    };
  }
  
  const totalTrades = calculateTotalTrades(logs);
  const winLoss = calculateWinLossRatio(logs);
  const profitStats = calculateProfitStatistics(logs);
  const timeStats = calculateTimeStatistics(logs);
  
  const report = {
    generatedAt: new Date().toISOString(),
    totalTrades,
    winLoss,
    profitStats,
    timeStats,
    recentTrades: logs.slice(-5) // Last 5 trades
  };
  
  // Print formatted report
  console.log('\n📈 Trade Summary:');
  console.log(`   Total Trades:     ${totalTrades.total}`);
  console.log(`   Buy Trades:       ${totalTrades.buyTrades}`);
  console.log(`   Sell Trades:      ${totalTrades.sellTrades}`);
  
  console.log('\n🎯 Win/Loss Analysis:');
  console.log(`   Wins:             ${winLoss.wins}`);
  console.log(`   Losses:           ${winLoss.losses}`);
  console.log(`   Win Rate:         ${winLoss.winPercentage}%`);
  console.log(`   Win/Loss Ratio:   ${winLoss.ratio}`);
  if (winLoss.incompletePairs > 0) {
    console.log(`   ⚠️  Incomplete Pairs: ${winLoss.incompletePairs}`);
  }
  
  console.log('\n💰 Profit Statistics:');
  console.log(`   Total Volume:     ${profitStats.totalVolume} tokens`);
  console.log(`   Avg Trade Size:   ${profitStats.averageTradeSize} tokens`);
  console.log(`   Total Gas Used:   ${profitStats.totalGasUsed} wei`);
  console.log(`   Est. P/L:         ${profitStats.estimatedProfitLoss} tokens`);
  console.log(`   Profitable:       ${profitStats.profitableTrades} trades`);
  console.log(`   Unprofitable:     ${profitStats.unprofitableTrades} trades`);
  
  console.log('\n⏱️  Time Analysis:');
  console.log(`   First Trade:      ${timeStats.firstTrade}`);
  console.log(`   Last Trade:       ${timeStats.lastTrade}`);
  console.log(`   Trading Period:   ${timeStats.tradingPeriodHours} hours`);
  console.log(`   Avg Interval:     ${timeStats.averageTradeIntervalMinutes} minutes`);
  
  console.log('\n📜 Recent Trades (Last 5):');
  report.recentTrades.forEach((trade, idx) => {
    console.log(`   ${idx + 1}. [${trade.timestamp}] ${trade.signalType} - Price: ${trade.price} - TX: ${trade.txHash.substring(0, 10)}...`);
  });
  
  console.log('\n' + '='.repeat(70));
  
  return report;
}

/**
 * Export report to JSON file
 * @param {String} outputPath - Path to save report
 */
function exportReport(outputPath) {
  try {
    const report = generateReport();
    
    if (report.error) {
      console.log('❌ Cannot export report: No data available');
      return;
    }
    
    const reportFile = outputPath || path.join(LOGS_PATH, 'analytics-report.json');
    fs.writeFileSync(reportFile, JSON.stringify(report, null, 2), 'utf8');
    
    console.log(`\n✅ Report exported to: ${reportFile}`);
  } catch (error) {
    console.error(`❌ Error exporting report: ${error.message}`);
  }
}

// ============ Module Exports ============

module.exports = {
  loadTradeLogs,
  calculateTotalTrades,
  calculateWinLossRatio,
  calculateProfitStatistics,
  calculateTimeStatistics,
  generateReport,
  exportReport
};

// ============ CLI Interface ============

// Allow running as standalone script
if (require.main === module) {
  const args = process.argv.slice(2);
  
  if (args.includes('--export')) {
    const exportPath = args[args.indexOf('--export') + 1];
    exportReport(exportPath);
  } else {
    generateReport();
  }
}
