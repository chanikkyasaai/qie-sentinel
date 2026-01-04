# 🚀 Testnet Deployment Guide

## Overview

Complete guide for deploying QIE Sentinel to Ethereum Sepolia testnet for safe testing before mainnet deployment.

---

## Prerequisites

### 1. Node.js & Dependencies

```bash
# Check Node.js version (requires v16+)
node --version

# Install dependencies
cd contracts
npm install

cd ../backend/node
npm install
```

### 2. Testnet ETH (Sepolia)

**Get Free Testnet ETH**:

1. **Alchemy Faucet** (recommended):
   - Visit: https://sepoliafaucet.com
   - Login with Alchemy account
   - Enter wallet address
   - Receive 0.5 Sepolia ETH

2. **Chainlink Faucet**:
   - Visit: https://faucets.chain.link
   - Connect wallet
   - Request testnet tokens

3. **QuickNode Faucet**:
   - Visit: https://faucet.quicknode.com/ethereum/sepolia
   - Enter address
   - Complete captcha

**How Much Do You Need?**:
- Contract deployment: ~0.02 ETH
- Oracle setup: ~0.005 ETH
- Initial trading: ~0.01 ETH
- **Total**: ~0.05 ETH (buffer: get 0.5 ETH)

### 3. RPC Provider

**Option A: Alchemy** (recommended):
```bash
# Sign up at https://www.alchemy.com
# Create new app → Select Sepolia
# Copy HTTP endpoint:
# https://eth-sepolia.g.alchemy.com/v2/YOUR_API_KEY
```

**Option B: Infura**:
```bash
# Sign up at https://infura.io
# Create project → Select Sepolia
# Copy endpoint:
# https://sepolia.infura.io/v3/YOUR_PROJECT_ID
```

**Option C: Public RPC** (rate limited):
```
https://rpc.sepolia.org
https://sepolia.gateway.tenderly.co
```

### 4. Private Key

**Create New Wallet** (recommended for testnet):
```bash
# Generate new wallet with ethers.js
node -e "console.log(require('ethers').Wallet.createRandom().privateKey)"

# Output: 0x1234567890abcdef...
```

**Export from MetaMask**:
- Open MetaMask
- Click account details
- Export Private Key
- Enter password
- Copy private key

⚠️ **SECURITY WARNING**: Never use mainnet private keys on testnet!

---

## Environment Setup

### 1. Copy Template

```bash
# From project root
cp .env.sepolia.example .env

# Edit .env
nano .env
```

### 2. Configure .env

```bash
# === NETWORK CONFIGURATION ===
# Required: Your Alchemy/Infura RPC URL
RPC_URL=https://eth-sepolia.g.alchemy.com/v2/YOUR_API_KEY

# Required: Private key (WITHOUT 0x prefix)
PRIVATE_KEY=your_private_key_here_without_0x

# Network name
NETWORK=sepolia

# === CHAINLINK ORACLES (Pre-configured for Sepolia) ===
ORACLE_BTC_USD=0x1b44F3514812d835EB1BDB0acB33d3fA3351Ee43
ORACLE_ETH_USD=0x694AA1769357215DE4FAC081bf1f309aDC325306
ORACLE_LINK_USD=0xc59E3633BAAC79493d908e63626716e204A45EdF

# === TRADING CONFIGURATION ===
# Start with trading disabled
AUTO_TRADING_ENABLED=false
POLLING_INTERVAL=15000
MAX_PRICE_HISTORY=100

# === RISK MANAGEMENT ===
MAX_DAILY_LOSS_PERCENT=5.0
MAX_CONSECUTIVE_FAILURES=3
MIN_TIME_BETWEEN_TRADES_MS=600000
MAX_SLIPPAGE_BPS=300

# === LOGGING ===
LOG_LEVEL=info
LOG_TO_FILE=true
LOG_TO_CONSOLE=true
```

### 3. Verify Configuration

```bash
# Test RPC connection
curl -X POST $RPC_URL \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","method":"eth_blockNumber","params":[],"id":1}'

# Expected output: {"jsonrpc":"2.0","id":1,"result":"0x..."}
```

```bash
# Check wallet balance
node -e "
const { ethers } = require('ethers');
require('dotenv').config();
const provider = new ethers.providers.JsonRpcProvider(process.env.RPC_URL);
const wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);
wallet.getBalance().then(b => console.log('Balance:', ethers.utils.formatEther(b), 'ETH'));
"
```

---

## Automated Deployment

### Windows (PowerShell)

```powershell
cd backend\node

# Make script executable (if needed)
Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass

# Run deployment
.\testnetStart.ps1 -Network sepolia

# Follow prompts:
# ✅ Pre-flight checks
# ✅ Compile contracts
# ✅ Deploy contracts
# ✅ Configure oracles
# ✅ Update backend config
# ✅ Start backend
```

### Linux / macOS (Bash)

```bash
cd backend/node

# Make script executable
chmod +x testnetStart.sh

# Run deployment
./testnetStart.sh sepolia

# Follow prompts:
# ✅ Pre-flight checks
# ✅ Compile contracts
# ✅ Deploy contracts
# ✅ Configure oracles
# ✅ Update backend config
# ✅ Start backend
```

### What the Script Does

**Step 1: Pre-flight Checks**
- Verifies .env file exists
- Checks node_modules installed
- Tests RPC connection
- Confirms wallet has sufficient balance

**Step 2: Compile Contracts**
```bash
cd ../../contracts
npx hardhat compile
```

**Step 3: Deploy Contracts**
```bash
npx hardhat run scripts/deploy.js --network sepolia
```
Deploys:
- MockERC20 tokens (USDT, WETH, WBTC)
- Vault.sol
- Executor.sol

Saves addresses to `contracts/deployed-addresses.json`

**Step 4: Configure Oracles**
```bash
npx hardhat run scripts/setup-oracles.js --network sepolia
```
Sets Chainlink price feeds for each token pair

**Step 5: Update Backend Config**
Automatically updates `backend/node/config/config.json` with deployed addresses

**Step 6: Start Backend**
```bash
node index_v2.js
# or
node index.js
```

---

## Manual Deployment

### Step 1: Compile Contracts

```bash
cd contracts
npx hardhat compile

# Expected output:
# Compiled 15 Solidity files successfully
```

### Step 2: Deploy Contracts

```bash
npx hardhat run scripts/deploy.js --network sepolia

# Expected output:
# Deploying contracts...
# MockUSDT deployed to: 0x1234...
# MockWETH deployed to: 0x5678...
# MockWBTC deployed to: 0x9abc...
# Vault deployed to: 0xdef0...
# Executor deployed to: 0x1111...
# 
# ✅ Deployment complete
# Addresses saved to deployed-addresses.json
```

**Save Output**: Copy all addresses for later use

### Step 3: Verify Deployment

```bash
# Check Vault deployment
npx hardhat verify --network sepolia VAULT_ADDRESS

# Check Executor deployment
npx hardhat verify --network sepolia EXECUTOR_ADDRESS VAULT_ADDRESS
```

Visit Sepolia Etherscan: https://sepolia.etherscan.io/address/YOUR_CONTRACT_ADDRESS

### Step 4: Setup Oracles

```bash
npx hardhat run scripts/setup-oracles.js --network sepolia

# Expected output:
# Setting up oracles...
# Oracle for WETH/USDT: 0x694AA...
# Oracle for WBTC/USDT: 0x1b44F...
# ✅ Oracles configured
```

### Step 5: Update Backend Config

Edit `backend/node/config/config.json`:

```json
{
  "network": {
    "rpcUrl": "https://eth-sepolia.g.alchemy.com/v2/YOUR_KEY",
    "chainId": 11155111,
    "networkName": "sepolia"
  },
  "contracts": {
    "vault": "0xVAULT_ADDRESS_FROM_STEP_2",
    "executor": "0xEXECUTOR_ADDRESS_FROM_STEP_2",
    "router": "0xUNISWAP_V2_ROUTER_SEPOLIA"
  }
}
```

Update `backend/node/config/tokens.json`:

```json
[
  {
    "id": "WETH_USDT",
    "tokenIn": "0xWETH_ADDRESS_FROM_STEP_2",
    "tokenOut": "0xUSDT_ADDRESS_FROM_STEP_2",
    "oracleFeed": "0x694AA1769357215DE4FAC081bf1f309aDC325306"
  }
]
```

### Step 6: Fund Vault

```bash
# Transfer tokens to Vault
npx hardhat run scripts/fund-vault.js --network sepolia

# Or manually:
npx hardhat console --network sepolia
```

```javascript
> const USDT = await ethers.getContractAt('MockERC20', 'USDT_ADDRESS');
> const vault = await ethers.getContractAt('Vault', 'VAULT_ADDRESS');
> await USDT.mint(vault.address, ethers.utils.parseEther('10000'));
> console.log('Vault funded with 10,000 USDT');
```

### Step 7: Start Backend

```bash
cd backend/node

# Start with auto-trading disabled (recommended first time)
AUTO_TRADING_ENABLED=false node index_v2.js

# Expected output:
# 🚀 QIE Sentinel v2.0 Starting...
# ✅ Configuration loaded
# ✅ Data access initialized
# ✅ Risk manager initialized
# ✅ Strategy resolver loaded 3 strategies
# ✅ Blockchain connected: sepolia (Chain ID: 11155111)
# ✅ Contracts initialized
# ✅ Python engine ready
# ✅ 3 assets loaded
# 🔄 Trading loop started (15s interval)
```

---

## Validation & Testing

### 1. Health Check

```bash
# Check all systems operational
curl http://localhost:3000/health

# Expected output:
{
  "status": "healthy",
  "uptime": 120,
  "blockchain": "connected",
  "pythonEngine": "ready",
  "riskManager": {
    "killSwitch": false,
    "dailyLoss": 0
  }
}
```

### 2. Test Price Fetching

```bash
# Monitor console logs
tail -f backend/node/logs/app.log

# Should see:
# [INFO] Fetching price for BTC_USDT...
# [INFO] Current price: 50125.50
# [INFO] Oracle price: 50123.25 (deviation: 0.004%)
```

### 3. Dry Run (No Trades)

```bash
# Start with AUTO_TRADING_ENABLED=false
# Monitor for 30 minutes
# Check logs for:
# - Price updates
# - Signal generation
# - Risk checks (all should pass)
# - No trade execution
```

### 4. Execute Test Trade

```bash
# Enable auto-trading
# Edit .env:
AUTO_TRADING_ENABLED=true

# Restart backend
pkill -f "node index_v2.js"
node index_v2.js

# Monitor logs for first trade:
# [INFO] Signal: BUY (confidence: 0.85)
# [INFO] Risk check: PASS
# [INFO] Executing trade: WETH → USDT
# [INFO] Transaction: 0x1234... (pending)
# [INFO] Transaction confirmed in block 12345678
# [INFO] Trade successful: +0.05 ETH profit
```

### 5. Verify On-Chain

```bash
# Get transaction hash from logs
# Visit Sepolia Etherscan:
https://sepolia.etherscan.io/tx/0xTRANSACTION_HASH

# Verify:
# ✅ Transaction confirmed
# ✅ Executor contract called
# ✅ Tokens swapped
# ✅ Events emitted (TradeExecuted)
```

---

## Monitoring

### Real-Time Logs

```bash
# Tail logs
tail -f backend/node/logs/app.log

# Filter for trades
grep "Trade" backend/node/logs/app.log

# Filter for errors
grep "ERROR" backend/node/logs/app.log
```

### Performance Metrics

```bash
# Every 10 cycles, backend logs:
=== Performance Metrics ===
Uptime: 1h 23m
Total Cycles: 332
Successful Trades: 12
Failed Trades: 1
Avg Cycle Time: 1.2s
Memory Usage: 156 MB
```

### Analytics Report

```bash
# Generate report
node backend/node/reports.js

# Output:
=== Trading Analytics ===
Total Trades: 45
Win Rate: 66.67%
Total Profit: +2.5 ETH
Best Trade: +0.15 ETH
Worst Trade: -0.08 ETH
```

### Risk Status

```bash
# Check risk manager status
node -e "
const rm = require('./backend/node/risk_manager');
const status = rm.getStatus();
console.log('Kill Switch:', status.killSwitchActive);
console.log('Daily Loss:', status.dailyLossPercent.toFixed(2) + '%');
console.log('Consecutive Failures:', status.consecutiveFailures);
"
```

---

## Common Issues

### Issue 1: "Insufficient funds for gas"

**Cause**: Wallet has no Sepolia ETH

**Solution**:
```bash
# Get testnet ETH from faucet
# Visit: https://sepoliafaucet.com
# Enter wallet address
# Wait 5-10 minutes
```

### Issue 2: "Transaction reverted"

**Possible Causes**:
1. Slippage too low
2. Insufficient liquidity
3. Oracle price stale
4. Vault has no tokens

**Debug**:
```bash
# Check Vault balance
npx hardhat console --network sepolia
> const vault = await ethers.getContractAt('Vault', 'VAULT_ADDRESS');
> const balance = await vault.getBalance('0xYOUR_WALLET');
> console.log(ethers.utils.formatEther(balance));

# If balance is 0, fund vault:
> await USDT.mint(vault.address, ethers.utils.parseEther('10000'));
```

### Issue 3: "Oracle price too stale"

**Cause**: Chainlink oracle hasn't updated recently

**Solution**:
```javascript
// In Executor.sol, increase staleness threshold
uint256 constant STALENESS_THRESHOLD = 7200; // 2 hours instead of 1 hour
```

Or use different oracle:
```bash
# Check oracle freshness
npx hardhat console --network sepolia
> const oracle = await ethers.getContractAt('AggregatorV3Interface', 'ORACLE_ADDRESS');
> const latest = await oracle.latestRoundData();
> console.log('Last update:', new Date(latest.updatedAt * 1000));
```

### Issue 4: "Python engine not responding"

**Cause**: Python process crashed or not started

**Debug**:
```bash
# Check Python process
ps aux | grep signal_engine.py

# Test Python manually
cd backend/python
python signal_engine.py
# Type: {"prices": [50000, 50100, 50050]}
# Expected output: {"signal": "HOLD", ...}
```

**Solution**:
```bash
# Restart backend (auto-restarts Python)
pkill -f "node index_v2.js"
node index_v2.js
```

### Issue 5: "RPC rate limit exceeded"

**Cause**: Too many requests to free RPC

**Solution 1**: Upgrade to paid Alchemy/Infura plan

**Solution 2**: Increase polling interval
```bash
# In .env
POLLING_INTERVAL=30000  # 30 seconds instead of 15
```

**Solution 3**: Use multiple RPC providers (load balancing)

---

## Performance Tuning

### 1. Optimize Polling Interval

```bash
# Fast (high RPC usage)
POLLING_INTERVAL=10000  # 10 seconds

# Balanced (recommended)
POLLING_INTERVAL=15000  # 15 seconds

# Conservative (low RPC usage)
POLLING_INTERVAL=30000  # 30 seconds
```

### 2. Reduce Price History

```bash
# In config.json
{
  "trading": {
    "maxPriceHistory": 50  # Instead of 100
  }
}
```
Reduces memory but may affect indicator accuracy

### 3. Disable Verbose Logging

```bash
# In .env
LOG_LEVEL=warn  # Only warnings and errors
```

### 4. Optimize Gas Usage

```bash
# In hardhat.config.js
networks: {
  sepolia: {
    gasPrice: 20000000000,  // 20 Gwei (adjust based on network)
    gasLimit: 500000
  }
}
```

---

## Testnet Best Practices

### 1. Start Small

```json
{
  "tokens": [
    {
      "id": "WETH_USDT",
      "tradeAmount": "100000000000000000",  // 0.1 ETH
      "enabled": true
    },
    {
      "id": "WBTC_USDT",
      "enabled": false  // Disable initially
    }
  ]
}
```

### 2. Test Each Strategy

```bash
# Week 1: Test Strategy 1
node index_v2.js  # With strategyId=1 in tokens.json

# Week 2: Test Strategy 2
# Edit config, restart

# Week 3: Test Strategy 3
```

### 3. Monitor for 7+ Days

```bash
# Run continuously for at least 1 week
# Check daily:
# - Win rate
# - No kill switch activations
# - Reasonable slippage (<5%)
# - No unexpected errors
```

### 4. Simulate Failures

```bash
# Test kill switch
# Manually cause 3 failures:
# - Drain Vault balance
# - Wait for 3 failed trades
# - Verify kill switch activates
# - Test recovery process
```

### 5. Load Testing

```bash
# Reduce polling interval to stress test
POLLING_INTERVAL=5000 node index_v2.js

# Monitor:
# - Memory usage
# - CPU usage
# - RPC rate limits
# - Error rates
```

---

## Mainnet Preparation

Before deploying to mainnet:

- [ ] **Testnet Success**
  - [ ] 7+ days of stable operation
  - [ ] Win rate >55%
  - [ ] No kill switch activations
  - [ ] All error scenarios tested

- [ ] **Security Audit**
  - [ ] Smart contracts audited (consider CertiK, OpenZeppelin)
  - [ ] Private keys secured (hardware wallet recommended)
  - [ ] No hardcoded secrets in code

- [ ] **Risk Management**
  - [ ] Daily loss limit: 3% (more conservative than testnet)
  - [ ] Trade amounts: Start with 1% of balance
  - [ ] Kill switch: 2 failures (stricter than testnet)

- [ ] **Monitoring**
  - [ ] Alerting system (email, SMS, webhook)
  - [ ] Real-time dashboard
  - [ ] Automated health checks

- [ ] **Legal & Compliance**
  - [ ] Terms of service
  - [ ] Risk disclosures
  - [ ] Regulatory compliance check

---

## Troubleshooting Checklist

**Before asking for help, verify**:

1. [ ] .env file configured correctly
2. [ ] Wallet has Sepolia ETH (check with Etherscan)
3. [ ] RPC provider working (test with curl)
4. [ ] Contracts deployed (check deployed-addresses.json)
5. [ ] Oracles configured (check setup-oracles.js output)
6. [ ] Vault funded with tokens
7. [ ] Backend config.json updated with addresses
8. [ ] Python engine tested manually
9. [ ] Logs checked for specific errors
10. [ ] Recent transactions on Sepolia Etherscan

---

## Next Steps

1. **Complete Deployment**:
```bash
# Run automated deployment
.\testnetStart.ps1 -Network sepolia  # Windows
./testnetStart.sh sepolia            # Linux/Mac
```

2. **Monitor for 24 Hours**:
```bash
# Watch logs continuously
tail -f backend/node/logs/app.log
```

3. **Analyze Results**:
```bash
# Generate report
node backend/node/reports.js
```

4. **Iterate & Optimize**:
- Adjust strategy parameters
- Tune risk limits
- Optimize performance

5. **Scale Up**:
- Enable more assets
- Increase trade amounts
- Add more strategies

---

**Related Guides**:
- [MULTI_TOKEN_GUIDE.md](MULTI_TOKEN_GUIDE.md) - Configure multiple trading pairs
- [STRATEGY_GUIDE.md](STRATEGY_GUIDE.md) - Strategy selection and tuning
- [RISK_MANAGEMENT.md](RISK_MANAGEMENT.md) - Risk configuration
- [BACKTESTING_GUIDE.md](BACKTESTING_GUIDE.md) - Validate strategies before live trading

**Support**:
- GitHub Issues: [Open an issue](https://github.com/your-repo/issues)
- Documentation: [Full docs](https://docs.yourproject.com)
- Discord: [Join community](https://discord.gg/yourserver)
