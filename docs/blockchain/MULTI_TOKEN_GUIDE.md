# 🪙 Multi-Token Trading Guide

## Overview

QIE Sentinel supports simultaneous trading across multiple token pairs with independent configurations per asset.

---

## Configuration Structure

### tokens.json Format

```json
[
  {
    "id": "BTC_USDT",
    "name": "Bitcoin / USDT",
    "tokenIn": "0x...",
    "tokenOut": "0x...",
    "oracleFeed": "0x...",
    "enabled": true,
    "tradeAmount": "100000000000000000000",
    "minOutput": "95000000000000000000",
    "maxSlippageBps": 300
  }
]
```

### Field Descriptions

| Field | Type | Description |
|-------|------|-------------|
| `id` | string | Unique identifier (used in logs) |
| `name` | string | Human-readable name |
| `tokenIn` | address | Input token contract address |
| `tokenOut` | address | Output token contract address |
| `oracleFeed` | address | Chainlink oracle for this pair |
| `enabled` | boolean | Enable/disable trading for this asset |
| `tradeAmount` | string | Wei amount to trade (18 decimals) |
| `minOutput` | string | Minimum output after slippage (18 decimals) |
| `maxSlippageBps` | number | Maximum slippage in basis points (300 = 3%) |

---

## Asset Rotation Strategies

### 1. Round-Robin (Default)

Cycles through enabled tokens sequentially:

```
Cycle 1: BTC_USDT
Cycle 2: ETH_USDT
Cycle 3: GOLD_USDT
Cycle 4: BTC_USDT (repeat)
```

**Configuration**:
```json
{
  "trading": {
    "assetRotation": "round-robin"
  }
}
```

**Pros**: Equal attention to all assets  
**Cons**: May miss opportunities in fast-moving assets

### 2. Weighted Rotation (Future)

More frequent checks on higher-priority assets:

```
Cycle 1-2: BTC_USDT
Cycle 3: ETH_USDT
Cycle 4: GOLD_USDT
```

**Configuration**:
```json
{
  "trading": {
    "assetRotation": "weighted",
    "weights": {
      "BTC_USDT": 2,
      "ETH_USDT": 1,
      "GOLD_USDT": 1
    }
  }
}
```

### 3. Volatility-Based (Future)

Focus on assets with highest recent volatility:

```javascript
// Prioritize assets with highest price change
const volatility = calculateVolatility(priceHistory);
nextAsset = assets.sort((a, b) => b.volatility - a.volatility)[0];
```

---

## Adding New Token Pairs

### Step 1: Find Contract Addresses

**For Mainnet**:
- Use Etherscan to find token addresses
- Example: WETH on Ethereum: `0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2`

**For Testnet (Sepolia)**:
- Use testnet explorers
- Deploy mock tokens if needed

### Step 2: Find Oracle Address

**Chainlink Price Feeds**:
- Visit: https://docs.chain.link/data-feeds/price-feeds/addresses
- Select network (Ethereum, Sepolia, etc.)
- Find oracle for your pair

**Example - Sepolia Oracles**:
```
BTC/USD:  0x1b44F3514812d835EB1BDB0acB33d3fA3351Ee43
ETH/USD:  0x694AA1769357215DE4FAC081bf1f309aDC325306
LINK/USD: 0xc59E3633BAAC79493d908e63626716e204A45EdF
```

### Step 3: Configure tokens.json

```json
{
  "id": "LINK_USDT",
  "name": "Chainlink / USDT",
  "tokenIn": "0x326C977E6efc84E512bB9C30f76E30c160eD06FB",
  "tokenOut": "0x0Fb5D7c73FA349A90392f873a4FA1eCf6a3d0a96",
  "oracleFeed": "0xc59E3633BAAC79493d908e63626716e204A45EdF",
  "enabled": true,
  "tradeAmount": "1000000000000000000",
  "minOutput": "950000000000000000",
  "maxSlippageBps": 500
}
```

### Step 4: Set Trade Amounts

**Calculate Wei Values**:
```javascript
// For 100 USDT (6 decimals)
const amount = 100 * 10**6; // 100000000

// For 0.1 ETH (18 decimals)
const amount = 0.1 * 10**18; // 100000000000000000
```

**Quick Reference**:
```
1 token (18 decimals)   = 1000000000000000000
0.1 tokens (18 decimals) = 100000000000000000
10 tokens (18 decimals)  = 10000000000000000000
100 tokens (6 decimals)  = 100000000
```

### Step 5: Test Configuration

```bash
# Validate JSON syntax
node -e "console.log(JSON.parse(require('fs').readFileSync('backend/node/config/tokens.json')))"

# Test backend loading
node backend/node/index_v2.js
# Look for: "Loaded 4 tokens"
```

---

## Per-Asset State Tracking

Each asset maintains independent state:

```javascript
assetStates = {
  'BTC_USDT': {
    config: { /* token config */ },
    priceHistory: [50000, 50100, 50050, ...],
    lastTradeTime: 1703012345678,
    lastTradeType: 'BUY',
    lastPrice: 50075,
    tradeCount: 15
  },
  'ETH_USDT': {
    // Independent state
  }
}
```

**Isolated History**: Each asset has its own price history for indicators

**Independent Cooldowns**: Overtrading prevention per asset

**Separate Counters**: Trade counts tracked individually

---

## Risk Management Per Asset

### Global Limits (Apply to All Assets)

- Daily loss limit (% of total balance)
- Kill switch (consecutive failures across all assets)
- Maximum trades per day (total)

### Per-Asset Limits

- Slippage tolerance (configured in tokens.json)
- Minimum time between trades for same asset
- Price staleness checks (oracle-based)

### Configuration Example

```json
{
  "risk": {
    "killSwitch": {
      "enabled": true,
      "maxConsecutiveFailures": 3
    },
    "dailyLossLimit": {
      "enabled": true,
      "maxLossPercent": 5.0
    },
    "overtrading": {
      "enabled": true,
      "minTimeBetweenTradesMs": 600000
    }
  }
}
```

---

## Oracle Configuration

### Per-Asset Oracles

Each token pair requires its own Chainlink oracle:

```json
{
  "id": "BTC_USDT",
  "oracleFeed": "0x1b44F3514812d835EB1BDB0acB33d3fA3351Ee43"
}
```

### Oracle Validation

**Staleness Check**:
```javascript
// Reject prices older than 1 hour
const STALENESS_THRESHOLD = 3600;
if (updatedAt < now - STALENESS_THRESHOLD) {
  throw new Error('Oracle price too stale');
}
```

**Price Deviation Check**:
```javascript
// Alert if oracle differs from executed price by >5%
const deviation = Math.abs(oraclePrice - executedPrice) / oraclePrice;
if (deviation > 0.05) {
  console.warn('Significant price deviation detected');
}
```

### Oracle Setup Script

```bash
# Configure oracles for all tokens
npx hardhat run scripts/setup-oracles.js --network sepolia
```

This script:
1. Reads tokens.json
2. For each enabled token, calls `Executor.setOracle(tokenIn, oracleFeed)`
3. Verifies oracle responsiveness

---

## Multi-Token Trading Patterns

### Pattern 1: Diversification

Trade multiple uncorrelated assets to reduce risk:

```json
[
  { "id": "BTC_USDT", "enabled": true },
  { "id": "GOLD_USDT", "enabled": true },
  { "id": "STOCK_USDT", "enabled": true }
]
```

### Pattern 2: Volatility Focus

Enable only high-volatility assets:

```json
[
  { "id": "BTC_USDT", "enabled": true, "maxSlippageBps": 500 },
  { "id": "ETH_USDT", "enabled": true, "maxSlippageBps": 500 },
  { "id": "STABLE_USDT", "enabled": false }
]
```

### Pattern 3: Stable vs. Volatile

Mix stable and volatile assets:

```json
[
  { "id": "BTC_USDT", "tradeAmount": "50000000000000000000", "maxSlippageBps": 500 },
  { "id": "DAI_USDC", "tradeAmount": "100000000000000000000", "maxSlippageBps": 50 }
]
```

---

## Performance Considerations

### Memory Usage

**Price History Size**:
```javascript
const MAX_PRICE_HISTORY = 100; // Per asset
// 5 assets * 100 prices * 8 bytes = 4KB
```

**Recommendation**: Limit enabled tokens to 3-5 for optimal performance

### Cycle Time Impact

- 1 token: ~1 second per cycle
- 3 tokens: ~1 second per cycle (same, rotation)
- 5 tokens: ~1 second per cycle
- 10 tokens: Consider multiple backend instances

### RPC Rate Limits

**Alchemy/Infura Free Tier**:
- ~100 requests per second
- Each trade = ~5 requests

**Calculation**:
```
5 tokens * 5 requests * 4 cycles/min = 100 requests/min (safe)
10 tokens * 5 requests * 4 cycles/min = 200 requests/min (may hit limits)
```

---

## Monitoring Multi-Token Performance

### Per-Asset Metrics

Track in logs/trades.json:

```json
{
  "asset": "BTC_USDT",
  "trades": 45,
  "wins": 30,
  "losses": 15,
  "winRate": 0.67,
  "totalProfit": "5.2 ETH"
}
```

### Analytics Query

```javascript
const { getInstance } = require('./data_access');
const dataAccess = getInstance();

// Get all BTC trades
const btcTrades = await dataAccess.query(
  'logs.trades',
  trade => trade.asset === 'BTC_USDT'
);

// Calculate win rate
const wins = btcTrades.filter(t => t.profit > 0).length;
const winRate = wins / btcTrades.length;
```

### Dashboard View

```
Asset        | Trades | Win Rate | Profit    | Last Trade
-------------|--------|----------|-----------|-------------
BTC_USDT     | 45     | 67%      | +5.2 ETH  | 2m ago
ETH_USDT     | 38     | 55%      | +2.1 ETH  | 30s ago
GOLD_USDT    | 12     | 75%      | +1.5 ETH  | 1m ago
```

---

## Troubleshooting

### Asset Not Trading

**Check 1: Enabled Flag**
```bash
cat backend/node/config/tokens.json | grep -A 5 "BTC_USDT"
# Verify "enabled": true
```

**Check 2: Oracle Configured**
```javascript
// In Executor.sol
const oracleFeed = await executor.priceFeeds(tokenInAddress);
console.log(oracleFeed); // Should not be 0x0000...
```

**Check 3: Sufficient Balance**
```javascript
const balance = await tokenIn.balanceOf(vault.address);
console.log(`Balance: ${ethers.utils.formatEther(balance)} tokens`);
```

### High Slippage Warnings

**Solution 1: Increase maxSlippageBps**
```json
{
  "maxSlippageBps": 500  // 5% instead of 3%
}
```

**Solution 2: Reduce Trade Size**
```json
{
  "tradeAmount": "10000000000000000000"  // 10 tokens instead of 100
}
```

**Solution 3: Check Liquidity**
- Use DEX analytics (Uniswap Info, etc.)
- Verify pool depth
- Consider alternative pairs

### Oracle Staleness Errors

**Check Oracle Responsiveness**:
```bash
npx hardhat console --network sepolia
> const oracle = await ethers.getContractAt('AggregatorV3Interface', '0x1b44...')
> const latest = await oracle.latestRoundData()
> console.log(latest.updatedAt)
```

**Solutions**:
1. Use different oracle (check Chainlink docs)
2. Increase staleness threshold in Executor.sol
3. Switch to different network (mainnet oracles more reliable)

---

## Best Practices

### 1. Start with One Token

Test with a single asset before enabling multiple:

```json
[
  { "id": "BTC_USDT", "enabled": true },
  { "id": "ETH_USDT", "enabled": false },
  { "id": "GOLD_USDT", "enabled": false }
]
```

### 2. Conservative Slippage

Start with tight slippage, increase only if needed:

```json
{
  "maxSlippageBps": 300  // 3% is reasonable starting point
}
```

### 3. Monitor Correlation

Avoid highly correlated assets (reduces diversification):
- ❌ BTC_USDT + BTC_EUR (highly correlated)
- ✅ BTC_USDT + GOLD_USDT (low correlation)

### 4. Incremental Enablement

Enable tokens one at a time, monitor for 24-48 hours:

```
Day 1: BTC_USDT
Day 3: + ETH_USDT
Day 5: + GOLD_USDT
```

### 5. Rebalance Trade Amounts

Adjust amounts based on performance:

```json
{
  "id": "BTC_USDT",
  "tradeAmount": "100000000000000000000",  // Increase if high win rate
}
```

---

## Example Configurations

### Conservative (2 Stable Assets)

```json
[
  {
    "id": "WETH_USDT",
    "name": "Wrapped Ether / USDT",
    "enabled": true,
    "tradeAmount": "50000000000000000",
    "maxSlippageBps": 200
  },
  {
    "id": "WBTC_USDT",
    "name": "Wrapped Bitcoin / USDT",
    "enabled": true,
    "tradeAmount": "50000000000000000",
    "maxSlippageBps": 200
  }
]
```

### Aggressive (5 Volatile Assets)

```json
[
  { "id": "SHIB_USDT", "maxSlippageBps": 1000 },
  { "id": "DOGE_USDT", "maxSlippageBps": 1000 },
  { "id": "PEPE_USDT", "maxSlippageBps": 1000 },
  { "id": "FLOKI_USDT", "maxSlippageBps": 1000 },
  { "id": "BONK_USDT", "maxSlippageBps": 1000 }
]
```

### Balanced (3 Mixed Assets)

```json
[
  { "id": "ETH_USDT", "tradeAmount": "100", "maxSlippageBps": 300 },
  { "id": "LINK_USDT", "tradeAmount": "50", "maxSlippageBps": 400 },
  { "id": "DAI_USDC", "tradeAmount": "200", "maxSlippageBps": 50 }
]
```

---

**Next Steps**: 
- Configure your tokens.json
- Test with one asset
- Monitor performance
- Gradually enable more assets
- See [STRATEGY_GUIDE.md](STRATEGY_GUIDE.md) for multi-strategy setup
