# 📈 Backtesting Guide

## Overview

The QIE Sentinel backtesting engine simulates trading strategies on historical data to validate performance before live deployment.

---

## Quick Start

```bash
# Basic backtest
cd backend/node
node backtest.js --strategy 1 --data backtest/data/sample_prices.csv

# Advanced backtest with options
node backtest.js \
  --strategy 2 \
  --data backtest/data/btc_2023.csv \
  --initial-balance 10000 \
  --trade-amount 100 \
  --slippage 0.002 \
  --fee 0.003 \
  --output results/btc_bollinger_2023.json
```

---

## Data Format

### CSV Structure

**Required Format**:
```csv
timestamp,price
1703001600000,50000.25
1703005200000,50125.50
1703008800000,50050.75
```

**Field Descriptions**:
- `timestamp`: Unix timestamp in milliseconds
- `price`: Asset price in USD (or quote currency)

### Example Data

**Sample 24-Hour Data** ([sample_prices.csv](backend/node/backtest/data/sample_prices.csv)):
```csv
timestamp,price
1703001600000,50000
1703005200000,50100
1703008800000,50050
1703012400000,50200
1703016000000,50150
```

### Data Sources

**1. Exchanges (Free APIs)**:
```bash
# Binance Historical Data
curl "https://api.binance.com/api/v3/klines?symbol=BTCUSDT&interval=1h&limit=1000" \
  | jq -r '.[] | [.[0], .[4]] | @csv' > btc_historical.csv
```

**2. CoinGecko**:
```bash
# Last 365 days of hourly data
curl "https://api.coingecko.com/api/v3/coins/bitcoin/market_chart?vs_currency=usd&days=365&interval=hourly" \
  | jq -r '.prices[] | [.[0], .[1]] | @csv' > btc_365d.csv
```

**3. TradingView Exports**:
- Open TradingView chart
- Right-click → Export chart data
- Save as CSV with timestamp, price columns

**4. Generate Synthetic Data**:
```javascript
// Generates realistic price movements
node backtest.js --generate-sample --days 365 --volatility 0.02
```

---

## Running Backtests

### Basic Usage

```javascript
const BacktestEngine = require('./backtest');
const engine = new BacktestEngine();

// Load data
const data = engine.loadHistoricalData('backtest/data/btc_2023.csv');

// Run backtest
const results = await engine.runBacktest(1, data, {
  initialBalance: 10000,
  tradeAmount: 100,
  slippage: 0.001,
  fee: 0.003
});

// Display results
engine.generateReport(results);
```

### CLI Usage

```bash
node backtest.js --help

Options:
  --strategy <id>         Strategy ID (1, 2, or 3)
  --data <file>          Path to CSV data file
  --initial-balance <n>  Starting balance (default: 10000)
  --trade-amount <n>     Amount per trade (default: 100)
  --slippage <n>         Slippage percentage (default: 0.001)
  --fee <n>              Trading fee percentage (default: 0.003)
  --output <file>        Output JSON file path
  --verbose              Show detailed trade log
  --generate-sample      Generate synthetic data
```

### Examples

**Test RSI + SMA Strategy**:
```bash
node backtest.js \
  --strategy 1 \
  --data btc_2023.csv \
  --initial-balance 10000 \
  --verbose
```

**Compare Multiple Strategies**:
```bash
for i in 1 2 3; do
  node backtest.js --strategy $i --data btc_2023.csv --output results/strategy_$i.json
done

# Compare results
node compare_results.js results/strategy_*.json
```

**Test with High Slippage** (simulate low liquidity):
```bash
node backtest.js \
  --strategy 2 \
  --data btc_2023.csv \
  --slippage 0.005 \
  --fee 0.005
```

---

## Understanding Results

### Metrics Explained

#### 1. Total Trades
```
Total number of executed trades (BUY + SELL)
```
**Good**: 50-200 trades per year  
**Too Few**: <20 (strategy too conservative)  
**Too Many**: >500 (overtrading, high fees)

#### 2. Win Rate
```
Percentage of profitable trades
```
**Formula**: `wins / (wins + losses)`

**Interpretation**:
- **>60%**: Excellent
- **55-60%**: Good
- **50-55%**: Acceptable (if profit factor is good)
- **<50%**: Poor (strategy needs adjustment)

#### 3. Total Profit & Loss
```
Sum of all profitable trades
Sum of all losing trades
```
**Net Profit** = Total Profit + Total Loss

**Example**:
```
Total Profit: +$2,450.00
Total Loss:   -$1,320.00
Net Profit:   +$1,130.00
```

#### 4. Profit Factor
```
Ratio of total profit to total loss
```
**Formula**: `totalProfit / abs(totalLoss)`

**Interpretation**:
- **>2.0**: Excellent (profits are 2x losses)
- **1.5-2.0**: Good
- **1.2-1.5**: Acceptable
- **<1.2**: Poor (barely profitable)
- **<1.0**: Losing strategy

#### 5. Average Profit & Loss
```
Average gain per winning trade
Average loss per losing trade
```
**Example**:
```
Avg Profit: +$35.50 per win
Avg Loss:   -$22.75 per loss
```

**Good**: Avg profit > Avg loss (even if win rate <50%)

#### 6. Max Drawdown
```
Largest peak-to-trough decline in equity
```
**Formula**: `max((peak - trough) / peak)`

**Example**:
```
Balance peaks at $12,000
Falls to $10,200
Drawdown: ($12,000 - $10,200) / $12,000 = 15%
```

**Interpretation**:
- **<10%**: Excellent
- **10-20%**: Good
- **20-30%**: Acceptable
- **>30%**: High risk (consider reducing trade size)

#### 7. Sharpe Ratio
```
Risk-adjusted return measure
```
**Formula**: `(avgReturn - riskFreeRate) / stdDevReturns`

**Interpretation**:
- **>2.0**: Excellent
- **1.0-2.0**: Good
- **0.5-1.0**: Acceptable
- **<0.5**: Poor risk-adjusted returns

**Note**: Higher is better. Compares returns to volatility.

### Example Report

```
=== Backtest Results ===

Strategy: RSI + SMA Crossover (ID: 1)
Period: Jan 1, 2023 - Dec 31, 2023
Data Points: 8,760 (1 year hourly)

--- Trading Metrics ---
Total Trades: 156
Wins: 98 (62.82%)
Losses: 58 (37.18%)

--- Financial Performance ---
Initial Balance: $10,000.00
Final Balance: $11,340.25
Net Profit: +$1,340.25 (+13.40%)

Total Profit: +$2,450.75
Total Loss: -$1,110.50
Profit Factor: 2.21

Avg Profit: +$25.01
Avg Loss: -$19.15
Avg Win/Loss Ratio: 1.31

--- Risk Metrics ---
Max Drawdown: -$456.30 (-4.12%)
Max Consecutive Wins: 8
Max Consecutive Losses: 4
Sharpe Ratio: 1.68

--- Performance ---
Return: +13.40%
Annualized Return: +13.40%
Volatility: 7.98%
Best Trade: +$85.50
Worst Trade: -$62.20

=== Recommendation ===
✅ Strategy shows positive returns with acceptable risk.
✅ Win rate above 60% is excellent.
✅ Profit factor >2.0 indicates strong edge.
✅ Max drawdown <5% is very conservative.
⚠️  Consider increasing trade size for higher returns.
```

---

## Interpreting Signals

### Trade Log Format

When running with `--verbose`:

```
=== Trade Log ===

[1] 2023-01-15 08:00:00
Signal: BUY
Price: $50,125.50
Confidence: 0.85
RSI: 28.5 (oversold)
SMA Short: 50,100 > SMA Long: 49,950 (golden cross)
Position: LONG opened
Balance: $10,000 → $9,900 (trade amount: $100)

[2] 2023-01-15 14:00:00
Signal: SELL
Price: $50,450.25
Confidence: 0.90
RSI: 72.3 (overbought)
SMA Short: 50,425 < SMA Long: 50,500 (death cross)
Position: LONG closed
Profit: +$3.24 (after slippage & fees)
Balance: $9,900 → $10,003.24

[3] 2023-01-16 02:00:00
Signal: BUY
Price: $50,200.00
Confidence: 0.75
RSI: 32.1 (oversold)
Position: LONG opened
Balance: $10,003.24 → $9,903.24

[4] 2023-01-16 10:00:00
Signal: SELL
Price: $49,950.00
Confidence: 0.80
RSI: 68.5
Position: LONG closed
Profit: -$2.51 (loss)
Balance: $9,903.24 → $9,900.73
```

### Signal Quality Analysis

**High Confidence Signals** (>0.85):
- Multiple indicators align
- Strong overbought/oversold conditions
- Clear trend direction

**Medium Confidence** (0.70-0.85):
- 2 out of 3 indicators align
- Moderate conditions
- Some trend ambiguity

**Low Confidence** (<0.70):
- Only 1 indicator triggered
- Weak signals
- Often result in HOLD

**Recommendation**: Filter trades by confidence threshold

```javascript
// Only execute high-confidence trades
if (signal.confidence >= 0.80) {
  executeTrade(signal);
} else {
  console.log('Skipping low-confidence signal');
}
```

---

## Optimization Techniques

### 1. Parameter Sweeping

Test multiple parameter combinations:

```bash
# Test different RSI periods
for rsi in 10 12 14 16 18 20; do
  # Edit strategies.json
  sed -i "s/\"rsi_period\": [0-9]*/\"rsi_period\": $rsi/" config/strategies.json
  
  # Run backtest
  node backtest.js --strategy 1 --data btc_2023.csv --output results/rsi_$rsi.json
done

# Find best parameter
node find_best_params.js results/rsi_*.json
```

### 2. Walk-Forward Analysis

Test on sequential time periods:

```bash
# Train on Q1, test on Q2
node backtest.js --strategy 1 --data q1_data.csv --optimize
node backtest.js --strategy 1 --data q2_data.csv

# Train on Q2, test on Q3
node backtest.js --strategy 1 --data q2_data.csv --optimize
node backtest.js --strategy 1 --data q3_data.csv
```

### 3. Monte Carlo Simulation

Run backtest 1000 times with randomized entry points:

```bash
node backtest.js \
  --strategy 1 \
  --data btc_2023.csv \
  --monte-carlo 1000 \
  --output monte_carlo_results.json
```

**Analyzes**:
- Consistency across different time periods
- Robustness to entry timing
- Confidence intervals for returns

### 4. Cross-Validation

Test on multiple assets:

```bash
# Test on BTC, ETH, LINK
for asset in btc eth link; do
  node backtest.js --strategy 1 --data ${asset}_2023.csv --output results/${asset}_results.json
done

# Average results across assets
node average_results.js results/*_results.json
```

---

## Common Pitfalls

### 1. Overfitting

**Problem**: Strategy performs perfectly on historical data but fails live

**Causes**:
- Too many parameters
- Optimized on limited data
- Curve-fitting to specific period

**Solutions**:
```bash
# Test on out-of-sample data
node backtest.js --strategy 1 --data 2022_data.csv  # Train
node backtest.js --strategy 1 --data 2023_data.csv  # Test (never seen before)

# Keep strategies simple
# Use standard parameters (RSI=14, SMA=20/50, etc.)
```

### 2. Look-Ahead Bias

**Problem**: Using future data to make past decisions

**Example**:
```javascript
// WRONG: Uses future price to decide current trade
if (priceHistory[i] < priceHistory[i+1]) {
  signal = 'BUY';  // Cheating!
}

// CORRECT: Only uses past data
const rsi = calculateRSI(priceHistory.slice(0, i));
if (rsi < 30) {
  signal = 'BUY';
}
```

**QIE Sentinel Protection**:
- Strategy resolver only receives past prices
- No access to future data
- Indicators calculated from historical window

### 3. Survivorship Bias

**Problem**: Testing only on assets that succeeded

**Example**:
- Backtesting on BTC (which grew 1000x)
- Ignoring 100 failed altcoins

**Solution**:
```bash
# Test on multiple assets, including "losers"
node backtest.js --strategy 1 --data btc_2023.csv
node backtest.js --strategy 1 --data failed_token_2023.csv
```

### 4. Unrealistic Assumptions

**Problem**: Backtest assumes perfect conditions

**Examples**:
- Zero slippage
- Instant execution
- No downtime
- Always-available liquidity

**QIE Sentinel Realism**:
```javascript
// Simulates real-world conditions
const slippage = 0.001;  // 0.1% slippage
const fee = 0.003;       // 0.3% trading fee
const executionDelay = 1; // 1-period delay
```

Adjust for harsher conditions:
```bash
node backtest.js --slippage 0.005 --fee 0.005  # More realistic for low liquidity
```

### 5. Insufficient Data

**Problem**: Testing on too little historical data

**Minimum Recommendations**:
- **RSI + SMA**: 30 days (720 hours)
- **Bollinger Bands**: 30 days
- **MACD**: 45 days (1080 hours)

**Ideal**:
- **1 year** for single-asset testing
- **3+ years** for robust validation

---

## Advanced Analysis

### Equity Curve Analysis

Plot balance over time:

```javascript
// Generate equity curve data
node backtest.js --strategy 1 --data btc_2023.csv --equity-curve equity.csv

// Plot with gnuplot or Python
gnuplot -e "plot 'equity.csv' with lines"
```

**Look For**:
- Smooth upward trend (good)
- Sharp drops (investigate losing periods)
- Flat periods (strategy not working)

### Drawdown Analysis

Identify worst performing periods:

```javascript
const drawdowns = results.drawdowns.sort((a, b) => b.percent - a.percent);

console.log('Top 5 Drawdowns:');
drawdowns.slice(0, 5).forEach((dd, i) => {
  console.log(`${i+1}. ${dd.percent.toFixed(2)}% from ${dd.startDate} to ${dd.endDate}`);
});
```

**Action**:
- Analyze market conditions during drawdowns
- Check if strategy failed in specific regimes
- Consider adding regime filters

### Return Distribution

Analyze profit/loss distribution:

```bash
node analyze_returns.js results/strategy_1.json

Output:
Return Distribution:
  Mean: +$2.45
  Median: +$1.80
  Std Dev: $12.50
  Skewness: 0.35 (slightly right-skewed)
  Kurtosis: 2.80 (normal distribution)
  
Percentiles:
  10%: -$8.50
  25%: -$2.20
  50%: +$1.80
  75%: +$7.30
  90%: +$15.60
```

### Rolling Metrics

Calculate metrics over rolling windows:

```bash
# 90-day rolling Sharpe ratio
node rolling_metrics.js \
  --data results/strategy_1.json \
  --window 90 \
  --metric sharpe

# Output: Time series of Sharpe ratio over time
```

---

## Backtesting Checklist

Before live trading:

- [ ] **Data Quality**
  - [ ] No missing timestamps
  - [ ] No erroneous prices (check for outliers)
  - [ ] Sufficient history (>1 year)
  - [ ] Multiple market conditions covered

- [ ] **Strategy Validation**
  - [ ] Tested on in-sample data (training)
  - [ ] Tested on out-of-sample data (testing)
  - [ ] Tested on multiple assets
  - [ ] Tested across different time periods

- [ ] **Performance Metrics**
  - [ ] Win rate >55%
  - [ ] Profit factor >1.3
  - [ ] Max drawdown <20%
  - [ ] Sharpe ratio >1.0
  - [ ] Positive returns in majority of years

- [ ] **Risk Assessment**
  - [ ] Drawdown periods identified
  - [ ] Worst-case scenarios documented
  - [ ] Stop-loss levels defined
  - [ ] Position sizing appropriate

- [ ] **Realism**
  - [ ] Slippage included (0.1-0.5%)
  - [ ] Trading fees included (0.3%)
  - [ ] Execution delays considered
  - [ ] Overfitting checks performed

---

## Troubleshooting

### No Trades Executed

**Check**:
1. Data has sufficient points (>20 for RSI, >26 for MACD)
2. Strategy confidence threshold not too high
3. Price movements aren't too small

**Debug**:
```bash
node backtest.js --strategy 1 --data sample.csv --verbose --debug
```

### Unrealistic Returns

**Symptoms**: >100% returns with no losses

**Likely Causes**:
- Look-ahead bias
- Data errors (duplicate prices)
- Slippage set to 0

**Fixes**:
```bash
# Increase slippage and fees
node backtest.js --slippage 0.005 --fee 0.005

# Check data quality
node validate_data.js sample.csv
```

### Negative Sharpe Ratio

**Meaning**: Returns don't justify the risk

**Causes**:
- High volatility
- Inconsistent returns
- Poor risk-adjusted performance

**Actions**:
1. Reduce trade frequency
2. Increase confidence threshold
3. Add stop-losses
4. Consider different strategy

---

## Next Steps

1. **Generate Historical Data**:
```bash
# Download BTC data for last year
curl "https://api.coingecko.com/api/v3/coins/bitcoin/market_chart?vs_currency=usd&days=365&interval=hourly" \
  | jq -r '.prices[] | [.[0], .[1]] | @csv' > btc_365d.csv
```

2. **Run Initial Backtest**:
```bash
node backend/node/backtest.js --strategy 1 --data btc_365d.csv --verbose
```

3. **Analyze Results**:
- Review win rate, profit factor, drawdown
- Check equity curve for smoothness
- Identify losing periods

4. **Optimize (If Needed)**:
- Adjust strategy parameters
- Test on out-of-sample data
- Validate improvements are robust

5. **Paper Trade**:
- Deploy on testnet with backtest-validated parameters
- Monitor for 1-2 weeks
- Compare live performance to backtest

6. **Go Live**:
- Start with small position sizes
- Gradually scale up
- Continue monitoring performance

---

**Related Guides**:
- [STRATEGY_GUIDE.md](STRATEGY_GUIDE.md) - Strategy parameter tuning
- [RISK_MANAGEMENT.md](RISK_MANAGEMENT.md) - Risk limits and protections
- [TESTNET_DEPLOYMENT.md](TESTNET_DEPLOYMENT.md) - Safe testing on testnet
