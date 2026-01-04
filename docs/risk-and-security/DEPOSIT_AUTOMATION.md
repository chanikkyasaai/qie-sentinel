# 🏦 QIE Sentinel - Deposit Automation Guide

## Overview

The **Deposit Automation** system manages the transfer of tokens from user wallets into the Vault contract. Tokens must be deposited to the Vault before they can be used for trading.

## How It Works

### Architecture

```
┌─────────────┐                  ┌──────────────┐
│   Wallet    │                  │    Vault     │
│  (Trader)   │─────deposit─────▶│ (Token Custody)
└─────────────┘                  └──────────────┘
       │                                │
       │ Token Balance                  │ Vault Balance
       │ (External)                     │ (Contract Storage)
       │                                │
    ✅ Must transfer tokens!        ✅ Available for trading
```

### Deposit Flow

1. **Mint Tokens**: Get test tokens from faucet or mint function
2. **Approve Vault**: Approve Vault to spend tokens from wallet
3. **Deposit**: Transfer tokens from wallet to Vault contract
4. **Trade**: Use deposited tokens for trading

## Automatic Setup

### Using `setup_funding.js`

The `setup_funding.js` script automates the entire deposit process:

```bash
cd backend/node
node setup_funding.js
```

**Complete Workflow:**

1. **Mint Tokens** (if balance < 1000)
   - Calls `faucet()` on each ERC20 token
   - Mints test tokens to wallet

2. **Approve Vault** (if needed)
   - Approves Vault to spend tokens
   - Uses unlimited approval for convenience

3. **Deposit to Vault** (if balance < threshold)
   - Deposits specified amount to Vault
   - Default: 1000 units per token

**Example Output:**
```
🚀 Initializing Funding Manager...

1️⃣  Minting Tokens to Wallet...
   USDT: Current balance 50.00
   ⚠️  Balance below 1000, calling faucet()
   TX: 0x1234...5678
   ✅ USDT minted: 1050.00
   
2️⃣  Depositing Tokens to Vault...
   USDT: Approving Vault to spend
   TX: 0xabcd...ef01
   ✅ Approval confirmed
   
   USDT: Depositing 1000.00 to Vault
   TX: 0x9876...5432
   ✅ Deposit confirmed
   
   Vault balance: 1000.00 USDT
```

### Integrated Auto-Funding

Enable automatic deposit checks on backend startup:

**Configure `config/config.json`:**
```json
{
  "trading": {
    "autoFunding": {
      "enabled": true,
      "checkBeforeStartup": true,
      "defaultDepositAmount": "1000",
      "minBalanceThreshold": "100"
    }
  }
}
```

**Start backend:**
```bash
node index_v2.js
```

**Startup sequence:**
```
🚀 Initializing QIE Sentinel...
✅ Configuration loaded
✅ Blockchain connected
✅ Contracts initialized

💰 Auto-funding enabled - Checking vault status...
✅ USDT vault balance: 854.32
✅ WBTC vault balance: 12.45
⚠️  WETH vault balance: 45.67 (below threshold 100)
   💰 Depositing 1000 WETH to vault...
   ✅ Deposit complete

✅ All systems initialized successfully!
```

## Manual Deposit Process

### Step 1: Mint Tokens

Get test tokens from faucet contract:

```javascript
const tokenContract = new ethers.Contract(
  tokenAddress,
  ["function faucet() public"],
  wallet
);

const tx = await tokenContract.faucet();
await tx.wait();
console.log("Tokens minted!");
```

Or call mint directly (if you're the owner):
```javascript
const tx = await tokenContract.mint(
  wallet.address,
  ethers.parseUnits("1000", decimals)
);
await tx.wait();
```

### Step 2: Approve Vault

Allow Vault contract to spend your tokens:

```javascript
const tokenContract = new ethers.Contract(
  tokenAddress,
  ["function approve(address spender, uint256 amount) returns (bool)"],
  wallet
);

const tx = await tokenContract.approve(
  vaultAddress,
  ethers.MaxUint256  // Unlimited approval (use with caution)
);
await tx.wait();
console.log("Vault approved!");
```

### Step 3: Deposit Tokens

Transfer tokens to Vault:

```javascript
const vaultContract = new ethers.Contract(
  vaultAddress,
  vaultABI,
  wallet
);

const tx = await vaultContract.deposit(
  tokenAddress,
  ethers.parseUnits("1000", decimals)
);
await tx.wait();
console.log("Tokens deposited!");
```

### Step 4: Verify Deposit

Check Vault balance:

```javascript
const balance = await vaultContract.getBalance(
  wallet.address,
  tokenAddress
);
console.log(`Vault balance: ${ethers.formatUnits(balance, decimals)}`);
```

## Pre-Trade Validation

The backend automatically validates vault balances before trading:

```javascript
async function validateVaultBalance(tokenAddress, requiredAmount) {
  const balance = await vaultContract.getBalance(
    wallet.address,
    tokenAddress
  );
  
  const required = ethers.parseEther(requiredAmount);
  if (balance < required) {
    return { 
      valid: false, 
      current: ethers.formatEther(balance), 
      required: requiredAmount 
    };
  }
  
  return { valid: true, current: ethers.formatEther(balance) };
}
```

**Trade Execution Flow:**
```
┌──────────────┐
│ Trade Signal │
└──────┬───────┘
       │
       ▼
┌──────────────────┐
│ Check Vault Balance │ ❌ ──▶ Return FUNDING_ISSUE
└──────┬─────────────┘
       │ ✅ Balance OK
       ▼
┌──────────────────┐
│ Check Allowance  │ ❌ ──▶ Return FUNDING_ISSUE
└──────┬───────────┘
       │ ✅ Allowance OK
       ▼
┌──────────────────┐
│ Execute Trade    │
└──────────────────┘
```

## Token Configuration

Tokens are defined in `config/tokens.json`:

```json
{
  "networkId": 11155111,
  "networkName": "sepolia",
  "tokens": {
    "USDT": {
      "address": "0x1234...5678",
      "decimals": 6,
      "symbol": "USDT",
      "name": "Tether USD"
    },
    "WBTC": {
      "address": "0xabcd...ef01",
      "decimals": 8,
      "symbol": "WBTC",
      "name": "Wrapped Bitcoin"
    },
    "WETH": {
      "address": "0x9876...5432",
      "decimals": 18,
      "symbol": "WETH",
      "name": "Wrapped Ether"
    }
  }
}
```

This file is automatically generated by `deploy_tokens.js`.

## Troubleshooting

### Error: "Insufficient vault balance"

**Cause**: Not enough tokens deposited in Vault

**Solution 1**: Run funding setup
```bash
node setup_funding.js
```

**Solution 2**: Enable auto-funding in `config/config.json`

**Solution 3**: Manually deposit tokens (see Manual Deposit Process above)

### Deposit Transaction Reverts

**Check 1**: Wallet has tokens?
```javascript
const balance = await tokenContract.balanceOf(wallet.address);
console.log("Wallet balance:", ethers.formatUnits(balance, decimals));
```

**Check 2**: Vault approved?
```javascript
const allowance = await tokenContract.allowance(wallet.address, vaultAddress);
console.log("Allowance:", ethers.formatUnits(allowance, decimals));
```

**Check 3**: Sufficient gas?
```javascript
const ethBalance = await provider.getBalance(wallet.address);
console.log("ETH balance:", ethers.formatEther(ethBalance));
// Need at least 0.01 ETH
```

### Tokens Minted But Not Showing

**Issue**: Called `faucet()` but balance is 0

**Solution 1**: Check faucet amount
```javascript
// In MockERC20.sol
function faucet() public {
    _mint(msg.sender, 1000 * 10**decimals);  // Should be non-zero
}
```

**Solution 2**: Verify transaction succeeded
```bash
# Check on Sepolia Etherscan
https://sepolia.etherscan.io/tx/<TX_HASH>
```

**Solution 3**: Check correct token address
```javascript
console.log("Token address:", tokenAddress);
// Should match address in tokens.json
```

### Vault Balance Not Updating

**Issue**: Deposited tokens but `getBalance()` returns 0

**Check 1**: Transaction confirmed?
```bash
# Wait for confirmation
const receipt = await tx.wait();
console.log("Confirmed in block:", receipt.blockNumber);
```

**Check 2**: Correct Vault address?
```javascript
console.log("Vault address:", vaultAddress);
// Should match VAULT_ADDRESS in .env
```

**Check 3**: Calling correct method?
```javascript
// Use Vault.deposit(), not ERC20.transfer()
await vaultContract.deposit(tokenAddress, amount);
```

## Configuration Reference

### Auto-Funding Config

```json
{
  "trading": {
    "autoFunding": {
      "enabled": true,                 // Enable auto-funding
      "checkBeforeStartup": true,      // Check before trading starts
      "defaultDepositAmount": "1000",  // Amount to deposit per token
      "minBalanceThreshold": "100"     // Refill if below this
    }
  }
}
```

### Token Decimals

Different tokens use different decimal places:

| Token | Decimals | Example Amount |
|-------|----------|----------------|
| USDT  | 6        | 1000000000 = 1000 USDT |
| WBTC  | 8        | 100000000 = 1 WBTC |
| WETH  | 18       | 1000000000000000000 = 1 WETH |

**Always use `ethers.parseUnits()`:**
```javascript
const usdtAmount = ethers.parseUnits("1000", 6);   // 1000 USDT
const wbtcAmount = ethers.parseUnits("0.5", 8);    // 0.5 WBTC
const wethAmount = ethers.parseUnits("10", 18);    // 10 WETH
```

## Best Practices

### 1. Batch Deposits

✅ **DO**: Deposit all tokens at once
```javascript
for (const [symbol, token] of Object.entries(tokens)) {
  await depositToVault(token.address, "1000");
}
```

❌ **DON'T**: Deposit one token at a time manually

### 2. Monitor Balances

✅ **DO**: Check balances before trading
```javascript
const check = await validateVaultBalance(tokenIn, tradeAmount);
if (!check.valid) {
  await refillVault(tokenIn);
}
```

❌ **DON'T**: Assume balances never deplete

### 3. Use Reasonable Amounts

✅ **DO**: Deposit based on trading volume
```javascript
// For 10 trades/day of 50 units each
defaultDepositAmount: "1000"  // 2x buffer
```

❌ **DON'T**: Deposit excessive amounts unnecessarily
```javascript
defaultDepositAmount: "999999999"  // Overkill
```

### 4. Separate Test and Production

✅ **DO**: Use different wallets/tokens
```env
# Test
PRIVATE_KEY=test_wallet_key
VAULT_ADDRESS=sepolia_vault_address

# Production
PRIVATE_KEY=prod_wallet_key
VAULT_ADDRESS=mainnet_vault_address
```

❌ **DON'T**: Use production keys on testnet

## Integration Examples

### Startup Auto-Funding

```javascript
async function main() {
  // ... load config ...
  
  if (config.trading.autoFunding.enabled) {
    console.log("💰 Auto-funding enabled...");
    
    const fundingManager = new FundingManager();
    await fundingManager.initialize();
    
    // Check and refill if needed
    await fundingManager.mintTokens();
    await fundingManager.depositToVault();
    
    console.log("✅ Vault funded");
  }
  
  // Start trading
  tradingLoop();
}
```

### Runtime Balance Check

```javascript
async function executeTrade(asset, tradeType) {
  const tokenIn = tradeType === 'BUY' ? asset.tokenOut : asset.tokenIn;
  
  // Validate vault balance
  const balanceCheck = await validateVaultBalance(
    tokenIn, 
    asset.tradeAmount
  );
  
  if (!balanceCheck.valid) {
    console.error(`❌ FUNDING ISSUE: Insufficient vault balance`);
    console.log(`   Current: ${balanceCheck.current}`);
    console.log(`   Required: ${balanceCheck.required}`);
    console.log(`   💡 Run: node setup_funding.js`);
    
    return { 
      success: false, 
      error: 'FUNDING_ISSUE',
      fundingError: true 
    };
  }
  
  // Execute trade
  const tx = await executorContract.executeTrade(...);
  return { success: true, txHash: tx.hash };
}
```

### Automatic Refill

```javascript
// Monitor vault balance and refill automatically
setInterval(async () => {
  for (const [symbol, token] of Object.entries(tokens)) {
    const balance = await vaultContract.getBalance(
      wallet.address,
      token.address
    );
    
    const threshold = ethers.parseUnits(
      config.trading.autoFunding.minBalanceThreshold,
      token.decimals
    );
    
    if (balance < threshold) {
      console.log(`⚠️  ${symbol} balance low: ${ethers.formatUnits(balance, token.decimals)}`);
      console.log(`   💰 Refilling vault...`);
      
      await depositToVault(
        token.address,
        config.trading.autoFunding.defaultDepositAmount
      );
      
      console.log(`   ✅ ${symbol} vault refilled`);
    }
  }
}, 3600000); // Check every hour
```

## Related Documentation

- [Allowance Automation Guide](./ALLOWANCE_AUTOMATION.md)
- [Manual Setup Steps](./MANUAL_STEPS.md)
- [Token Deployment Guide](../../contracts/scripts/README.md)

## Support

For issues or questions:
1. Check logs: `backend/node/logs/`
2. Verify environment: `node check_environment.js`
3. Re-run funding: `node setup_funding.js`
4. Review [Manual Steps Guide](./MANUAL_STEPS.md)
