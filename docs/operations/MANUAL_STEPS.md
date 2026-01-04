# 📋 QIE Sentinel - Manual Setup Steps

## Overview

This guide provides step-by-step instructions for manually setting up the QIE Sentinel trading system when automatic setup isn't available or fails.

## Prerequisites

### Required Accounts & Services

1. **Alchemy Account** (Free tier sufficient)
   - Sign up: https://www.alchemy.com/
   - Create Sepolia app
   - Copy API key

2. **MetaMask Wallet**
   - Install: https://metamask.io/
   - Create or import wallet
   - Switch to Sepolia network

3. **Sepolia ETH** (For gas fees)
   - Minimum: 0.05 ETH
   - Faucets listed below

4. **Node.js & npm**
   - Version: 16+ required
   - Check: `node --version`

5. **Hardhat** (For contract deployment)
   - Installed via: `npm install --save-dev hardhat`

## Step 1: Get Sepolia ETH

You need testnet ETH for gas fees on Sepolia.

### Faucet Options

#### Option A: Alchemy Sepolia Faucet (RECOMMENDED)
1. Go to: https://sepoliafaucet.com/
2. Login with Alchemy account
3. Enter your wallet address
4. Click "Send Me ETH"
5. Wait 1-2 minutes
6. Verify: Check balance in MetaMask

#### Option B: Sepolia PoW Faucet
1. Go to: https://sepolia-faucet.pk910.de/
2. Enter wallet address
3. Complete mining task (leave tab open)
4. Wait for ~0.05 ETH
5. Stop mining and claim

#### Option C: Infura Sepolia Faucet
1. Go to: https://www.infura.io/faucet/sepolia
2. Login with GitHub or Infura account
3. Enter wallet address
4. Request 0.5 ETH
5. Verify in MetaMask

### Verify Balance

```bash
# Check balance via Etherscan
https://sepolia.etherscan.io/address/<YOUR_ADDRESS>

# Or via script
node -e "const { ethers } = require('ethers'); const provider = new ethers.JsonRpcProvider('https://eth-sepolia.g.alchemy.com/v2/YOUR_API_KEY'); provider.getBalance('YOUR_ADDRESS').then(b => console.log(ethers.formatEther(b)));"
```

**Expected**: At least 0.05 ETH (more is better for multiple transactions)

## Step 2: Configure Environment

### Create `.env` File

Location: `QIE Sentinel/.env`

```bash
# RPC Configuration
RPC_URL=https://eth-sepolia.g.alchemy.com/v2/YOUR_ALCHEMY_API_KEY
CHAIN_ID=11155111

# Wallet Configuration
PRIVATE_KEY=your_wallet_private_key_here

# Smart Contract Addresses (will be set after deployment)
VAULT_ADDRESS=
EXECUTOR_ADDRESS=
ROUTER_ADDRESS=

# API Configuration
PORT=9000
NODE_ENV=development
```

### Get Private Key from MetaMask

1. Open MetaMask
2. Click account menu (top right)
3. Select "Account Details"
4. Click "Show Private Key"
5. Enter password
6. Copy private key
7. Paste into `.env` file

⚠️ **SECURITY WARNING**: Never share or commit your private key!

## Step 3: Deploy Smart Contracts

### Deploy Mock Tokens

```bash
cd contracts
npx hardhat run scripts/deploy_tokens.js --network sepolia
```

**Expected Output:**
```
🪙 Deploying Mock ERC20 Tokens to Sepolia...

Deploying USDT (6 decimals)...
✅ USDT deployed: 0x1234...5678
   Minted 100,000 USDT to deployer

Deploying WBTC (8 decimals)...
✅ WBTC deployed: 0xabcd...ef01
   Minted 10 WBTC to deployer

Deploying WETH (18 decimals)...
✅ WETH deployed: 0x9876...5432
   Minted 100 WETH to deployer

📝 Saved token addresses to backend/node/config/tokens.json
```

**Troubleshooting:**
- Error "insufficient funds": Get more Sepolia ETH
- Error "nonce too high": Wait 30s, try again
- Error "network error": Check RPC_URL in .env

### Deploy Core Contracts

If not already deployed:

```bash
cd contracts
npx hardhat run scripts/deploy.js --network sepolia
```

**Expected Output:**
```
🚀 Deploying QIE Sentinel Contracts...

Deploying Vault...
✅ Vault deployed: 0x53f9...E48

Deploying Router...
✅ Router deployed: 0x50c9...C2

Deploying Executor...
✅ Executor deployed: 0x29A9...711

📋 Contract Addresses:
   Vault: 0x53f95B19e7191B4737E0A8D2d9298aA2C2853E48
   Executor: 0x29A9844f954DFc6fe84dD335771962d5Eb2d8711
   Router: 0x50c9A55Cbb02C41ea84D39c5C6Abd3070bda58C2

💡 Update .env with these addresses
```

### Update `.env` with Contract Addresses

```bash
VAULT_ADDRESS=0x53f95B19e7191B4737E0A8D2d9298aA2C2853E48
EXECUTOR_ADDRESS=0x29A9844f954DFc6fe84dD335771962d5Eb2d8711
ROUTER_ADDRESS=0x50c9A55Cbb02C41ea84D39c5C6Abd3070bda58C2
```

## Step 4: Verify Environment

Run the environment validation script:

```bash
cd backend/node
node check_environment.js
```

**Expected Output:**
```
🔍 QIE Sentinel - Environment Validation

1️⃣  Checking Environment Variables...
   ✅ RPC_URL: https://eth-sepolia...
   ✅ PRIVATE_KEY: 0x1234...
   ✅ VAULT_ADDRESS: 0x53f9...
   ✅ EXECUTOR_ADDRESS: 0x29A9...
   ✅ ROUTER_ADDRESS: 0x50c9...

2️⃣  Checking Network Connectivity...
   ✅ Connected to network: sepolia (Chain ID: 11155111)
   ✅ Current block: 5234567

3️⃣  Checking Wallet...
   ✅ Wallet address: 0x9214...267E
   💰 ETH balance: 0.235 ETH

4️⃣  Checking Vault Contract...
   ✅ Vault contract found
   📍 Address: 0x53f95B19...

5️⃣  Checking Executor Contract...
   ✅ Executor contract found
   📍 Address: 0x29A9844f...

6️⃣  Checking Router Contract...
   ✅ Router contract found
   📍 Address: 0x50c9A55C...

7️⃣  Checking Token Configuration...
   ✅ Token configuration found
   📋 Tokens configured: USDT, WBTC, WETH
   ✅ USDT: 0x1234... (6 decimals)
   ✅ WBTC: 0xabcd... (8 decimals)
   ✅ WETH: 0x9876... (18 decimals)

8️⃣  Checking Configuration Files...
   ✅ config/default.json
   ✅ abi/Vault.json
   ✅ abi/Executor.json

✅ Environment validation PASSED!
```

**If Failed:**
- Missing env variables: Update `.env` file
- Contract not found: Re-deploy contracts
- Token config missing: Run `deploy_tokens.js`
- Low ETH: Get more from faucet

## Step 5: Fund Vault & Approve Allowances

### Automatic Method (RECOMMENDED)

```bash
cd backend/node
node setup_funding.js
```

**Expected Output:**
```
🚀 Initializing Funding Manager...
📋 Wallet Address: 0x9214...267E
💰 ETH Balance: 0.235 ETH

✅ Loaded 3 tokens: USDT, WBTC, WETH
✅ Vault contract loaded: 0x53f9...

1️⃣  Minting Tokens to Wallet...
   USDT: Current balance 0
   ⚠️  Balance below 1000, calling faucet()
   TX: 0x1234...5678
   ✅ USDT minted: 1000.00

   WBTC: Current balance 0
   ⚠️  Balance below 1000, calling faucet()
   TX: 0xabcd...ef01
   ✅ WBTC minted: 1000.00

   WETH: Current balance 0
   ⚠️  Balance below 1000, calling faucet()
   TX: 0x9876...5432
   ✅ WETH minted: 1000.00

2️⃣  Depositing Tokens to Vault...
   USDT: Approving Vault to spend
   TX: 0xaaaa...bbbb
   ✅ Approval confirmed
   
   USDT: Depositing 1000.00 to Vault
   TX: 0xcccc...dddd
   ✅ Deposit confirmed
   Vault balance: 1000.00 USDT

   [Repeats for WBTC, WETH...]

3️⃣  Approving Executor Allowance...
   USDT: Approving 1000 units for Executor
   TX: 0xeeee...ffff
   ✅ USDT allowance approved

   [Repeats for WBTC, WETH...]

✅ Funding Setup Complete!
💡 You can now start the trading bot: node index_v2.js
```

### Manual Method

If automatic setup fails, use this manual process:

#### 5.1 Mint Tokens

```javascript
// mint_tokens.js
const { ethers } = require('ethers');
const provider = new ethers.JsonRpcProvider(process.env.RPC_URL);
const wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);
const tokenABI = ["function faucet() public"];

async function mintTokens() {
  const tokens = require('./config/tokens.json');
  
  for (const [symbol, info] of Object.entries(tokens.tokens)) {
    const token = new ethers.Contract(info.address, tokenABI, wallet);
    const tx = await token.faucet();
    console.log(`${symbol}: ${tx.hash}`);
    await tx.wait();
  }
}

mintTokens();
```

Run:
```bash
node mint_tokens.js
```

#### 5.2 Approve Vault

```javascript
// approve_vault.js
const { ethers } = require('ethers');
const provider = new ethers.JsonRpcProvider(process.env.RPC_URL);
const wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);
const tokenABI = ["function approve(address,uint256) returns (bool)"];

async function approveVault() {
  const tokens = require('./config/tokens.json');
  const vaultAddress = process.env.VAULT_ADDRESS;
  
  for (const [symbol, info] of Object.entries(tokens.tokens)) {
    const token = new ethers.Contract(info.address, tokenABI, wallet);
    const tx = await token.approve(vaultAddress, ethers.MaxUint256);
    console.log(`${symbol}: ${tx.hash}`);
    await tx.wait();
  }
}

approveVault();
```

Run:
```bash
node approve_vault.js
```

#### 5.3 Deposit to Vault

```javascript
// deposit_vault.js
const { ethers } = require('ethers');
const provider = new ethers.JsonRpcProvider(process.env.RPC_URL);
const wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);
const vaultABI = require('./abi/Vault.json');

async function depositToVault() {
  const tokens = require('./config/tokens.json');
  const vault = new ethers.Contract(process.env.VAULT_ADDRESS, vaultABI, wallet);
  
  for (const [symbol, info] of Object.entries(tokens.tokens)) {
    const amount = ethers.parseUnits("1000", info.decimals);
    const tx = await vault.deposit(info.address, amount);
    console.log(`${symbol}: ${tx.hash}`);
    await tx.wait();
  }
}

depositToVault();
```

Run:
```bash
node deposit_vault.js
```

#### 5.4 Approve Executor

```javascript
// approve_executor.js
const { ethers } = require('ethers');
const provider = new ethers.JsonRpcProvider(process.env.RPC_URL);
const wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);
const vaultABI = require('./abi/Vault.json');

async function approveExecutor() {
  const tokens = require('./config/tokens.json');
  const vault = new ethers.Contract(process.env.VAULT_ADDRESS, vaultABI, wallet);
  const executorAddress = process.env.EXECUTOR_ADDRESS;
  
  for (const [symbol, info] of Object.entries(tokens.tokens)) {
    const amount = ethers.parseUnits("1000", info.decimals);
    const tx = await vault.approveSpender(executorAddress, info.address, amount);
    console.log(`${symbol}: ${tx.hash}`);
    await tx.wait();
  }
}

approveExecutor();
```

Run:
```bash
node approve_executor.js
```

## Step 6: Configure Backend

### Update `config/config.json`

```json
{
  "version": "1.0.0",
  "network": {
    "rpcUrl": "https://eth-sepolia.g.alchemy.com/v2/YOUR_API_KEY",
    "chainId": 11155111,
    "networkName": "sepolia"
  },
  "contracts": {
    "vaultAddress": "0x53f95B19e7191B4737E0A8D2d9298aA2C2853E48",
    "executorAddress": "0x29A9844f954DFc6fe84dD335771962d5Eb2d8711",
    "routerAddress": "0x50c9A55Cbb02C41ea84D39c5C6Abd3070bda58C2"
  },
  "trading": {
    "pollingIntervalSeconds": 15,
    "enableAutoTrading": true,
    "rotateAssets": true,
    "maxTradesPerCycle": 1,
    "autoFunding": {
      "enabled": true,
      "defaultDepositAmount": "1000",
      "defaultAllowanceAmount": "1000",
      "minBalanceThreshold": "100"
    }
  },
  "risk": {
    "enableKillSwitch": true,
    "maxConsecutiveFailures": 3
  }
}
```

### Enable/Disable Auto-Funding

**Enable** (Recommended):
```json
"autoFunding": {
  "enabled": true
}
```

**Disable** (If you prefer manual management):
```json
"autoFunding": {
  "enabled": false
}
```

## Step 7: Run Integration Tests

Verify everything works end-to-end:

```bash
cd backend/node
node test_integration.js
```

**Expected Output:**
```
🧪 QIE Sentinel - Integration Test Suite

1️⃣  Testing Environment...
   ✅ ETH balance: 0.235
   ✅ Vault contract deployed
   ✅ Executor contract deployed

2️⃣  Testing Funding Setup...
   ✅ USDT: 1000.00 deposited
   ✅ WBTC: 1000.00 deposited
   ✅ WETH: 1000.00 deposited

3️⃣  Testing BUY Trade (USDT)...
   Amount: 10 USDT
   TX: 0x1234...5678
   ✅ BUY trade successful

4️⃣  Testing SELL Trade (WBTC)...
   Amount: 0.01 ETH
   TX: 0xabcd...ef01
   ✅ SELL trade successful

5️⃣  Testing Trade Logging...
   ✅ Trades logged: 2

6️⃣  Testing Kill Switch...
   ✅ Kill switch inactive

✅ ALL TESTS PASSED!
💡 System is ready for production trading
```

**If Tests Fail:**
- Check error messages carefully
- Verify all previous steps completed
- Review logs in `backend/node/logs/`
- Re-run `setup_funding.js`

## Step 8: Start Backend

### Start Trading Bot

```bash
cd backend/node
node index_v2.js
```

**Expected Output:**
```
🤖 QIE Sentinel Backend - Production Mode

🚀 Initializing QIE Sentinel...

📋 Loading configuration...
✅ Configuration loaded
   Network: sepolia
   Trading: ENABLED

🔗 Connecting to blockchain...
✅ Blockchain connected
   Wallet: 0x9214...267E
   Balance: 0.235 ETH

📜 Loading smart contracts...
✅ Contracts initialized
   Vault: 0x53f9...E48
   Executor: 0x29A9...711

💰 Auto-funding enabled - Checking vault status...
✅ USDT vault balance: 1000.00
✅ WBTC vault balance: 1000.00
✅ WETH vault balance: 1000.00
✅ Auto-funding check complete

🐍 Starting Python AI engine...
✅ Python engine ready

📊 Loading 3 enabled assets...
✅ Assets initialized

✅ All systems initialized successfully!

🌐 API Server started on port 9000
🔄 Starting autonomous trading loop...
   Interval: 15s
   Auto-trading: ENABLED

Cycle #1: Collecting price data for BTC/USDT...
Cycle #2: Collecting price data for ETH/USDT...
...
Cycle #50: BUY signal detected for GOLD! 💰
   Strategy: momentum_trend
   Confidence: 75%
   Price: $114.64
```

### Monitor Logs

```bash
# Follow real-time logs
tail -f backend/node/logs/trading.log

# Check for errors
grep ERROR backend/node/logs/trading.log
```

## Step 9: Start Frontend

### Install Dependencies (if not done)

```bash
cd sentinel-frontend
npm install
```

### Start Dev Server

```bash
npm run dev
```

**Expected Output:**
```
VITE v5.0.0  ready in 234 ms

  ➜  Local:   http://localhost:5173/
  ➜  Network: use --host to expose
```

### Open Browser

Visit: http://localhost:5173/

**Expected:**
- Dashboard shows live metrics
- Trades table populates as trades execute
- Wallet connection button works
- No console errors

## Common Issues & Solutions

### Issue 1: "Insufficient funds for gas"

**Solution**: Get more Sepolia ETH from faucets (see Step 1)

### Issue 2: "Contract not deployed"

**Solution**: Re-deploy contracts (see Step 3)

### Issue 3: "Python engine failed"

**Solution**:
```bash
# Check Python installation
python --version  # Should be 3.8+

# Install dependencies
cd backend/python
pip install -r requirements.txt
```

### Issue 4: "Kill switch activated"

**Solution**:
```bash
# Reset kill switch
node -e "const fs = require('fs'); const state = JSON.parse(fs.readFileSync('backend/node/config/risk_state.json')); state.killSwitchActive = false; state.consecutiveFailures = 0; fs.writeFileSync('backend/node/config/risk_state.json', JSON.stringify(state, null, 2));"
```

### Issue 5: "Port 9000 already in use"

**Solution**:
```bash
# Find process using port
netstat -ano | findstr :9000

# Kill process (Windows)
taskkill /PID <PID> /F

# Or change port in config.json
```

## Next Steps

After successful setup:

1. **Monitor Performance**
   - Check dashboard at http://localhost:5173/
   - Watch logs for errors
   - Verify trades executing successfully

2. **Adjust Configuration**
   - Tune strategy parameters
   - Adjust risk limits
   - Configure polling intervals

3. **Scale Up**
   - Add more trading pairs
   - Increase trade sizes
   - Deploy to production (mainnet)

4. **Review Documentation**
   - [Allowance Automation](./ALLOWANCE_AUTOMATION.md)
   - [Deposit Automation](./DEPOSIT_AUTOMATION.md)
   - [API Documentation](./API.md)

## Support Resources

- **Documentation**: `/docs` folder
- **Logs**: `backend/node/logs/`
- **Configuration**: `backend/node/config/`
- **Environment Validation**: `node check_environment.js`
- **Funding Setup**: `node setup_funding.js`
- **Integration Tests**: `node test_integration.js`

## Safety Checklist

Before going live:

- [ ] Sepolia ETH balance > 0.05 ETH
- [ ] All contracts deployed successfully
- [ ] Tokens minted and deposited to Vault
- [ ] Executor allowances approved
- [ ] Environment validation passes
- [ ] Integration tests pass
- [ ] Backend starts without errors
- [ ] Frontend connects to backend
- [ ] At least 1 test trade executes successfully
- [ ] Kill switch not activated
- [ ] Logs show expected behavior

✅ **Ready for production trading!**
