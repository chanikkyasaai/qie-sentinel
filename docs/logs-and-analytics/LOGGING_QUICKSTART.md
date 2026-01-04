# 🚀 Quick Start: Logging & Analytics

## View Trading Analytics

```bash
cd backend/node
node reports.js
```

## Export Report to JSON

```bash
node reports.js --export
```

## Log Files Location

```
backend/node/logs/
├── trades.json              # All trade logs (persistent)
└── analytics-report.json    # Generated analytics
```

## Sample Log Entry

```json
{
  "timestamp": "2025-12-20T10:15:30.000Z",
  "signalType": "BUY",
  "tokenIn": "0x...",
  "tokenOut": "0x...",
  "amount": "10.0",
  "txHash": "0xabc123...",
  "gasUsed": "150000",
  "slippageUsed": "10.00%",
  "blockNumber": 12345,
  "price": "100.50"
}
```

## Key Metrics

- **Total Trades**: Count of all executed trades
- **Win Rate**: Percentage of profitable BUY-SELL pairs
- **Win/Loss Ratio**: Wins divided by losses
- **Est. P/L**: Estimated profit/loss in tokens
- **Gas Used**: Total gas consumed (wei)
- **Avg Trade Size**: Average amount per trade

## Programmatic Usage

```javascript
const reports = require('./reports');

// Generate report
const report = reports.generateReport();

// Individual metrics
const logs = reports.loadTradeLogs();
const totalTrades = reports.calculateTotalTrades(logs);
const winLoss = reports.calculateWinLossRatio(logs);
const profitStats = reports.calculateProfitStatistics(logs);
```

## Integration with Backend

Logging is **automatic** - every successful trade execution is logged.

No configuration required! ✅

---

**Full Documentation**: [LOGGING_ANALYTICS.md](LOGGING_ANALYTICS.md)
