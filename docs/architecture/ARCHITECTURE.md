# 🏗️ QIE Sentinel - Complete System Architecture

## 📊 System Overview

QIE Sentinel is a production-grade autonomous trading system with enterprise features:
- **Multi-token trading** across multiple assets simultaneously
- **Multi-strategy engine** with 3 distinct trading algorithms
- **Multi-user support** for parallel trading automation
- **Comprehensive risk management** with kill switches and loss limits
- **Backtesting capabilities** for strategy validation
- **Modular architecture** with database migration path
- **Production hardening** with error recovery and performance monitoring

---

## 🏛️ Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                     QIE SENTINEL SYSTEM                          │
└─────────────────────────────────────────────────────────────────┘

┌───────────────────┐
│   Configuration   │
│    Layer          │
├───────────────────┤
│ config.json       │
│ tokens.json       │
│ strategies.json   │
│ users.json        │
│ .env              │
└─────────┬─────────┘
          │
          ▼
┌───────────────────────────────────────────────────────────────┐
│                   BACKEND NODE.JS                              │
├───────────────────────────────────────────────────────────────┤
│                                                                │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐   │
│  │ Data Access  │    │ Risk Manager │    │  Strategy    │   │
│  │   Layer      │    │              │    │  Resolver    │   │
│  └──────────────┘    └──────────────┘    └──────────────┘   │
│         │                    │                    │           │
│         └────────────────────┼────────────────────┘           │
│                              │                                │
│         ┌────────────────────▼─────────────────────┐         │
│         │      Trading Loop Orchestrator            │         │
│         │  - Asset rotation                         │         │
│         │  - Signal generation                      │         │
│         │  - Trade execution                        │         │
│         │  - Performance monitoring                 │         │
│         └────────────────────┬─────────────────────┘         │
│                              │                                │
└──────────────────────────────┼────────────────────────────────┘
                               │
              ┌────────────────┼────────────────┐
              │                │                │
              ▼                ▼                ▼
     ┌─────────────┐  ┌──────────────┐  ┌──────────────┐
     │  Python AI  │  │  Blockchain  │  │  Logging &   │
     │   Engine    │  │   (ethers.js)│  │  Analytics   │
     └─────────────┘  └──────────────┘  └──────────────┘
              │                │                │
              │                ▼                │
              │       ┌─────────────────┐       │
              │       │ Smart Contracts │       │
              │       ├─────────────────┤       │
              │       │ Vault.sol       │       │
              │       │ Executor.sol    │       │
              │       │ + Oracles       │       │
              │       └─────────────────┘       │
              │                                  │
              ▼                                  ▼
       ┌───────────┐                    ┌───────────────┐
       │ Technical │                    │ trades.json   │
       │ Indicators│                    │ analytics.json│
       │ - RSI     │                    │ risk_state.json│
       │ - SMA     │                    └───────────────┘
       │ - Bollinger│
       │ - MACD    │
       └───────────┘
```

---

## 📁 Complete File Structure

```
QIE Sentinel/
│
├── contracts/                          # Smart contract layer
│   ├── contracts/
│   │   ├── Vault.sol                   # Token storage & management
│   │   ├── Executor.sol                # Trade execution + oracle validation
│   │   └── interfaces/
│   │       └── AggregatorV3Interface.sol
│   ├── scripts/
│   │   ├── deploy.js                   # Deployment automation
│   │   └── setup-oracles.js            # Oracle configuration
│   ├── test/                           # 61 tests
│   └── deployed-addresses.json         # Auto-generated addresses
│
├── backend/
│   ├── node/                           # Backend orchestration
│   │   ├── config/                     # Configuration files
│   │   │   ├── config.json             # Main configuration
│   │   │   ├── tokens.json             # Multi-token config
│   │   │   ├── strategies.json         # Strategy registry
│   │   │   ├── users.json              # Multi-user setup
│   │   │   └── risk_state.json         # Risk manager state
│   │   │
│   │   ├── logs/                       # Persistent logging
│   │   │   ├── trades.json
│   │   │   ├── analytics-report.json
│   │   │   └── backups/
│   │   │
│   │   ├── backtest/                   # Backtesting engine
│   │   │   ├── data/
│   │   │   │   └── sample_prices.csv
│   │   │   └── results/
│   │   │
│   │   ├── index_v2.js                 # Modular backend (NEW)
│   │   ├── data_access.js              # DB abstraction layer
│   │   ├── risk_manager.js             # Risk management system
│   │   ├── strategy_resolver.js        # Multi-strategy engine
│   │   ├── backtest.js                 # Backtesting engine
│   │   ├── reports.js                  # Analytics
│   │   ├── log-manager.js              # Log utilities
│   │   │
│   │   ├── testnetStart.sh             # Unix deployment script
│   │   └── testnetStart.ps1            # Windows deployment script
│   │
│   └── python/                         # AI engine
│       ├── signal_engine.py            # Technical indicators
│       └── test_engine.py              # AI tests
│
├── .env.sepolia.example                # Testnet config template
└── Documentation/                      # Comprehensive guides
    ├── ARCHITECTURE.md                 # This file
    ├── MULTI_TOKEN_GUIDE.md
    ├── STRATEGY_GUIDE.md
    ├── RISK_MANAGEMENT.md
    ├── BACKTESTING_GUIDE.md
    ├── TESTNET_DEPLOYMENT.md
    └── ... (existing docs)
```

---

## 🔄 Data Flow

### 1. Initialization Sequence

```
1. Load config.json
2. Initialize data access layer
3. Initialize risk manager
4. Initialize strategy resolver
5. Load contract addresses
6. Connect to blockchain
7. Initialize smart contracts
8. Start Python AI engine
9. Load multi-token configuration
10. Start trading loop
```

### 2. Trading Loop Cycle

```
For each cycle (every 15 seconds):
  │
  ├─→ Select next asset (rotation strategy)
  │
  ├─→ Fetch current price
  │
  ├─→ Update price history for asset
  │
  ├─→ Check risk manager permissions
  │   └─→ Kill switch check
  │   └─→ Daily loss limit check
  │   └─→ Overtrading prevention
  │   └─→ Loss streak check
  │
  ├─→ Generate trading signal
  │   ├─→ Strategy Resolver
  │   │   ├─→ Strategy 1: RSI + SMA
  │   │   ├─→ Strategy 2: Bollinger Bands
  │   │   └─→ Strategy 3: MACD
  │   └─→ Return signal + confidence
  │
  ├─→ Execute trade (if signal != HOLD)
  │   ├─→ Call Executor.sol
  │   ├─→ Validate with oracles
  │   ├─→ Wait for confirmation
  │   └─→ Log to trades.json
  │
  ├─→ Update risk state
  │   ├─→ Record success/failure
  │   └─→ Update daily loss
  │
  └─→ Log performance metrics
```

### 3. Multi-User Flow

```
For each enabled user:
  │
  ├─→ Load user configuration
  │   ├─→ Enabled tokens
  │   ├─→ Strategies
  │   └─→ Risk profile
  │
  ├─→ For each enabled token:
  │   └─→ Execute trading cycle
  │
  └─→ Log per-user metrics
```

---

## 🔌 Module Integration

### Data Access Layer

**Purpose**: Abstract storage backend (JSON → MongoDB migration path)

```javascript
const { getInstance } = require('./data_access');
const dataAccess = getInstance();

// Read data
const config = await dataAccess.read('config.config');
const tokens = await dataAccess.read('config.tokens');

// Write data
await dataAccess.write('logs.trades', tradesArray);

// Append to array
await dataAccess.append('logs.trades', newTrade);

// Query with filter
const enabledTokens = await dataAccess.query(
  'config.tokens',
  token => token.enabled === true
);
```

### Risk Manager

**Purpose**: Protect against excessive losses and failures

```javascript
const RiskManager = require('./risk_manager');
const riskManager = new RiskManager(config.risk);

// Check if trade is allowed
const check = riskManager.canTrade('BTC_USDT', 'user_001');
if (!check.allowed) {
  console.log(`Trade blocked: ${check.reason}`);
}

// Record trade outcome
riskManager.recordSuccess({ userId, asset, profit });
riskManager.recordFailure({ asset, reason: error.message });

// Get current status
const status = riskManager.getStatus();
console.log(`Kill switch: ${status.killSwitchActive}`);
```

### Strategy Resolver

**Purpose**: Multi-strategy trading signal generation

```javascript
const StrategyResolver = require('./strategy_resolver');
const resolver = new StrategyResolver();

// Get signal for specific strategy
const signal = await resolver.getSignal(
  1,              // Strategy ID
  priceHistory,   // Array of prices
  'BTC_USDT'      // Asset identifier
);

console.log(`Signal: ${signal.signal}`);
console.log(`Reason: ${signal.reason}`);
console.log(`Confidence: ${signal.confidence}`);
console.log(`Indicators:`, signal.indicators);
```

### Backtesting Engine

**Purpose**: Historical strategy performance analysis

```javascript
const BacktestEngine = require('./backtest');
const engine = new BacktestEngine();

// Load historical data
const data = engine.loadHistoricalData('prices.csv');

// Run backtest
const results = await engine.runBacktest(1, data, {
  initialBalance: 10000,
  tradeAmount: 100,
  slippage: 0.001,
  fee: 0.003
});

// Generate report
engine.generateReport(results);
engine.exportResults(results, 'backtest_results.json');
```

---

## ⚙️ Configuration System

### Hierarchical Configuration

1. **config.json** - Main configuration
2. **Environment variables** - Override config.json
3. **Runtime parameters** - Override both

### Configuration Priority

```
Runtime > Environment Variables > config.json > Defaults
```

### Key Configuration Sections

**Network**: RPC URL, chain ID, network name

**Contracts**: Vault, Executor, Router addresses

**Trading**: Intervals, auto-trading, rotation strategy

**Risk**: Kill switch, loss limits, slippage tolerance

**Oracle**: Validation settings, staleness limits

**Python**: Engine path, auto-restart, max attempts

**Logging**: Level, file/console, performance metrics

**Database**: Type (JSON/MongoDB), cache settings

**Backtesting**: Enable/disable, data/output paths

**Debug**: Verbose logging, simulation mode

---

## 🚀 Deployment Workflows

### Local Development

```bash
# Terminal 1: Start Hardhat node
cd contracts
npm run node

# Terminal 2: Deploy contracts
npm run deploy:local

# Terminal 3: Start backend
cd backend/node
node index_v2.js
```

### Testnet Deployment (Unix)

```bash
cd backend/node
chmod +x testnetStart.sh
./testnetStart.sh sepolia
```

### Testnet Deployment (Windows)

```powershell
cd backend\node
.\testnetStart.ps1 -Network sepolia
```

### Manual Testnet Deployment

```bash
# 1. Deploy contracts
cd contracts
npx hardhat run scripts/deploy.js --network sepolia

# 2. Configure oracles
npx hardhat run scripts/setup-oracles.js --network sepolia

# 3. Update backend config
# Edit backend/node/config/config.json with deployed addresses

# 4. Start backend
cd backend/node
node index_v2.js
```

---

## 🔒 Security Considerations

### Private Key Management

- Never commit .env files
- Use hardware wallets for mainnet
- Rotate keys regularly
- Use separate keys for testing

### Smart Contract Security

- Oracle price validation
- Slippage protection
- Owner-only functions
- Emergency pause (implement if needed)

### Backend Security

- Input validation
- Error handling
- Rate limiting
- Kill switch protection

### Risk Management

- Daily loss limits
- Consecutive failure protection
- Overtrading prevention
- Loss streak protection

---

## 📊 Performance Optimization

### Memory Management

- Price history limits (100 samples)
- Cache management in data access
- Periodic garbage collection

### RPC Optimization

- Balance caching
- Batch requests where possible
- Connection pooling

### Python Process

- Auto-restart on crash
- Stdio buffering
- Timeout protection

---

## 🔍 Monitoring & Observability

### Real-time Metrics

- Total cycles
- Successful/failed trades
- Average cycle time
- Memory usage
- Python engine status

### Logging Levels

- **INFO**: Normal operations
- **WARN**: Non-critical issues
- **ERROR**: Failures and exceptions
- **DEBUG**: Detailed execution flow

### Performance Tracking

```javascript
performanceMetrics = {
  startTime: timestamp,
  totalCycles: count,
  successfulTrades: count,
  failedTrades: count,
  avgCycleTime: milliseconds,
  memoryUsage: []
}
```

---

## 🧪 Testing Strategy

### Unit Tests

- Smart contracts: 61 tests
- Python engine: 6 scenarios
- JavaScript modules: Syntax validation

### Integration Tests

- Backend + contracts
- Backend + Python
- End-to-end trading flow

### Backtesting

- Historical data simulation
- Strategy performance validation
- Risk management verification

---

## 📈 Scaling Considerations

### Horizontal Scaling

- Multiple backend instances
- User-based sharding
- Asset-based distribution

### Vertical Scaling

- Increased price history
- More frequent polling
- Additional strategies

### Database Migration

- JSON → MongoDB path ready
- Data access layer abstraction
- Zero-downtime migration

---

## 🎯 Production Checklist

- [ ] Smart contracts audited
- [ ] Testnet testing complete (7+ days)
- [ ] Risk limits configured conservatively
- [ ] Monitoring/alerting setup
- [ ] Backup strategies implemented
- [ ] Private keys secured
- [ ] Emergency procedures documented
- [ ] Insurance considered
- [ ] Legal compliance reviewed
- [ ] Performance baseline established

---

**Last Updated**: December 20, 2025  
**Version**: 2.0.0  
**Status**: Production Ready (Testnet)
