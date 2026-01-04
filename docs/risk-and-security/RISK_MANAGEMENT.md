# 🛡️ Risk Management System

## Overview

QIE Sentinel implements a comprehensive risk management system with multiple layers of protection to prevent catastrophic losses and ensure safe autonomous trading.

---

## Risk Manager Architecture

```
┌──────────────────────────────────────────────────┐
│            Risk Manager                          │
├──────────────────────────────────────────────────┤
│                                                   │
│  ┌─────────────────────────────────────────┐    │
│  │  Layer 1: Kill Switch                   │    │
│  │  - Max consecutive failures: 3          │    │
│  │  - Manual activation supported          │    │
│  │  - Requires manual recovery             │    │
│  └─────────────────────────────────────────┘    │
│                                                   │
│  ┌─────────────────────────────────────────┐    │
│  │  Layer 2: Daily Loss Limit              │    │
│  │  - Max loss: 5% of balance              │    │
│  │  - Resets daily at midnight             │    │
│  │  - Per-user tracking                    │    │
│  └─────────────────────────────────────────┘    │
│                                                   │
│  ┌─────────────────────────────────────────┐    │
│  │  Layer 3: Loss Streak Protection        │    │
│  │  - Halts after 5 consecutive losses     │    │
│  │  - Requires 1 hour cooldown             │    │
│  │  - Or manual override                   │    │
│  └─────────────────────────────────────────┘    │
│                                                   │
│  ┌─────────────────────────────────────────┐    │
│  │  Layer 4: Overtrading Prevention        │    │
│  │  - Min time between trades: 10 minutes  │    │
│  │  - Per-asset cooldowns                  │    │
│  │  - Prevents rapid losses                │    │
│  └─────────────────────────────────────────┘    │
│                                                   │
│  ┌─────────────────────────────────────────┐    │
│  │  Layer 5: Slippage Validation           │    │
│  │  - Compare with oracle price            │    │
│  │  - Max deviation: 3-5%                  │    │
│  │  - Reject excessive slippage            │    │
│  └─────────────────────────────────────────┘    │
│                                                   │
└──────────────────────────────────────────────────┘
```

---

## Layer 1: Kill Switch

### Description

Emergency stop mechanism that halts all trading after repeated failures. Requires manual intervention to recover.

### Configuration

```json
{
  "risk": {
    "killSwitch": {
      "enabled": true,
      "maxConsecutiveFailures": 3,
      "manualRecoveryOnly": true,
      "alertEmails": ["admin@example.com"]
    }
  }
}
```

### Trigger Conditions

1. **Consecutive Failures**: 3 failed trades in a row
2. **Manual Activation**: Admin can activate via command
3. **Critical Errors**: Smart contract reverts, insufficient funds

### Behavior When Active

```javascript
const check = riskManager.canTrade('BTC_USDT', 'user_001');
if (!check.allowed) {
  console.log(check.reason);
  // Output: "Kill switch is active: 3 consecutive failures. Manual recovery required."
}
```

**Blocked Operations**:
- All trade executions
- Signal generation continues (for analysis)
- Price updates continue
- Logs continue writing

### Recovery Process

**Step 1: Identify Root Cause**

```bash
# Check failure logs
cat backend/node/logs/trades.json | grep -A 5 "success\":false"

# Common causes:
# - Insufficient balance
# - Oracle price staleness
# - Network congestion
# - Smart contract issues
```

**Step 2: Fix Issues**

```javascript
// Example fixes:
// - Top up vault balance
// - Update oracle addresses
// - Increase gas price
// - Check contract ownership
```

**Step 3: Manual Recovery**

```javascript
// In node console or custom script
const RiskManager = require('./backend/node/risk_manager');
const manager = new RiskManager(config);

manager.deactivateKillSwitch('Manual review completed, issues resolved');
console.log('Kill switch deactivated');
```

**Step 4: Gradual Restart**

```json
// Start with small trade amounts
{
  "tokens": [
    {
      "id": "BTC_USDT",
      "tradeAmount": "10000000000000000000"  // Reduce from 100 to 10
    }
  ]
}
```

### Testing Kill Switch

```bash
# Simulate failures for testing
node backend/node/test_kill_switch.js

# Expected output:
# Trade 1: FAIL
# Trade 2: FAIL
# Trade 3: FAIL
# Kill switch activated
# Trade 4: BLOCKED (kill switch active)
```

---

## Layer 2: Daily Loss Limit

### Description

Prevents excessive losses by halting trading when daily loss exceeds a percentage threshold.

### Configuration

```json
{
  "risk": {
    "dailyLossLimit": {
      "enabled": true,
      "maxLossPercent": 5.0,
      "resetHour": 0,
      "perUser": true
    }
  }
}
```

### Calculation

```javascript
// At start of day, record balance
const startBalance = await vault.getBalance(user.walletAddress);

// After each trade
const currentBalance = await vault.getBalance(user.walletAddress);
const dailyLoss = startBalance - currentBalance;
const lossPercent = (dailyLoss / startBalance) * 100;

if (lossPercent >= maxLossPercent) {
  riskManager.activateDailyLossProtection();
}
```

### Example Scenario

```
Start of Day Balance: 10 ETH
Max Loss: 5% = 0.5 ETH

Trade 1: -0.1 ETH (total loss: 0.1 ETH) ✅ Continue
Trade 2: -0.2 ETH (total loss: 0.3 ETH) ✅ Continue
Trade 3: -0.15 ETH (total loss: 0.45 ETH) ✅ Continue
Trade 4: -0.1 ETH (total loss: 0.55 ETH) ❌ BLOCKED
```

### Reset Behavior

**Automatic Reset**: Every day at midnight UTC

```javascript
// Internal reset logic
const now = new Date();
if (now.getHours() === 0 && now.getMinutes() === 0) {
  riskManager._resetDailyMetrics();
  console.log('Daily metrics reset');
}
```

**Manual Reset**: Admin can reset early

```javascript
riskManager.resetDailyLoss('user_001', 'Admin override after review');
```

### Monitoring

```bash
# Check current daily loss
node -e "
const rm = require('./backend/node/risk_manager');
const status = rm.getStatus();
console.log(\`Daily loss: \${status.dailyLossPercent.toFixed(2)}%\`);
"
```

---

## Layer 3: Loss Streak Protection

### Description

Pauses trading after a consecutive series of losing trades to prevent cascading losses during unfavorable market conditions.

### Configuration

```json
{
  "risk": {
    "lossStreak": {
      "enabled": true,
      "maxConsecutiveLosses": 5,
      "cooldownMinutes": 60,
      "requireManualOverride": false
    }
  }
}
```

### Trigger Logic

```javascript
// After each losing trade
if (tradeProfit < 0) {
  consecutiveLosses++;
  
  if (consecutiveLosses >= maxConsecutiveLosses) {
    riskManager.activateLossStreakProtection();
    console.log(`Loss streak protection activated: ${consecutiveLosses} losses`);
  }
}

// Reset on winning trade
if (tradeProfit > 0) {
  consecutiveLosses = 0;
}
```

### Cooldown Period

**Automatic Recovery** (after 1 hour):

```javascript
const now = Date.now();
const timeSinceActivation = now - lossStreakActivationTime;
const cooldownMs = 60 * 60 * 1000; // 1 hour

if (timeSinceActivation >= cooldownMs) {
  riskManager.deactivateLossStreakProtection('Cooldown period expired');
}
```

**Manual Override**:

```javascript
riskManager.resetLossStreak('user_001', 'Market conditions improved');
```

### Analysis

```bash
# Analyze loss streaks in logs
node backend/node/analyze_streaks.js

# Output:
# Longest loss streak: 7 trades
# Average loss per streak: -0.05 ETH
# Total loss streaks: 12
# Recommendation: Reduce trade amount or change strategy
```

---

## Layer 4: Overtrading Prevention

### Description

Enforces minimum time intervals between trades to prevent rapid losses and emotional trading.

### Configuration

```json
{
  "risk": {
    "overtrading": {
      "enabled": true,
      "minTimeBetweenTradesMs": 600000,
      "perAsset": true,
      "perUser": false
    }
  }
}
```

**Time Settings**:
- 600000 ms = 10 minutes (default)
- 300000 ms = 5 minutes (aggressive)
- 1800000 ms = 30 minutes (conservative)

### Enforcement

```javascript
// Before executing trade
const lastTradeTime = assetStates[asset].lastTradeTime;
const timeSinceLastTrade = Date.now() - lastTradeTime;
const minInterval = config.risk.overtrading.minTimeBetweenTradesMs;

if (timeSinceLastTrade < minInterval) {
  const waitTime = Math.ceil((minInterval - timeSinceLastTrade) / 60000);
  return {
    allowed: false,
    reason: `Overtrading prevention: Wait ${waitTime} more minutes`
  };
}
```

### Per-Asset vs. Global

**Per-Asset** (recommended):
```javascript
// BTC can trade every 10 minutes
// ETH can trade every 10 minutes
// Independent cooldowns
assetStates['BTC_USDT'].lastTradeTime = now;
assetStates['ETH_USDT'].lastTradeTime = now;
```

**Global**:
```javascript
// ANY trade blocks ALL assets for 10 minutes
globalLastTradeTime = now;
```

### Dynamic Cooldowns (Advanced)

Adjust cooldown based on recent performance:

```javascript
// Increase cooldown after losses
if (lastTradeProfit < 0) {
  currentCooldown = minTimeBetweenTradesMs * 1.5;
} else {
  currentCooldown = minTimeBetweenTradesMs;
}
```

---

## Layer 5: Slippage Validation

### Description

Compares executed trade prices with oracle prices to detect and reject excessive slippage or manipulation.

### Configuration

```json
{
  "risk": {
    "slippage": {
      "enabled": true,
      "maxDeviationPercent": 3.0,
      "oracleValidation": true,
      "rejectOnExcess": true
    }
  }
}
```

### Validation Process

**Step 1: Get Oracle Price**

```javascript
const oraclePrice = await executor.getOraclePrice(tokenIn);
console.log(`Oracle price: ${ethers.utils.formatEther(oraclePrice)}`);
```

**Step 2: Execute Trade**

```javascript
const tx = await executor.executeTrade(tokenIn, tokenOut, amount, minOutput);
const receipt = await tx.wait();
```

**Step 3: Calculate Slippage**

```javascript
const actualOutput = receipt.events.find(e => e.event === 'TradeExecuted').args.outputAmount;
const expectedOutput = amount * oraclePrice;
const slippage = (expectedOutput - actualOutput) / expectedOutput;
const slippagePercent = slippage * 100;

console.log(`Slippage: ${slippagePercent.toFixed(2)}%`);
```

**Step 4: Validate**

```javascript
if (slippagePercent > maxDeviationPercent) {
  console.error(`Excessive slippage detected: ${slippagePercent.toFixed(2)}%`);
  riskManager.recordFailure({
    asset,
    reason: 'Excessive slippage',
    slippage: slippagePercent
  });
  return false;
}
```

### Slippage Sources

**Normal Slippage**:
- Low liquidity pools
- Large trade size relative to pool
- High volatility periods

**Abnormal Slippage** (investigate):
- MEV bots front-running
- Oracle price staleness
- Smart contract issues
- Network congestion

### Mitigation Strategies

**1. Reduce Trade Size**:
```json
{
  "tradeAmount": "10000000000000000000"  // 10 instead of 100
}
```

**2. Increase Slippage Tolerance** (cautiously):
```json
{
  "maxSlippageBps": 500  // 5% instead of 3%
}
```

**3. Use Limit Orders** (future enhancement):
```javascript
// Only execute if price within range
if (currentPrice < maxBuyPrice) {
  executeTrade();
}
```

**4. Check Liquidity First**:
```javascript
const reserves = await pair.getReserves();
const liquidity = reserves[0] * reserves[1];

if (liquidity < minLiquidity) {
  console.log('Insufficient liquidity, skipping trade');
}
```

---

## Risk State Persistence

### State File Structure

**backend/node/config/risk_state.json**:

```json
{
  "killSwitchActive": false,
  "killSwitchReason": "",
  "killSwitchActivatedAt": 0,
  "consecutiveFailures": 0,
  "lastFailureTime": 0,
  "users": {
    "user_001": {
      "dailyStartBalance": "10000000000000000000",
      "dailyCurrentBalance": "9850000000000000000",
      "dailyLossPercent": 1.5,
      "dailyResetDate": "2024-12-20",
      "consecutiveLosses": 2,
      "lastTradeTime": 1703012345678,
      "totalTrades": 45,
      "successfulTrades": 30,
      "failedTrades": 15
    }
  },
  "assets": {
    "BTC_USDT": {
      "lastTradeTime": 1703012345678,
      "recentSlippage": [0.012, 0.018, 0.025],
      "avgSlippage": 0.018
    }
  }
}
```

### Backup Strategy

```bash
# Automated backups every hour
*/60 * * * * cp backend/node/config/risk_state.json backend/node/config/backups/risk_state_$(date +\%Y\%m\%d_\%H\%M).json
```

### Recovery from Corrupted State

```bash
# Restore from backup
cp backend/node/config/backups/risk_state_20241220_1200.json backend/node/config/risk_state.json

# Or reset to defaults
rm backend/node/config/risk_state.json
node backend/node/index_v2.js
# Fresh state file created
```

---

## Multi-User Risk Management

### Per-User Limits

```json
{
  "users": [
    {
      "id": "user_001",
      "riskProfile": "conservative",
      "limits": {
        "maxDailyLossPercent": 3.0,
        "maxConsecutiveLosses": 3,
        "maxTradeAmount": "50000000000000000000",
        "minTimeBetweenTrades": 900000
      }
    },
    {
      "id": "user_002",
      "riskProfile": "aggressive",
      "limits": {
        "maxDailyLossPercent": 10.0,
        "maxConsecutiveLosses": 7,
        "maxTradeAmount": "200000000000000000000",
        "minTimeBetweenTrades": 300000
      }
    }
  ]
}
```

### Global vs. Per-User Limits

**Global Kill Switch**: Affects all users

```javascript
// One user's failures trigger global halt
if (totalConsecutiveFailures >= 3) {
  activateGlobalKillSwitch();
}
```

**Per-User Daily Loss**: Independent tracking

```javascript
// User 1 hits 5% limit, but User 2 can continue
if (user1DailyLoss >= 5.0) {
  blockTradesForUser('user_001');
}
```

---

## Monitoring & Alerts

### Real-Time Dashboard

```javascript
// Get current risk status
const status = riskManager.getStatus();

console.log(`
Risk Status Dashboard
=====================
Kill Switch: ${status.killSwitchActive ? 'ACTIVE ⚠️' : 'Inactive ✅'}
Consecutive Failures: ${status.consecutiveFailures}/3
Daily Loss: ${status.dailyLossPercent.toFixed(2)}%/5.0%
Loss Streak: ${status.consecutiveLosses}/5
Last Trade: ${new Date(status.lastTradeTime).toLocaleString()}
`);
```

### Email Alerts (Future Enhancement)

```javascript
// On kill switch activation
if (killSwitchActivated) {
  sendEmail({
    to: config.risk.alertEmails,
    subject: 'QIE Sentinel: Kill Switch Activated',
    body: `Kill switch activated due to: ${reason}`
  });
}
```

### Webhook Notifications

```javascript
// POST to webhook on critical events
await axios.post(config.webhookUrl, {
  event: 'kill_switch_activated',
  reason: reason,
  timestamp: Date.now(),
  consecutiveFailures: consecutiveFailures
});
```

---

## Best Practices

### 1. Start with Conservative Settings

```json
{
  "risk": {
    "killSwitch": {
      "maxConsecutiveFailures": 2  // Lower than default 3
    },
    "dailyLossLimit": {
      "maxLossPercent": 3.0  // Lower than default 5.0
    },
    "lossStreak": {
      "maxConsecutiveLosses": 3  // Lower than default 5
    }
  }
}
```

### 2. Monitor Closely in First Week

```bash
# Check status every hour
watch -n 3600 "node -e \"console.log(require('./backend/node/risk_manager').getStatus())\""
```

### 3. Gradually Loosen Limits

```
Week 1: 2% daily loss limit
Week 2: 3% daily loss limit (if no issues)
Week 3: 5% daily loss limit (if consistently profitable)
```

### 4. Document All Overrides

```javascript
// Log reason when manually deactivating protections
riskManager.deactivateKillSwitch('Override: Fixed oracle staleness issue, verified with 3 successful test trades');
```

### 5. Regular Risk Reviews

```bash
# Weekly risk analysis
node backend/node/risk_analysis.js --weekly

# Output:
# Total kill switch activations: 2
# Avg daily loss: 1.2%
# Max consecutive losses: 4
# Recommendation: Current settings appropriate
```

---

## Emergency Procedures

### Full System Halt

```bash
# Stop backend immediately
pkill -f "node index_v2.js"

# Or graceful shutdown
kill -SIGINT $(pgrep -f "node index_v2.js")
```

### Manual Trade Execution

```bash
# Bypass risk manager for emergency trade
node backend/node/manual_trade.js \
  --asset BTC_USDT \
  --type SELL \
  --amount 100 \
  --bypass-risk-checks
```

### State Reset

```bash
# Reset risk state (use with caution)
node -e "
const fs = require('fs');
fs.writeFileSync('backend/node/config/risk_state.json', JSON.stringify({
  killSwitchActive: false,
  consecutiveFailures: 0,
  users: {}
}, null, 2));
console.log('Risk state reset');
"
```

---

## Testing Risk Management

### Unit Tests

```bash
# Test each risk layer
node backend/node/tests/risk_manager.test.js

# Expected output:
# ✅ Kill switch activates after 3 failures
# ✅ Daily loss limit enforced
# ✅ Loss streak protection works
# ✅ Overtrading prevention works
# ✅ Slippage validation works
```

### Integration Tests

```bash
# Simulate 24-hour trading with failures
node backend/node/tests/risk_integration.test.js

# Verifies:
# - Daily reset occurs at midnight
# - Multiple protection layers work together
# - State persistence across restarts
```

### Stress Tests

```bash
# Rapid-fire trades to test overtrading
node backend/node/tests/stress_test.js --trades 100 --interval 1000

# Expected: Most trades blocked by overtrading prevention
```

---

**Next Steps**:
- Configure risk limits in [config.json](backend/node/config/config.json)
- Test with small amounts on testnet
- Monitor risk_state.json for anomalies
- Adjust limits based on performance
- See [TESTNET_DEPLOYMENT.md](TESTNET_DEPLOYMENT.md) for safe testing procedures
