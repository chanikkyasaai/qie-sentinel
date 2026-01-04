# 🛠️ QIE Sentinel - Setup & Installation Guide

## 📦 Installation Steps

### 1. Smart Contracts Setup

Navigate to contracts directory and install dependencies:

```bash
cd contracts
npm install
```

This installs:
- `hardhat` - Ethereum development environment
- `@nomicfoundation/hardhat-toolbox` - Hardhat plugins bundle
- `@openzeppelin/contracts` - Secure smart contract library
- `dotenv` - Environment variable management

### 2. Node.js Backend Setup

Navigate to Node backend and install dependencies:

```bash
cd backend/node
npm install
```

This installs:
- `ethers` - Ethereum library for blockchain interaction
- `axios` - HTTP client for API calls
- `dotenv` - Environment configuration
- `nodemon` (dev) - Auto-restart on file changes

### 3. Python AI Engine Setup

Navigate to Python directory and install dependencies:

```bash
cd backend/python
pip install -r requirements.txt
```

Or install manually:
```bash
pip install numpy pandas requests python-dotenv
```

For AI/ML capabilities (add when needed):
```bash
# TensorFlow
pip install tensorflow

# PyTorch
pip install torch torchvision

# Scikit-learn
pip install scikit-learn pandas-ta
```

## ⚙️ Configuration

### 1. Create Environment File

Copy the example environment file:
```bash
cp .env.example .env
```

### 2. Configure Local Development

Edit `.env` with local settings:
```env
RPC_URL=http://localhost:8545
PRIVATE_KEY=your_hardhat_test_private_key
POLLING_INTERVAL=5000
AUTO_TRADING_ENABLED=false
```

### 3. Get Hardhat Test Account

Start Hardhat node to get test accounts:
```bash
cd contracts
npx hardhat node
```

Copy one of the private keys displayed for testing.

## 🧪 Testing the Setup

### 1. Compile Contracts

```bash
cd contracts
npm run compile
```

Expected output:
```
Compiled 2 Solidity files successfully
```

### 2. Run Contract Tests

```bash
cd contracts
npm test
```

### 3. Deploy to Local Network

Terminal 1 - Start local blockchain:
```bash
cd contracts
npm run node
```

Terminal 2 - Deploy contracts:
```bash
cd contracts
npm run deploy:local
```

Save the deployed contract addresses to your `.env` file.

### 4. Test Node.js Backend

```bash
cd backend/node
npm start
```

Expected output:
```
🤖 QIE Sentinel Backend Starting...
✅ Blockchain connection established
✅ Backend is running!
```

### 5. Test Python Engine

```bash
cd backend/python
python signal_engine.py
```

Expected output:
```
🧠 QIE Sentinel AI Engine Initializing...
✅ Signal Engine initialized
✅ AI Engine ready!
```

## 🌐 Network Configuration

### Local Development (Hardhat)
```env
RPC_URL=http://localhost:8545
CHAIN_ID=31337
```

### Ethereum Testnet (Sepolia)
```env
RPC_URL=https://sepolia.infura.io/v3/YOUR_PROJECT_ID
CHAIN_ID=11155111
ETHERSCAN_API_KEY=your_etherscan_key
```

### Ethereum Mainnet (Production)
```env
RPC_URL=https://mainnet.infura.io/v3/YOUR_PROJECT_ID
CHAIN_ID=1
# ⚠️ Use hardware wallet or secure key management!
```

## 📝 Quick Command Reference

### Smart Contracts
```bash
# Compile
npm run compile

# Test
npm run test

# Deploy local
npm run deploy:local

# Clean artifacts
npm run clean

# Start local node
npm run node
```

### Backend
```bash
# Start backend
cd backend/node
npm start

# Start with auto-reload (development)
npm run dev
```

### Python
```bash
# Run AI engine
cd backend/python
python signal_engine.py

# Install dependencies
pip install -r requirements.txt
```

## 🐛 Troubleshooting

### Issue: "Cannot find module"
**Solution**: Run `npm install` in the appropriate directory

### Issue: "Python module not found"
**Solution**: 
```bash
pip install --upgrade pip
pip install -r requirements.txt
```

### Issue: "Connection refused to localhost:8545"
**Solution**: Make sure Hardhat node is running:
```bash
cd contracts
npm run node
```

### Issue: "Insufficient funds"
**Solution**: Use Hardhat test accounts which have pre-funded ETH

## ✅ Verification Checklist

After setup, verify:
- [ ] Smart contracts compile without errors
- [ ] Tests pass successfully
- [ ] Contracts deploy to local network
- [ ] Node.js backend starts and connects
- [ ] Python engine initializes
- [ ] .env file configured
- [ ] All dependencies installed

## 🚀 Next Steps

After successful setup:
1. Review contract code in `contracts/contracts/`
2. Understand backend flow in `backend/node/index.js`
3. Explore AI engine in `backend/python/signal_engine.py`
4. Start implementing real logic based on TODOs
5. Add DEX integration
6. Implement oracle connections
7. Train AI model

---

Need help? Check README.md or open an issue!
