# 🚀 QIE Network Setup Guide - Step by Step

## STEP 1: Install MetaMask (If Not Already Installed)

1. Go to https://metamask.io/
2. Click "Download"
3. Install the browser extension for Chrome/Firefox/Edge
4. Follow setup wizard to create a new wallet OR import existing wallet

---

## STEP 2: Add QIE Network to MetaMask

### Method A: Manual Addition (Recommended)

1. **Open MetaMask Extension** (click the fox icon in your browser toolbar)

2. **Click the Network Dropdown** at the top of MetaMask (it might say "Ethereum Mainnet" or "Sepolia")

3. **Click "Add Network"** or "Add a network manually" at the bottom

4. **Fill in these EXACT values:**
   ```
   Network Name:     QIE Mainnet
   RPC URL:          https://rpc1mainnet.qie.digital/
   Chain ID:         1990
   Currency Symbol:  QIE
   Block Explorer:   https://mainnet.qie.digital/
   ```

5. **Click "Save"**

6. **Switch to QIE Network** - Click the network dropdown and select "QIE Mainnet"

### Method B: One-Click Addition (Alternative)

1. Visit: https://chainlist.org/
2. Search for "QIE"
3. Click "Add to MetaMask"

---

## STEP 3: Get Your Wallet Address

1. **Open MetaMask**
2. **Make sure you're on QIE Mainnet** (check the network dropdown at top)
3. **Click your account name** at the top to copy your wallet address
   - It looks like: `0x1234...5678`
4. **Copy this address** - you'll need it to receive QIE coins

**Your wallet address:** `________________` (paste it here for reference)

---

## STEP 4: Get QIE Coins (Gas Fees)

You need QIE coins to pay for gas fees when deploying contracts.

### Option 1: Buy from Exchange
- Check if QIE is listed on exchanges like Gate.io, MEXC, or others
- Buy QIE and withdraw to your MetaMask address (from Step 3)

### Option 2: Get from QIE Faucet (If Available)
- Visit: https://www.qie.digital/ and look for "Faucet" or "Get QIE"
- Enter your wallet address from Step 3

### Option 3: Ask Someone to Send You QIE
- Share your wallet address from Step 3 with someone who has QIE coins

### How Much Do You Need?
- **Minimum:** 0.1 QIE (for testing)
- **Recommended:** 1-5 QIE (for safe deployment + multiple transactions)

---

## STEP 5: Verify Your Private Key in .env File

1. **Open the file:** `c:\Users\Hp\OneDrive\Desktop\QIE Sentinel\.env`

2. **Find this line:**
   ```
   PRIVATE_KEY=your_private_key_here
   ```

3. **Make sure it's the SAME wallet as your MetaMask**
   
   To get your private key from MetaMask:
   - Open MetaMask
   - Click the 3 dots (⋮) next to your account
   - Click "Account Details"
   - Click "Show Private Key"
   - Enter your MetaMask password
   - Copy the private key
   - Paste it in `.env` file (remove any `0x` prefix if present)

4. **Save the `.env` file**

---

## STEP 6: Check Your Balance

Run this command to verify you have QIE coins:

```powershell
cd "c:\Users\Hp\OneDrive\Desktop\QIE Sentinel\contracts"
npx hardhat run scripts/check_balance.js --network qie
```

**Expected Output:**
```
Account: 0x1234...5678
Balance: 1.5 QIE
```

If balance is 0, go back to Step 4.

---

## STEP 7: Deploy Contracts to QIE Network

Once you have QIE coins in your wallet, run:

```powershell
cd "c:\Users\Hp\OneDrive\Desktop\QIE Sentinel\contracts"
npx hardhat run scripts/deploy_qie.js --network qie
```

**This will automatically:**
- ✅ Deploy Mock Tokens (USDT, WBTC, WETH)
- ✅ Deploy SimpleSwap DEX
- ✅ Deploy Vault Contract
- ✅ Deploy Executor Contract
- ✅ Link all contracts together
- ✅ Add liquidity to SimpleSwap
- ✅ Update your backend config files

**Expected Output:**
```
🚀 Starting QIE Sentinel Full Deployment on QIE Network...
Deployer: 0x1234...5678

1️⃣  Deploying Mock Tokens...
   ✅ USDT: 0xABCD...1234
   ✅ WBTC: 0xEFAB...5678
   ✅ WETH: 0x9876...CDEF

2️⃣  Deploying SimpleSwap DEX...
   ✅ SimpleSwap: 0x1111...2222

3️⃣  Deploying Vault...
   ✅ Vault: 0x3333...4444

4️⃣  Deploying Executor...
   ✅ Executor: 0x5555...6666

5️⃣  Linking Contracts...
   ✅ Vault approved Executor

6️⃣  Funding SimpleSwap (Adding Liquidity)...
   ✅ Liquidity added to SimpleSwap

7️⃣  Saving Configurations...
   ✅ Configuration files updated

🎉 QIE Network Migration Complete!
```

---

## STEP 8: Verify Deployment

Check your contracts on the QIE Block Explorer:

1. Go to: https://mainnet.qie.digital/
2. Paste your **Vault address** (from deployment output)
3. You should see the contract creation transaction

---

## STEP 9: Start Trading Bot

Once deployment is complete, start your backend:

```powershell
cd "c:\Users\Hp\OneDrive\Desktop\QIE Sentinel\backend\node"
node index_v2.js
```

**Expected Output:**
```
🤖 QIE Sentinel Backend - Production Mode
Connected to: QIE (Chain ID: 1990)
Vault: 0x3333...4444
Executor: 0x5555...6666
Router: 0x1111...2222

🚀 Initializing QIE Sentinel...
✅ All systems operational!
```

---

## Troubleshooting

### Problem: "Insufficient funds for gas"
**Solution:** You need more QIE coins. Go back to Step 4.

### Problem: "Invalid JSON-RPC response"
**Solution:** Check your internet connection. Try using alternate RPC:
- `https://rpc2mainnet.qie.digital/`
- `https://rpc5mainnet.qie.digital/`

### Problem: "Network not found"
**Solution:** Make sure you added QIE network correctly in Step 2.

### Problem: "Private key mismatch"
**Solution:** Your `.env` PRIVATE_KEY doesn't match your MetaMask wallet. Verify Step 5.

---

## Quick Checklist

Before running deployment, verify:

- [ ] MetaMask is installed
- [ ] QIE Mainnet is added to MetaMask
- [ ] You have at least 0.1 QIE in your wallet
- [ ] Your `.env` file has the correct PRIVATE_KEY
- [ ] You can see your QIE balance in MetaMask

---

## Need Help?

If you're stuck at any step, tell me:
1. Which step number you're on
2. What error message you see (if any)
3. Screenshot if possible

I'll help you resolve it immediately.
