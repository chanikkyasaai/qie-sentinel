# 🧠 Trading Strategy Guide

## Overview

QIE Sentinel supports 3 distinct trading strategies with configurable parameters. Strategies can be used individually or combined for portfolio-based approaches.

---

## Strategy Architecture

```
┌─────────────────────────────────────────────────┐
│          Strategy Resolver                      │
├─────────────────────────────────────────────────┤
│                                                  │
│  ┌────────────────┐  ┌─────────────────┐       │
│  │   Strategy 1   │  │   Strategy 2    │       │
│  │  RSI + SMA     │  │ Bollinger Bands │       │
│  │                │  │                 │       │
│  │ - RSI calc     │  │ - SMA calc      │       │
│  │ - SMA cross    │  │ - StdDev calc   │       │
│  │ - Momentum     │  │ - Band breakout │       │
│  └────────────────┘  └─────────────────┘       │
│                                                  │
│  ┌────────────────┐                             │
│  │   Strategy 3   │                             │
│  │     MACD       │                             │
│  │                │                             │
│  │ - Fast EMA     │                             │
│  │ - Slow EMA     │                             │
│  │ - Histogram    │                             │
│  └────────────────┘                             │
│                                                  │
│         ▼                                        │
│  Signal Output:                                 │
│  { signal, reason, confidence, indicators }    │
└─────────────────────────────────────────────────┘
```

---

## Strategy 1: RSI + SMA Crossover

### Description

Combines Relative Strength Index (RSI) for overbought/oversold detection with Simple Moving Average (SMA) for trend confirmation and momentum analysis.

### Indicators

**RSI (Relative Strength Index)**:
- Period: Configurable (default 14)
- Oversold threshold: 30
- Overbought threshold: 70

**SMA (Simple Moving Average)**:
- Short period: Configurable (default 10)
- Long period: Configurable (default 20)

**Momentum**:
- Lookback: 5 periods
- Compares current price to price 5 periods ago

### Signal Logic

**BUY Signal**:
```
1. RSI < 30 (oversold)
2. Short SMA crosses above Long SMA (golden cross)
3. Momentum > 1.0 (price rising)
```

**SELL Signal**:
```
1. RSI > 70 (overbought)
2. Short SMA crosses below Long SMA (death cross)
3. Momentum < 1.0 (price falling)
```

**Confidence Calculation**:
```javascript
// BUY confidence
if (rsi < 30 && shortSMA > longSMA && momentum > 1.0) {
  confidence = 0.95;
} else if (rsi < 30 && shortSMA > longSMA) {
  confidence = 0.75;
} else if (rsi < 35) {
  confidence = 0.60;
}

// SELL confidence
if (rsi > 70 && shortSMA < longSMA && momentum < 1.0) {
  confidence = 0.95;
} else if (rsi > 70 && shortSMA < longSMA) {
  confidence = 0.75;
} else if (rsi > 65) {
  confidence = 0.60;
}
```

### Configuration

```json
{
  "id": 1,
  "name": "RSI + SMA Crossover",
  "type": "rsi_sma",
  "enabled": true,
  "parameters": {
    "rsi_period": 14,
    "sma_short": 10,
    "sma_long": 20
  }
}
```

### When to Use

- **Trending markets**: SMA crossovers work best in clear trends
- **Medium volatility**: Not ideal for ranging or highly volatile markets
- **Timeframe**: Works well on 15-60 minute intervals

### Strengths

✅ Multiple confirmation signals reduce false positives  
✅ RSI prevents buying overbought / selling oversold  
✅ Momentum adds trend strength validation

### Weaknesses

❌ Lagging indicators (SMA, RSI) may miss quick moves  
❌ Can generate false signals in sideways markets  
❌ Requires 20+ price data points for accuracy

---

## Strategy 2: Bollinger Bands Breakout

### Description

Uses Bollinger Bands (SMA ± 2 standard deviations) to identify volatility breakouts and mean reversion opportunities.

### Indicators

**Bollinger Bands**:
- Period: Configurable (default 20)
- Standard deviation multiplier: 2
- Upper band: SMA + (2 * stdDev)
- Lower band: SMA - (2 * stdDev)

**SMA (Middle Band)**:
- Period: 20 (matches Bollinger period)

**Volatility**:
- Measured as standard deviation of prices
- Used to gauge breakout strength

### Signal Logic

**BUY Signal**:
```
1. Price crosses below lower band (oversold)
2. Price rebounds toward middle band (mean reversion)
```

**SELL Signal**:
```
1. Price crosses above upper band (overbought)
2. Price falls back toward middle band (mean reversion)
```

**Confidence Calculation**:
```javascript
// Distance from band determines confidence
const distanceFromLower = (price - lowerBand) / (middleBand - lowerBand);
const distanceFromUpper = (upperBand - price) / (upperBand - middleBand);

// BUY confidence
if (distanceFromLower < 0.2) {
  confidence = 0.90;  // Very close to lower band
} else if (distanceFromLower < 0.4) {
  confidence = 0.75;
} else {
  confidence = 0.60;
}

// SELL confidence
if (distanceFromUpper < 0.2) {
  confidence = 0.90;  // Very close to upper band
} else if (distanceFromUpper < 0.4) {
  confidence = 0.75;
} else {
  confidence = 0.60;
}
```

### Configuration

```json
{
  "id": 2,
  "name": "Bollinger Bands Breakout",
  "type": "bollinger",
  "enabled": true,
  "parameters": {
    "period": 20,
    "std_dev_multiplier": 2
  }
}
```

### When to Use

- **Ranging markets**: Excellent for sideways price action
- **High volatility**: Bands expand/contract with volatility
- **Mean reversion**: Assumes prices return to average

### Strengths

✅ Adapts to volatility (bands widen in volatile markets)  
✅ Clear entry/exit signals (band touches)  
✅ Visual and quantifiable

### Weaknesses

❌ Trend breakouts can result in losses (price stays outside bands)  
❌ Requires 20+ data points for stability  
❌ Less effective in strong trending markets

---

## Strategy 3: MACD (Moving Average Convergence Divergence)

### Description

Uses exponential moving averages (EMAs) to identify momentum shifts and trend changes through crossovers and histogram analysis.

### Indicators

**MACD Line**:
- Fast EMA: 12 periods
- Slow EMA: 26 periods
- MACD = Fast EMA - Slow EMA

**Signal Line**:
- EMA of MACD: 9 periods

**Histogram**:
- MACD - Signal Line
- Positive = bullish momentum
- Negative = bearish momentum

### Signal Logic

**BUY Signal**:
```
1. MACD crosses above Signal Line
2. Histogram turns positive (momentum increasing)
3. MACD > 0 (bullish trend)
```

**SELL Signal**:
```
1. MACD crosses below Signal Line
2. Histogram turns negative (momentum decreasing)
3. MACD < 0 (bearish trend)
```

**Confidence Calculation**:
```javascript
// Histogram strength determines confidence
const histogramStrength = Math.abs(histogram) / Math.abs(macd);

// BUY confidence
if (macd > signalLine && histogram > 0 && macd > 0) {
  confidence = 0.90;  // All bullish signals
} else if (macd > signalLine && histogram > 0) {
  confidence = 0.75;
} else if (macd > signalLine) {
  confidence = 0.60;
}

// SELL confidence
if (macd < signalLine && histogram < 0 && macd < 0) {
  confidence = 0.90;  // All bearish signals
} else if (macd < signalLine && histogram < 0) {
  confidence = 0.75;
} else if (macd < signalLine) {
  confidence = 0.60;
}
```

### Configuration

```json
{
  "id": 3,
  "name": "MACD Momentum",
  "type": "macd",
  "enabled": true,
  "parameters": {
    "fast_ema": 12,
    "slow_ema": 26,
    "signal_ema": 9
  }
}
```

### When to Use

- **Trending markets**: Excellent for identifying trend changes
- **Momentum trading**: Captures strong moves early
- **Medium-term**: Works on 1-hour to daily timeframes

### Strengths

✅ Responds faster than SMA-based strategies (uses EMAs)  
✅ Histogram provides momentum strength  
✅ Crossovers are clear, actionable signals

### Weaknesses

❌ Can generate false signals in choppy markets  
❌ Requires 26+ data points for accuracy  
❌ Lagging indicator (based on moving averages)

---

## Strategy Comparison

| Feature | RSI + SMA | Bollinger Bands | MACD |
|---------|-----------|-----------------|------|
| **Best Market** | Trending | Ranging | Trending |
| **Volatility** | Medium | High | Medium |
| **Response Time** | Slow | Medium | Fast |
| **Data Required** | 20+ | 20+ | 26+ |
| **Complexity** | High | Medium | Medium |
| **False Signals** | Low | Medium | Medium |
| **Trend Following** | ✅ | ❌ | ✅ |
| **Mean Reversion** | ❌ | ✅ | ❌ |

---

## Multi-Strategy Usage

### Sequential Strategies

Use different strategies for different assets:

```json
// tokens.json
[
  { "id": "BTC_USDT", "strategyId": 1 },
  { "id": "ETH_USDT", "strategyId": 2 },
  { "id": "GOLD_USDT", "strategyId": 3 }
]

// users.json
{
  "strategies": [1, 2, 3],
  "strategyAssignment": {
    "BTC_USDT": 1,
    "ETH_USDT": 2,
    "GOLD_USDT": 3
  }
}
```

### Portfolio Strategy (Future Enhancement)

Combine signals from multiple strategies:

```javascript
// Example: Require 2/3 strategies to agree
const strategy1 = resolver.getSignal(1, priceHistory, asset);
const strategy2 = resolver.getSignal(2, priceHistory, asset);
const strategy3 = resolver.getSignal(3, priceHistory, asset);

const buyVotes = [strategy1, strategy2, strategy3]
  .filter(s => s.signal === 'BUY').length;

if (buyVotes >= 2) {
  executeTrade('BUY');
}
```

### Confidence Filtering

Only trade when confidence exceeds threshold:

```javascript
const signal = resolver.getSignal(strategyId, priceHistory, asset);

if (signal.confidence >= 0.75) {
  executeTrade(signal.signal);
} else {
  console.log(`Signal confidence too low: ${signal.confidence}`);
}
```

---

## Strategy Customization

### Modifying Parameters

Edit [strategies.json](backend/node/config/strategies.json):

```json
{
  "id": 1,
  "parameters": {
    "rsi_period": 10,       // More sensitive (default: 14)
    "sma_short": 5,         // Faster crossovers (default: 10)
    "sma_long": 15          // Faster crossovers (default: 20)
  }
}
```

**Effects**:
- Lower periods = more signals, more false positives
- Higher periods = fewer signals, more reliable

### Testing Parameters

Use backtesting engine to validate changes:

```bash
node backend/node/backtest.js --strategy 1 --data backtest/data/btc_historical.csv
```

Compare metrics:
- Win rate
- Total profit
- Max drawdown
- Sharpe ratio

### Creating New Strategies

Add to [strategy_resolver.js](backend/node/strategy_resolver.js):

```javascript
_strategyCustom(priceHistory, asset, strategyConfig) {
  // Your custom logic here
  const price = priceHistory[priceHistory.length - 1];
  
  // Calculate indicators
  const indicator1 = this._calculateCustomIndicator(priceHistory);
  
  // Generate signal
  let signal = 'HOLD';
  let confidence = 0.5;
  
  if (indicator1 > threshold) {
    signal = 'BUY';
    confidence = 0.80;
  }
  
  return {
    signal,
    reason: 'Custom indicator triggered',
    confidence,
    strategyId: 4,
    strategyName: 'Custom Strategy',
    indicators: { indicator1 }
  };
}
```

Then register in strategies.json:

```json
{
  "id": 4,
  "name": "Custom Strategy",
  "type": "custom",
  "enabled": true,
  "parameters": {
    "threshold": 100
  }
}
```

---

## Strategy Performance Analysis

### Logging Strategy Results

All trades log strategy ID:

```json
{
  "timestamp": "2024-12-20T10:30:00.000Z",
  "asset": "BTC_USDT",
  "strategyId": 1,
  "strategyName": "RSI + SMA Crossover",
  "signal": "BUY",
  "confidence": 0.85,
  "profit": "0.05 ETH"
}
```

### Querying Strategy Performance

```javascript
const { getInstance } = require('./data_access');
const dataAccess = getInstance();

// Get all trades for Strategy 1
const strategy1Trades = await dataAccess.query(
  'logs.trades',
  trade => trade.strategyId === 1
);

// Calculate win rate
const wins = strategy1Trades.filter(t => t.profit > 0).length;
const winRate = wins / strategy1Trades.length;

console.log(`Strategy 1 Win Rate: ${(winRate * 100).toFixed(2)}%`);
```

### Strategy Analytics Report

Run analytics script:

```bash
node backend/node/reports.js
```

Output:
```
Strategy Performance Report
===========================

Strategy 1 (RSI + SMA):
  Total Trades: 45
  Win Rate: 68.89%
  Total Profit: +5.2 ETH
  Avg Confidence: 0.78

Strategy 2 (Bollinger):
  Total Trades: 38
  Win Rate: 55.26%
  Total Profit: +2.1 ETH
  Avg Confidence: 0.82

Strategy 3 (MACD):
  Total Trades: 32
  Win Rate: 71.88%
  Total Profit: +4.5 ETH
  Avg Confidence: 0.85
```

---

## Advanced Strategy Concepts

### Adaptive Parameters

Adjust strategy parameters based on market conditions:

```javascript
// Example: Increase RSI sensitivity in high volatility
const volatility = calculateVolatility(priceHistory);

let rsiPeriod = 14;
if (volatility > 0.05) {
  rsiPeriod = 10;  // More sensitive in volatile markets
}

const rsi = this._calculateRSI(priceHistory, rsiPeriod);
```

### Strategy Rotation

Switch strategies based on market regime:

```javascript
// Example: Use Bollinger in ranging markets, MACD in trending
const trend = detectTrend(priceHistory);

let strategyId;
if (trend === 'ranging') {
  strategyId = 2;  // Bollinger Bands
} else if (trend === 'trending') {
  strategyId = 3;  // MACD
} else {
  strategyId = 1;  // Default RSI + SMA
}
```

### Signal Filtering

Additional filters to reduce false signals:

```javascript
// Volume filter (if volume data available)
if (signal.signal === 'BUY' && volume < avgVolume * 0.5) {
  signal.signal = 'HOLD';
  signal.reason = 'Low volume, signal ignored';
}

// Time-of-day filter
const hour = new Date().getHours();
if (hour < 8 || hour > 22) {
  signal.signal = 'HOLD';
  signal.reason = 'Outside trading hours';
}

// Consecutive loss filter
if (consecutiveLosses >= 3) {
  signal.signal = 'HOLD';
  signal.reason = 'Risk manager: too many losses';
}
```

---

## Backtesting Strategies

### Running Backtests

```bash
# Test Strategy 1 on BTC data
node backend/node/backtest.js \
  --strategy 1 \
  --data backtest/data/btc_historical.csv \
  --initial-balance 10000 \
  --trade-amount 100

# Output saved to backtest/results/
```

### Interpreting Results

```json
{
  "strategyId": 1,
  "strategyName": "RSI + SMA Crossover",
  "metrics": {
    "totalTrades": 156,
    "wins": 98,
    "losses": 58,
    "winRate": 0.6282,
    "totalProfit": 1245.32,
    "totalLoss": -823.45,
    "netProfit": 421.87,
    "profitFactor": 1.51,
    "maxDrawdown": -234.56,
    "sharpeRatio": 1.23,
    "avgProfit": 2.70,
    "avgLoss": -14.20
  }
}
```

**Key Metrics**:
- **Win Rate**: 62.82% (good if >55%)
- **Profit Factor**: 1.51 (total profit / total loss, good if >1.3)
- **Max Drawdown**: -234.56 (largest peak-to-trough decline)
- **Sharpe Ratio**: 1.23 (risk-adjusted return, good if >1.0)

### Comparing Strategies

Run all strategies on same data:

```bash
for i in 1 2 3; do
  node backend/node/backtest.js --strategy $i --data btc_historical.csv
done

# Compare results in backtest/results/
```

---

## Best Practices

### 1. Start with One Strategy

Test thoroughly before adding more:

```json
{
  "strategies": [
    { "id": 1, "enabled": true },
    { "id": 2, "enabled": false },
    { "id": 3, "enabled": false }
  ]
}
```

### 2. Match Strategy to Market

- **Trending**: Use Strategy 1 (RSI + SMA) or 3 (MACD)
- **Ranging**: Use Strategy 2 (Bollinger Bands)
- **Unknown**: Backtest all 3, choose highest Sharpe ratio

### 3. Use Confidence Thresholds

Filter low-confidence signals:

```javascript
if (signal.confidence < 0.70) {
  return 'HOLD';
}
```

### 4. Monitor Performance

Review strategy analytics weekly:

```bash
node backend/node/reports.js --weekly
```

Disable underperforming strategies.

### 5. Backtest Before Live Trading

Always backtest parameter changes:

```bash
node backend/node/backtest.js --strategy 1 --data recent_data.csv
```

Compare:
- Win rate (should be >55%)
- Sharpe ratio (should be >1.0)
- Max drawdown (should be <20% of balance)

---

## Troubleshooting

### Strategy Returns HOLD Constantly

**Possible Causes**:
1. Insufficient price history (need 20-26 data points)
2. Parameters too conservative
3. Market is truly sideways

**Solutions**:
```javascript
// Check price history length
console.log(`Price history: ${priceHistory.length} points`);

// Lower thresholds temporarily for testing
// In strategies.json:
{
  "parameters": {
    "rsi_period": 10  // Instead of 14
  }
}
```

### Too Many False Signals

**Solutions**:
1. Increase confidence threshold
2. Add additional filters (volume, time-of-day)
3. Use higher parameter periods (slower signals)

```json
{
  "parameters": {
    "rsi_period": 20,  // Slower, more reliable (default: 14)
    "sma_long": 30     // Wider separation (default: 20)
  }
}
```

### Strategy Underperforming

**Steps**:
1. Run backtest on historical data
2. Compare with other strategies
3. Adjust parameters
4. Consider market regime mismatch

```bash
# Run comprehensive backtest
node backend/node/backtest.js \
  --strategy 1 \
  --data backtest/data/btc_1year.csv \
  --output detailed_analysis.json
```

---

**Next Steps**:
- Choose appropriate strategy for your market
- Configure strategies.json parameters
- Run backtests to validate
- Monitor performance and iterate
- See [BACKTESTING_GUIDE.md](BACKTESTING_GUIDE.md) for detailed testing instructions
