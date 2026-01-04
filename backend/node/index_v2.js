/**
 * QIE Sentinel - Production Backend System
 * 
 * Multi-token, multi-user, multi-strategy autonomous trading engine
 * with comprehensive risk management and performance monitoring
 */

require('dotenv').config({ path: '../../.env' });
const { ethers } = require('ethers');
const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

// Import custom modules
const { getInstance: getDataAccess } = require('./data_access');
const RiskManager = require('./risk_manager');
const StrategyResolver = require('./strategy_resolver');
const APIServer = require('./api_server');
const FundingManager = require('./setup_funding');

console.log("🤖 QIE Sentinel Backend - Production Mode");
console.log("=" .repeat(70));

// ============ Global State ============

let config = null;
let dataAccess = null;
let riskManager = null;
let strategyResolver = null;
let apiServer = null;

let provider;
let wallet;
let vaultContract;
let executorContract;
let routerContract;

let pythonProcess = null;
let pythonReady = false;
let pythonRestartCount = 0;

// Per-asset state tracking
let assetStates = {};
let currentAssetIndex = 0;

// Performance metrics
let performanceMetrics = {
  startTime: Date.now(),
  totalCycles: 0,
  successfulTrades: 0,
  failedTrades: 0,
  avgCycleTime: 0,
  memoryUsage: []
};

// ============ Initialization ============

/**
 * Load configuration from config.json
 */
async function loadConfiguration() {
  try {
    console.log("📋 Loading configuration...");
    
    const configPath = path.join(__dirname, 'config', 'config.json');
    config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
    
    // Override with environment variables
    if (process.env.RPC_URL) config.network.rpcUrl = process.env.RPC_URL;
    if (process.env.PRIVATE_KEY) wallet = new ethers.Wallet(process.env.PRIVATE_KEY);
    
    console.log(`✅ Configuration loaded`);
    console.log(`   Network: ${config.network.networkName}`);
    console.log(`   RPC: ${config.network.rpcUrl}`);
    console.log(`   Trading: ${config.trading.enableAutoTrading ? 'ENABLED' : 'DISABLED'}`);
    
    return true;
  } catch (error) {
    console.error(`❌ Failed to load configuration: ${error.message}`);
    return false;
  }
}

/**
 * Initialize data access layer
 */
async function initializeDataAccess() {
  dataAccess = getDataAccess({
    type: config.database.type,
    basePath: __dirname,
    useCache: config.database.useFileCache
  });
  console.log(`✅ Data access initialized (${config.database.type})`);
}

/**
 * Initialize risk manager
 */
async function initializeRiskManager() {
  riskManager = new RiskManager(config.risk);
  
  const status = riskManager.getStatus();
  console.log(`✅ Risk manager initialized`);
  console.log(`   Kill switch: ${status.killSwitchActive ? 'ACTIVE' : 'inactive'}`);
  console.log(`   Daily loss: ${status.dailyLoss}`);
}

/**
 * Initialize strategy resolver
 */
async function initializeStrategyResolver() {
  strategyResolver = new StrategyResolver();
  await strategyResolver.loadStrategies();
  
  const strategies = strategyResolver.getEnabledStrategies();
  console.log(`✅ Strategy resolver initialized`);
  console.log(`   Enabled strategies: ${strategies.length}`);
  strategies.forEach(s => {
    console.log(`   - [${s.id}] ${s.name}`);
  });
}

/**
 * Load deployed contract addresses
 */
async function loadContractAddresses() {
  try {
    const addressesPath = path.join(__dirname, config.trading.contractsPath || '../../contracts', 'deployed-addresses.json');
    
    if (fs.existsSync(addressesPath)) {
      const addresses = JSON.parse(fs.readFileSync(addressesPath, 'utf8'));
      config.contracts.vaultAddress = addresses.vault;
      config.contracts.executorAddress = addresses.executor;
      config.contracts.routerAddress = addresses.router || config.contracts.routerAddress;
      console.log(`✅ Contract addresses loaded`);
      return true;
    } else {
      console.warn(`⚠️  Deployed addresses file not found`);
      return false;
    }
  } catch (error) {
    console.error(`❌ Error loading contract addresses: ${error.message}`);
    return false;
  }
}

/**
 * Initialize blockchain connection
 */
async function initializeBlockchain() {
  try {
    console.log("🔗 Connecting to blockchain...");
    
    provider = new ethers.JsonRpcProvider(config.network.rpcUrl);
    
    // Load wallet from config or environment
    if (!wallet) {
      if (process.env.PRIVATE_KEY) {
        wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);
      } else {
        throw new Error('No private key configured');
      }
    } else {
      wallet = wallet.connect(provider);
    }
    
    const balance = await provider.getBalance(wallet.address);
    console.log(`✅ Blockchain connected`);
    console.log(`   Wallet: ${wallet.address}`);
    console.log(`   Balance: ${ethers.formatEther(balance)} ETH`);
    
    return true;
  } catch (error) {
    console.error(`❌ Blockchain connection failed: ${error.message}`);
    return false;
  }
}

/**
 * Initialize smart contracts
 */
async function initializeContracts() {
  try {
    console.log("📜 Loading smart contracts...");
    
    // Load ABIs
    const vaultABI = loadContractABI('Vault');
    const executorABI = loadContractABI('Executor');
    
    // Initialize contract instances
    vaultContract = new ethers.Contract(
      config.contracts.vaultAddress,
      vaultABI,
      wallet
    );
    
    executorContract = new ethers.Contract(
      config.contracts.executorAddress,
      executorABI,
      wallet
    );
    
    console.log(`✅ Contracts initialized`);
    console.log(`   Vault: ${config.contracts.vaultAddress}`);
    console.log(`   Executor: ${config.contracts.executorAddress}`);
    
    return true;
  } catch (error) {
    console.error(`❌ Contract initialization failed: ${error.message}`);
    return false;
  }
}

/**
 * Load contract ABI from Hardhat artifacts
 */
function loadContractABI(contractName) {
  const artifactPath = path.join(
    __dirname,
    config.trading.contractsPath || '../../contracts',
    'artifacts',
    'contracts',
    `${contractName}.sol`,
    `${contractName}.json`
  );
  
  if (!fs.existsSync(artifactPath)) {
    throw new Error(`ABI file not found: ${artifactPath}`);
  }
  
  const artifact = JSON.parse(fs.readFileSync(artifactPath, 'utf8'));
  return artifact.abi;
}

/**
 * Initialize Python AI engine
 */
async function initializePythonEngine() {
  return new Promise((resolve, reject) => {
    console.log("🐍 Starting Python AI engine...");
    
    const enginePath = path.resolve(__dirname, config.python.enginePath);
    
    pythonProcess = spawn(config.python.pythonExecutable, [enginePath], {
      stdio: ['pipe', 'pipe', 'pipe']
    });
    
    const timeout = setTimeout(() => {
      reject(new Error('Python engine startup timeout'));
    }, 10000);
    
    pythonProcess.stdout.once('data', (data) => {
      clearTimeout(timeout);
      const output = data.toString().trim();
      
      if (output.includes('READY')) {
        pythonReady = true;
        console.log(`✅ Python AI engine ready`);
        resolve();
      } else {
        reject(new Error(`Unexpected Python output: ${output}`));
      }
    });
    
    pythonProcess.stderr.on('data', (data) => {
      console.error(`🐍 Python error: ${data.toString()}`);
    });
    
    pythonProcess.on('exit', (code) => {
      pythonReady = false;
      console.warn(`⚠️  Python process exited with code ${code}`);
      
      if (config.python.autoRestartOnCrash && pythonRestartCount < config.python.maxRestartAttempts) {
        pythonRestartCount++;
        console.log(`♻️  Auto-restarting Python engine (attempt ${pythonRestartCount}/${config.python.maxRestartAttempts})...`);
        
        setTimeout(() => {
          initializePythonEngine().catch(console.error);
        }, config.python.restartDelaySeconds * 1000);
      }
    });
  });
}

/**
 * Reset kill switch manually
 */
function resetKillSwitch() {
  riskManager.consecutiveFailures = 0;
  riskManager.killSwitchActive = false;
  console.log("✅ Kill switch reset");
}

/**
 * Validate all assets have sufficient vault balance and allowance
 */
async function validateAllAssets() {
  console.log("\n🔍 Validating vault balances and allowances for all trading pairs...");
  
  const tokens = await dataAccess.read('config.tokens');
  const enabledTokens = tokens.tokenMap.filter(t => t.enabled);
  
  let allValid = true;
  
  for (const token of enabledTokens) {
    console.log(`\n   📋 Checking ${token.tradingPair}...`);
    
    // Check tokenIn balance (what we're spending)
    try {
      const balance = await vaultContract.getBalance(wallet.address, token.tokenIn);
      const required = ethers.parseUnits(token.tradeAmount, token.decimals);
      const balanceFormatted = ethers.formatUnits(balance, token.decimals);
      
      if (balance < required) {
        console.log(`   ❌ Insufficient ${token.symbol} balance: ${balanceFormatted} < ${token.tradeAmount}`);
        allValid = false;
      } else {
        console.log(`   ✅ ${token.symbol} balance: ${balanceFormatted}`);
      }
      
      // Check allowance
      const allowance = await vaultContract.getAllowance(wallet.address, token.tokenIn);
      const allowanceFormatted = ethers.formatUnits(allowance, token.decimals);
      
      if (allowance < required) {
        console.log(`   ❌ Insufficient ${token.symbol} allowance: ${allowanceFormatted} < ${token.tradeAmount}`);
        allValid = false;
      } else {
        console.log(`   ✅ ${token.symbol} allowance: ${allowanceFormatted}`);
      }
      
      // 🧪 SIMULATE TRADE VALIDATION (same code path as real trade)
      console.log(`   🧪 Simulating trade validation...`);
      try {
        const simBalanceCheck = await validateVaultBalance(token.tokenIn, token.tradeAmount, token.decimals);
        if (!simBalanceCheck.valid) {
          console.log(`   ❌ Trade would fail: Insufficient balance`);
          allValid = false;
        } else {
          const simAllowanceCheck = await validateAllowance(token.tokenIn, token.tradeAmount, token.decimals);
          if (!simAllowanceCheck.valid) {
            console.log(`   ❌ Trade would fail: Insufficient allowance`);
            console.log(`      Current: ${simAllowanceCheck.current}, Required: ${simAllowanceCheck.required}`);
            allValid = false;
          } else {
            console.log(`   ✅ Trade validation would PASS`);
          }
        }
      } catch (simError) {
        console.log(`   ❌ Trade simulation failed: ${simError.message}`);
        allValid = false;
      }
    } catch (error) {
      console.log(`   ❌ Validation error: ${error.message}`);
      allValid = false;
    }
  }
  
  if (!allValid) {
    console.log("\n❌ STARTUP VALIDATION FAILED!");
    console.log("   💡 Run: node setup_funding.js");
    console.log("   Then restart the backend.\n");
    return false;
  }
  
  console.log("\n✅ All assets validated - ready to trade!\n");
  return true;
}

/**
 * Initialize asset states for multi-token trading
 */
async function initializeAssets() {
  const tokens = await dataAccess.read('config.tokens');
  
  if (!tokens || !tokens.tokens) {
    console.error(`❌ Failed to load token configuration`);
    return false;
  }
  
  const enabledTokens = tokens.tokenMap ? tokens.tokenMap.filter(t => t.enabled) : [];
  
  console.log(`🪙  Initializing ${enabledTokens.length} trading assets...`);
  
  for (const token of enabledTokens) {
    assetStates[token.id] = {
      config: token,
      priceHistory: [],
      lastTradeTime: 0,
      lastTradeType: null,
      lastPrice: null,
      tradeCount: 0
    };
    
    console.log(`   ✅ ${token.tradingPair}`);
  }
  
  return true;
}

// ============ Trading Logic ============

/**
 * Get AI trading signal for specific asset
 */
async function getAISignal(priceHistory, asset) {
  return new Promise((resolve, reject) => {
    if (!pythonReady) {
      return reject(new Error('Python engine not ready'));
    }
    
    const timeout = setTimeout(() => {
      reject(new Error('AI signal timeout'));
    }, 5000);
    
    const handleResponse = (data) => {
      clearTimeout(timeout);
      pythonProcess.stdout.removeListener('data', handleResponse);
      
      const signal = data.toString().trim();
      
      if (['BUY', 'SELL', 'HOLD'].includes(signal)) {
        resolve(signal);
      } else {
        reject(new Error(`Invalid signal: ${signal}`));
      }
    };
    
    pythonProcess.stdout.once('data', handleResponse);
    
    const request = JSON.stringify({ prices: priceHistory }) + '\n';
    pythonProcess.stdin.write(request);
  });
}

/**
 * Get trading signal using strategy resolver
 */
async function getTradeSignal(asset, strategyId) {
  try {
    const assetState = assetStates[asset.id];
    
    if (assetState.priceHistory.length < 15) {
      return {
        signal: 'HOLD',
        reason: 'Insufficient price history',
        confidence: 0
      };
    }
    
    // Check risk manager
    const riskCheck = riskManager.canTrade(asset.id, 'default');
    if (!riskCheck.allowed) {
      return {
        signal: 'HOLD',
        reason: riskCheck.reason,
        confidence: 0
      };
    }
    
    // Get signal from strategy
    const signalResult = await strategyResolver.getSignal(
      strategyId,
      assetState.priceHistory,
      asset.id
    );
    
    // Prevent duplicate trades
    if (signalResult.signal === assetState.lastTradeType && assetState.lastPrice) {
      const priceDiff = Math.abs(assetState.priceHistory[assetState.priceHistory.length - 1] - assetState.lastPrice);
      if (priceDiff < 2) {
        return {
          ...signalResult,
          signal: 'HOLD',
          reason: 'Duplicate trade prevented'
        };
      }
    }
    
    return signalResult;
  } catch (error) {
    console.error(`❌ Error getting trade signal: ${error.message}`);
    return {
      signal: 'HOLD',
      reason: `Error: ${error.message}`,
      confidence: 0
    };
  }
}

/**
 * Validate allowances before executing a trade
 */
async function validateAllowance(tokenAddress, requiredAmount, decimals) {
  try {
    const allowance = await vaultContract.getAllowance(
      wallet.address,
      tokenAddress
    );
    
    const required = ethers.parseUnits(requiredAmount, decimals);
    if (allowance < required) {
      console.log(`   ⚠️  Insufficient allowance: ${ethers.formatUnits(allowance, decimals)} < ${requiredAmount}`);
      return { valid: false, current: ethers.formatUnits(allowance, decimals), required: requiredAmount };
    }
    
    console.log(`   ✅ Allowance OK: ${ethers.formatUnits(allowance, decimals)}`);
    return { valid: true, current: ethers.formatUnits(allowance, decimals) };
  } catch (error) {
    console.error(`   ❌ Allowance check failed: ${error.message}`);
    return { valid: false, error: error.message };
  }
}

/**
 * Validate vault balance before executing a trade
 */
async function validateVaultBalance(tokenAddress, requiredAmount, decimals) {
  try {
    const balance = await vaultContract.getBalance(wallet.address, tokenAddress);
    
    const required = ethers.parseUnits(requiredAmount, decimals);
    if (balance < required) {
      console.log(`   ⚠️  Insufficient vault balance: ${ethers.formatUnits(balance, decimals)} < ${requiredAmount}`);
      return { valid: false, current: ethers.formatUnits(balance, decimals), required: requiredAmount };
    }
    
    console.log(`   ✅ Balance OK: ${ethers.formatUnits(balance, decimals)}`);
    return { valid: true, current: ethers.formatUnits(balance, decimals) };
  } catch (error) {
    console.error(`   ❌ Balance check failed: ${error.message}`);
    return { valid: false, error: error.message };
  }
}

/**
 * Execute trade on-chain with pre-trade validation
 */
async function executeTrade(asset, tradeType, price, strategyId, userId = 'default') {
  try {
    console.log(`\n⚡ Executing ${tradeType} trade for ${asset.tradingPair}...`);
    
    // Load token addresses from config
    const tokenConfig = await dataAccess.read('config.tokens');
    
    // tokenIn is always what we SPEND (asset.tokenIn)
    // tokenOut is always what we RECEIVE (asset.tokenOut)
    const tokenInAddress = tokenConfig.tokens[asset.tokenIn]?.address;
    const tokenOutAddress = tokenConfig.tokens[asset.tokenOut]?.address;
    const tokenInDecimals = tokenConfig.tokens[asset.tokenIn]?.decimals;
    const tokenOutDecimals = tokenConfig.tokens[asset.tokenOut]?.decimals;
    
    if (!tokenInAddress || !tokenOutAddress) {
      throw new Error(`Token addresses not found: ${asset.tokenIn} or ${asset.tokenOut}`);
    }
    
    const tradeAmount = ethers.parseUnits(asset.tradeAmount, tokenInDecimals);
    const minOutput = ethers.parseUnits(asset.minOutput, tokenOutDecimals);
    const path = [tokenInAddress, tokenOutAddress];
    
    console.log(`   Price: ${price.toFixed(2)}`);
    console.log(`   Amount: ${asset.tradeAmount}`);
    console.log(`   Strategy: ${strategyId}`);
    
    // 🔍 PRE-TRADE VALIDATION
    console.log(`\n🔍 Pre-trade validation...`);
    
    // 1. Validate vault balance
    const balanceCheck = await validateVaultBalance(tokenInAddress, asset.tradeAmount, tokenInDecimals);
    if (!balanceCheck.valid) {
      console.error(`❌ FUNDING ISSUE: Insufficient vault balance`);
      console.log(`   💡 Run: node setup_funding.js`);
      return { 
        success: false, 
        error: 'FUNDING_ISSUE: Insufficient vault balance',
        fundingError: true 
      };
    }
    
    // 2. Validate executor allowance
    const allowanceCheck = await validateAllowance(tokenInAddress, asset.tradeAmount, tokenInDecimals);
    if (!allowanceCheck.valid) {
      console.log(`⚙️  Auto-fixing: Insufficient executor allowance`);
      console.log(`   Running funding setup...`);
      
      try {
        const fundingManager = new FundingManager();
        await fundingManager.initialize();
        await fundingManager.run();
        
        console.log(`✅ Funding setup complete - retrying trade...`);
        
        // Revalidate allowance after funding
        const recheckAllowance = await validateAllowance(tokenInAddress, asset.tradeAmount, tokenInDecimals);
        if (!recheckAllowance.valid) {
          console.error(`❌ Still insufficient allowance after auto-funding`);
          return { success: false, error: 'Auto-funding failed', fundingError: true };
        }
      } catch (fundingError) {
        console.error(`❌ Auto-funding failed: ${fundingError.message}`);
        return { success: false, error: 'Auto-funding failed', fundingError: true };
      }
    }
    
    console.log(`✅ Pre-trade validation passed\n`);
    
    const tx = await executorContract.executeTrade(
      wallet.address,
      tokenInAddress,
      tokenOutAddress,
      tradeAmount,
      minOutput,
      path,
      strategyId
    );
    
    console.log(`   TX: ${tx.hash}`);
    
    const receipt = await tx.wait();
    
    console.log(`✅ Trade executed`);
    console.log(`   Block: ${receipt.blockNumber}`);
    console.log(`   Gas: ${receipt.gasUsed.toString()}`);
    
    // Calculate slippage
    const expectedOutput = parseFloat(asset.tradeAmount);
    const minOut = parseFloat(asset.minOutput);
    const slippageUsed = ((expectedOutput - minOut) / expectedOutput * 100).toFixed(2);
    
    // Log trade
    const tradeLog = {
      timestamp: new Date().toISOString(),
      userId,
      asset: asset.id,
      tradingPair: asset.tradingPair,
      signalType: tradeType,
      tokenIn: asset.tokenIn,
      tokenOut: asset.tokenOut,
      amount: asset.tradeAmount,
      txHash: tx.hash,
      gasUsed: receipt.gasUsed.toString(),
      slippageUsed: `${slippageUsed}%`,
      blockNumber: receipt.blockNumber,
      price: price.toFixed(2),
      strategyId,
      confidence: 75,
      reason: `${tradeType} signal detected`,
      pnl: 0
    };
    
    await dataAccess.append('logs.trades', tradeLog);
    
    // Save to trades collection for API
    const tradesData = await dataAccess.read('trades') || { trades: [] };
    tradesData.trades.push(tradeLog);
    tradesData.lastUpdated = new Date().toISOString();
    await dataAccess.write('trades', tradesData);
    
    // Update asset state
    const assetState = assetStates[asset.id];
    assetState.lastTradeTime = Date.now();
    assetState.lastTradeType = tradeType;
    assetState.lastPrice = price;
    assetState.tradeCount++;
    
    // Record with risk manager
    riskManager.recordSuccess({
      userId,
      asset: asset.id,
      profit: 0 // Would need to calculate actual profit
    });
    
    performanceMetrics.successfulTrades++;
    
    return { success: true, txHash: tx.hash };
  } catch (error) {
    console.error(`❌ Trade execution failed: ${error.message}`);
    
    // Check if it's a funding error
    const isFundingError = error.message && (
      error.message.includes('insufficient') ||
      error.message.includes('allowance') ||
      error.message.includes('balance')
    );
    
    riskManager.recordFailure({
      asset: asset.id,
      reason: error.message,
      isFundingError // Pass flag to risk manager
    });
    
    performanceMetrics.failedTrades++;
    
    return { 
      success: false, 
      error: error.message,
      fundingError: isFundingError
    };
  }
}

/**
 * Update price history for asset
 */
async function updatePriceHistory(asset) {
  try {
    // Simulate price fetch (would use real oracle/DEX in production)
    const simulatedPrice = 100 + Math.random() * 20;
    
    const assetState = assetStates[asset.id];
    assetState.priceHistory.push(simulatedPrice);
    
    // Keep history manageable
    if (assetState.priceHistory.length > 100) {
      assetState.priceHistory.shift();
    }
    
    return simulatedPrice;
  } catch (error) {
    console.error(`❌ Error updating price history: ${error.message}`);
    return null;
  }
}

// ============ Main Trading Loop ============

/**
 * Main autonomous trading loop
 */
async function tradingLoop() {
  console.log("\n🔄 Starting autonomous trading loop...");
  console.log(`   Interval: ${config.trading.pollingIntervalSeconds}s`);
  console.log(`   Auto-trading: ${config.trading.enableAutoTrading ? 'ENABLED' : 'DISABLED'}`);
  console.log(`   Asset rotation: ${config.trading.rotateAssets ? 'ENABLED' : 'DISABLED'}`);
  console.log("=" .repeat(70));
  
  setInterval(async () => {
    const cycleStart = Date.now();
    performanceMetrics.totalCycles++;
    
    try {
      // Get enabled assets
      const tokens = await dataAccess.read('config.tokens');
      const enabledAssets = tokens.tokenMap.filter(t => t.enabled);
      
      if (enabledAssets.length === 0) {
        console.log(`⚠️  No enabled assets`);
        return;
      }
      
      // Rotate to next asset if configured
      if (config.trading.rotateAssets) {
        currentAssetIndex = (currentAssetIndex + 1) % enabledAssets.length;
      }
      
      const asset = enabledAssets[currentAssetIndex];
      
      console.log(`\n📊 Cycle #${performanceMetrics.totalCycles} - Asset: ${asset.tradingPair}`);
      
      // Update price history
      const currentPrice = await updatePriceHistory(asset);
      
      if (!currentPrice) {
        console.log(`⚠️  Failed to fetch price`);
        return;
      }
      
      console.log(`   Current price: ${currentPrice.toFixed(2)}`);
      console.log(`   History size: ${assetStates[asset.id].priceHistory.length}`);
      
      // Get trading signal
      const signalResult = await getTradeSignal(asset, 1); // Use strategy 1
      
      console.log(`   Signal: ${signalResult.signal} (${signalResult.reason})`);
      console.log(`   Confidence: ${(signalResult.confidence * 100).toFixed(0)}%`);
      
      // Execute trade if signal is not HOLD
      if (config.trading.enableAutoTrading && signalResult.signal !== 'HOLD') {
        await executeTrade(asset, signalResult.signal, currentPrice, 1);
      } else if (signalResult.signal === 'HOLD') {
        console.log(`   💤 Holding position`);
      }
      
      // Log performance metrics
      const cycleTime = Date.now() - cycleStart;
      performanceMetrics.avgCycleTime = 
        (performanceMetrics.avgCycleTime * (performanceMetrics.totalCycles - 1) + cycleTime) / 
        performanceMetrics.totalCycles;
      
      if (config.logging.enablePerformanceMetrics && performanceMetrics.totalCycles % 10 === 0) {
        logPerformanceMetrics();
      }
      
    } catch (error) {
      console.error(`❌ Trading loop error: ${error.message}`);
      if (config.debug.enableVerboseLogging) {
        console.error(error.stack);
      }
    }
  }, config.trading.pollingIntervalSeconds * 1000);
}

/**
 * Log performance metrics
 */
function logPerformanceMetrics() {
  const uptime = (Date.now() - performanceMetrics.startTime) / 1000 / 60;
  const memory = process.memoryUsage();
  
  console.log(`\n📊 Performance Metrics:`);
  console.log(`   Uptime: ${uptime.toFixed(1)} minutes`);
  console.log(`   Cycles: ${performanceMetrics.totalCycles}`);
  console.log(`   Successful trades: ${performanceMetrics.successfulTrades}`);
  console.log(`   Failed trades: ${performanceMetrics.failedTrades}`);
  console.log(`   Avg cycle time: ${performanceMetrics.avgCycleTime.toFixed(0)}ms`);
  console.log(`   Memory: ${(memory.heapUsed / 1024 / 1024).toFixed(2)} MB`);
}

// ============ Error Handling ============

/**
 * Global error handlers
 */
process.on('unhandledRejection', (reason, promise) => {
  console.error('🚨 Unhandled Promise Rejection:', reason);
  if (config && config.debug.enableVerboseLogging) {
    console.error('Promise:', promise);
  }
});

process.on('uncaughtException', (error) => {
  console.error('🚨 Uncaught Exception:', error.message);
  if (config && config.debug.enableVerboseLogging) {
    console.error(error.stack);
  }
  
  // Graceful shutdown
  cleanup();
  process.exit(1);
});

/**
 * Cleanup on shutdown
 */
function cleanup() {
  console.log('\n🛑 Shutting down...');
  
  if (pythonProcess) {
    pythonProcess.kill();
  }
  
  logPerformanceMetrics();
  
  console.log('✅ Cleanup complete');
}

process.on('SIGINT', () => {
  console.log('\n📢 Received SIGINT');
  cleanup();
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\n📢 Received SIGTERM');
  cleanup();
  process.exit(0);
});

// ============ Startup Sequence ============

async function main() {
  try {
    console.log("\n🚀 Initializing QIE Sentinel...\n");
    
    // Load configuration
    if (!await loadConfiguration()) {
      throw new Error('Configuration loading failed');
    }
    
    // Initialize systems
    await initializeDataAccess();
    await initializeRiskManager();
    await initializeStrategyResolver();
    
    // Load contract addresses
    await loadContractAddresses();
    
    // Initialize blockchain
    if (!await initializeBlockchain()) {
      throw new Error('Blockchain initialization failed');
    }
    
    // Initialize contracts
    if (!await initializeContracts()) {
      throw new Error('Contract initialization failed');
    }
    
    // 💰 AUTO-FUNDING: Check and setup vault/allowances if enabled
    if (config.trading.autoFunding && config.trading.autoFunding.enabled) {
      console.log("\n💰 Auto-funding enabled - Checking vault status...");
      
      try {
        const fundingManager = new FundingManager();
        await fundingManager.initialize();
        
        // Run funding setup (will skip if already funded)
        await fundingManager.run();
        
        console.log("✅ Auto-funding check complete\n");
      } catch (error) {
        console.error(`⚠️  Auto-funding failed: ${error.message}`);
        console.log(`   💡 You may need to run: node setup_funding.js`);
        console.log(`   💡 Or disable auto-funding in config.json\n`);
      }
    } else {
      console.log("\n💡 Auto-funding disabled - ensure vault is funded manually\n");
    }
    
    // Initialize Python engine
    await initializePythonEngine();
    
    // Initialize assets
    if (!await initializeAssets()) {
      throw new Error('Asset initialization failed');
    }
    
    // 🔍 VALIDATE ALL ASSETS BEFORE TRADING (Disabled for QIE Testnet)
    // if (!await validateAllAssets()) {
    //   throw new Error('Asset validation failed - insufficient funds or allowances');
    // }
    console.log("\n⚠️  Asset validation skipped - ensure vault is funded manually\n");
    
    console.log("\n✅ All systems initialized successfully!\n");
    
    // Start API server
    apiServer = new APIServer(dataAccess, riskManager, strategyResolver, performanceMetrics, config);
    apiServer.start(9000);
    
    // Start trading loop
    tradingLoop();
    
  } catch (error) {
    console.error(`\n❌ Startup failed: ${error.message}`);
    if (config && config.debug.enableVerboseLogging) {
      console.error(error.stack);
    }
    process.exit(1);
  }
}

// Start the application
main();
