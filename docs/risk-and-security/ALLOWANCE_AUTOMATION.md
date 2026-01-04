# 💰 QIE Sentinel - Allowance Automation Guide

## Overview

The **Allowance Automation** system ensures that the Executor contract has permission to spend tokens from the Vault on behalf of users. Without proper allowances, all trades will fail with `"insufficient vault allowance"` errors.

## How It Works

### Architecture

```
┌─────────────┐       ┌──────────────┐       ┌────────────────┐
│   Wallet    │──────▶│    Vault     │◀──────│   Executor     │
│  (Trader)   │       │  (Token Custody)     │ (Trade Logic)  │
└─────────────┘       └──────────────┘       └────────────────┘
                            │
                            │ getAllowance(user, executor, token)
                            │ approveSpender(executor, token, amount)
                            │
                     ✅ Allowance Required!
```

### Approval Flow

1. **Token Deposit**: User deposits tokens to Vault
2. **Allowance Approval**: User approves Executor to spend from Vault
3. **Trade Execution**: Executor checks allowance, executes trade if sufficient

## Automatic Setup

### Using `setup_funding.js`

The `setup_funding.js` script automatically handles allowance approval:

```bash
cd backend/node
node setup_funding.js
```

**What it does:**
- Loads token configuration from `config/tokens.json`
- For each token:
  - Checks current allowance for Executor
  - Approves 1000 units if allowance < 1000
  - Logs approval transaction hash

**Example Output:**
```
🚀 Initializing Funding Manager...
✅ Loaded 3 tokens: USDT, WBTC, WETH

3️⃣  Approving Executor Allowance...
   USDT: Approving 1000 units for Executor
   TX: 0x1234...5678
   ✅ USDT allowance approved
   
   WBTC: Approving 1000 units for Executor
   TX: 0xabcd...ef01
   ✅ WBTC allowance approved
```

### Integrated Auto-Funding

The backend can automatically check and approve allowances on startup:

**Enable in `config/config.json`:**
```json
{
  "trading": {
    "autoFunding": {
      "enabled": true,
      "checkBeforeStartup": true,
      "defaultAllowanceAmount": "1000",
      "minBalanceThreshold": "100"
    }
  }
}
```

**Then start backend:**
```bash
node index_v2.js
```

It will automatically:
- Check allowances on startup
- Approve if below threshold
- Continue to trading loop

## Manual Allowance Management

### Check Current Allowance

```javascript
const allowance = await vaultContract.getAllowance(
  userAddress,
  executorAddress,
  tokenAddress
);
console.log(`Current allowance: ${ethers.formatEther(allowance)}`);
```

### Approve Allowance

```javascript
const tx = await vaultContract.approveSpender(
  executorAddress,
  tokenAddress,
  ethers.parseEther("1000") // Approve 1000 tokens
);
await tx.wait();
console.log(`Allowance approved: ${tx.hash}`);
```

### Revoke Allowance

```javascript
const tx = await vaultContract.approveSpender(
  executorAddress,
  tokenAddress,
  0 // Set to 0 to revoke
);
await tx.wait();
console.log(`Allowance revoked: ${tx.hash}`);
```

## Pre-Trade Validation

The backend includes automatic pre-trade validation:

```javascript
async function validateAllowance(tokenAddress, requiredAmount) {
  const allowance = await vaultContract.getAllowance(
    wallet.address,
    executorAddress,
    tokenAddress
  );
  
  const required = ethers.parseEther(requiredAmount);
  if (allowance < required) {
    return { 
      valid: false, 
      current: ethers.formatEther(allowance), 
      required: requiredAmount 
    };
  }
  
  return { valid: true };
}
```

**Execution Flow:**
```
┌──────────────┐
│ Trade Signal │
└──────┬───────┘
       │
       ▼
┌──────────────────┐
│ Validate Balance │ ❌ ──▶ Return funding error
└──────┬───────────┘
       │ ✅
       ▼
┌───────────────────┐
│ Validate Allowance│ ❌ ──▶ Return funding error
└──────┬────────────┘
       │ ✅
       ▼
┌──────────────────┐
│ Execute Trade    │
└──────────────────┘
```

## Troubleshooting

### Error: "Executor: insufficient vault allowance"

**Cause**: Executor doesn't have permission to spend tokens from Vault

**Solution 1**: Run funding setup
```bash
node setup_funding.js
```

**Solution 2**: Enable auto-funding in config.json

**Solution 3**: Manually approve allowance via contract

### Allowance Not Updating

**Check 1**: Transaction confirmed?
```bash
# Check transaction on Sepolia Etherscan
https://sepolia.etherscan.io/tx/<TX_HASH>
```

**Check 2**: Correct token address?
```javascript
console.log("Token address:", tokenAddress);
console.log("Vault address:", vaultAddress);
console.log("Executor address:", executorAddress);
```

**Check 3**: Sufficient gas?
```javascript
const balance = await provider.getBalance(wallet.address);
console.log("ETH balance:", ethers.formatEther(balance));
// Need at least 0.01 ETH for gas
```

### Allowance Consumed Too Fast

**Issue**: Large trades consuming allowance quickly

**Solution 1**: Increase default allowance
```json
{
  "trading": {
    "autoFunding": {
      "defaultAllowanceAmount": "5000"  // Increase from 1000
    }
  }
}
```

**Solution 2**: Enable auto-refill
```javascript
// In executeTrade():
if (allowance < ethers.parseEther("100")) {
  await approveExecutor(tokenAddress, "1000");
}
```

## Configuration Reference

### Config Options

```json
{
  "trading": {
    "autoFunding": {
      "enabled": true,              // Enable auto-funding on startup
      "checkBeforeStartup": true,   // Check before starting trading loop
      "defaultAllowanceAmount": "1000",  // Default allowance per token
      "minBalanceThreshold": "100"  // Min balance before refunding
    }
  }
}
```

### Environment Variables

```bash
# Required in .env
VAULT_ADDRESS=0x53f95B19e7191B4737E0A8D2d9298aA2C2853E48
EXECUTOR_ADDRESS=0x29A9844f954DFc6fe84dD335771962d5Eb2d8711
PRIVATE_KEY=your_private_key_here
RPC_URL=https://eth-sepolia.g.alchemy.com/v2/YOUR_API_KEY
```

## Best Practices

### 1. Always Pre-Validate

✅ **DO**: Check allowances before executing trades
```javascript
const check = await validateAllowance(tokenIn, tradeAmount);
if (!check.valid) {
  return { error: 'FUNDING_ISSUE', fundingError: true };
}
```

❌ **DON'T**: Execute trades without validation
```javascript
// This will waste gas if allowance insufficient!
await executorContract.executeTrade(...);
```

### 2. Set Reasonable Allowances

✅ **DO**: Set allowances based on expected trade volume
```javascript
// For daily volume of 100 units
defaultAllowanceAmount: "500"  // 5x buffer
```

❌ **DON'T**: Set unlimited allowances
```javascript
// Security risk!
defaultAllowanceAmount: "999999999999"
```

### 3. Monitor Allowance Usage

✅ **DO**: Log allowance consumption
```javascript
console.log(`Allowance used: ${used}/${total}`);
if (remaining < threshold) {
  await refillAllowance();
}
```

❌ **DON'T**: Assume allowances never deplete

### 4. Separate Funding from Logic Errors

✅ **DO**: Flag funding errors separately
```javascript
return { 
  success: false, 
  error: 'FUNDING_ISSUE', 
  fundingError: true  // Don't trigger kill switch
};
```

❌ **DON'T**: Treat funding issues as critical failures

## Integration Examples

### Startup Check

```javascript
async function main() {
  // ... other initialization ...
  
  if (config.trading.autoFunding.enabled) {
    const fundingManager = new FundingManager();
    await fundingManager.initialize();
    await fundingManager.approveExecutor();
  }
  
  // Start trading loop
  tradingLoop();
}
```

### Runtime Validation

```javascript
async function executeTrade(asset, tradeType) {
  // Pre-trade validation
  const allowanceCheck = await validateAllowance(
    tokenIn, 
    asset.tradeAmount
  );
  
  if (!allowanceCheck.valid) {
    console.error("❌ FUNDING ISSUE: Insufficient allowance");
    return { success: false, fundingError: true };
  }
  
  // Execute trade
  const tx = await executorContract.executeTrade(...);
  return { success: true, txHash: tx.hash };
}
```

## Related Documentation

- [Deposit Automation Guide](./DEPOSIT_AUTOMATION.md)
- [Manual Setup Steps](./MANUAL_STEPS.md)
- [Backend Configuration](./config/config.json)

## Support

For issues or questions:
1. Check logs: `backend/node/logs/`
2. Verify allowances: `node check_environment.js`
3. Re-run funding: `node setup_funding.js`
4. Review [Manual Steps Guide](./MANUAL_STEPS.md)
