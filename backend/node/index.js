require('dotenv').config({ path: '../../.env' });
const { ethers } = require('ethers');
const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log("🤖 QIE Sentinel Backend Starting...");
console.log("=" .repeat(70));

// ============ Configuration ============

const config = {
  rpcUrl: process.env.RPC_URL || 'http://localhost:8545',
  privateKey: process.env.PRIVATE_KEY || '',
  pollingInterval: parseInt(process.env.POLLING_INTERVAL) || 15000, // 15 seconds
  contractsPath: '../../contracts',
  autoTradingEnabled: process.env.AUTO_TRADING_ENABLED !== 'false', // Default true
  pythonPath: process.env.PYTHON_PATH || 'python', // Python executable
  signalEnginePath: path.join(__dirname, '../python/signal_engine.py'),
  logsPath: path.join(__dirname, 'logs')
};

// ============ State Variables ============

let provider;
let wallet;
let vaultContract;
let executorContract;
let pythonProcess = null;
let pythonReady = false;
let lastExecutedPrice = null;
let lastTradeType = null;
let tradeCount = 0;
let priceHistory = []; // Store recent prices for AI analysis
const MAX_PRICE_HISTORY = 50; // Keep last 50 prices

// Trading parameters
const TRADE_AMOUNT = ethers.parseEther("10"); // Amount to trade
const MIN_OUTPUT = ethers.parseEther("9"); // Minimum acceptable output (10% slippage)
const STRATEGY_ID = 1; // AI strategy identifier

// ============ Contract Loading ============

/**
 * Load contract ABIs from Hardhat artifacts
 */
function loadContractABI(contractName) {
  try {
    const artifactPath = path.join(
      __dirname,
      config.contractsPath,
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
  } catch (error) {
    console.error(`❌ Error loading ABI for ${contractName}:`, error.message);
    throw error;
  }
}

/**
 * Load deployed contract addresses
 */
function loadDeployedAddresses() {
  try {
    const addressesPath = path.join(
      __dirname,
      config.contractsPath,
      'deployed-addresses.json'
    );
    
    if (!fs.existsSync(addressesPath)) {
      throw new Error(`Deployed addresses file not found: ${addressesPath}`);
    }
    
    const addresses = JSON.parse(fs.readFileSync(addressesPath, 'utf8'));
    console.log("📍 Loaded contract addresses:");
    console.log(`   Vault:    ${addresses.vault}`);
    console.log(`   Executor: ${addresses.executor}`);
    console.log(`   Router:   ${addresses.router}`);
    console.log(`   Network:  ${addresses.network}`);
    
    return addresses;
  } catch (error) {
    console.error("❌ Error loading deployed addresses:", error.message);
    throw error;
  }
}

// ============ Blockchain Connection ============

/**
 * Initialize blockchain connection and contracts
 */
async function initializeBlockchain() {
  try {
    console.log("\n🔗 Connecting to blockchain...");
    console.log(`   RPC URL: ${config.rpcUrl}`);
    
    // Create provider
    provider = new ethers.JsonRpcProvider(config.rpcUrl);
    
    // Test connection
    const network = await provider.getNetwork();
    console.log(`✅ Connected to network: ${network.name} (chainId: ${network.chainId})`);
    
    // Initialize wallet if private key provided
    if (config.privateKey) {
      wallet = new ethers.Wallet(config.privateKey, provider);
      const balance = await provider.getBalance(wallet.address);
      console.log(`✅ Wallet connected: ${wallet.address}`);
      console.log(`   Balance: ${ethers.formatEther(balance)} ETH`);
    } else {
      console.log("⚠️  No private key provided - read-only mode");
      return false;
    }
    
    // Load deployed addresses
    const addresses = loadDeployedAddresses();
    
    // Load ABIs
    console.log("\n📦 Loading contract ABIs...");
    const vaultABI = loadContractABI('Vault');
    const executorABI = loadContractABI('Executor');
    console.log("✅ ABIs loaded successfully");
    
    // Initialize contract instances
    console.log("\n🔌 Initializing contract instances...");
    vaultContract = new ethers.Contract(addresses.vault, vaultABI, wallet);
    executorContract = new ethers.Contract(addresses.executor, executorABI, wallet);
    
    // Verify contracts are accessible
    const executorAddress = await executorContract.authorizedExecutor();
    console.log(`✅ Executor authorized wallet: ${executorAddress}`);
    
    if (executorAddress.toLowerCase() !== wallet.address.toLowerCase()) {
      console.log("⚠️  WARNING: Wallet address does not match authorized executor!");
      console.log(`   Expected: ${executorAddress}`);
      console.log(`   Actual:   ${wallet.address}`);
    }
    
    console.log("✅ Blockchain connection established");
    return true;
  } catch (error) {
    console.error("❌ Blockchain initialization failed:", error.message);
    return false;
  }
}

// ============ Price Oracle ============

/**
 * Get current price from oracle
 * TODO: Replace with real Chainlink price feed integration
 */
function getPrice() {
  // Simulate price fluctuation between 90 and 110
  const price = 90 + Math.random() * 20;
  return price;
}

/**
 * Fetch market prices for all trading pairs
 * TODO: Integrate with real price feeds (Chainlink, Binance, etc.)
 */
async function fetchMarketPrices() {
  try {
    // Placeholder: Random price between 90 and 110
    const ethPrice = getPrice();
    
    // Add to price history for AI analysis
    priceHistory.push(ethPrice);
    
    // Keep only last MAX_PRICE_HISTORY prices
    if (priceHistory.length > MAX_PRICE_HISTORY) {
      priceHistory.shift();
    }
    
    return {
      ETH: ethPrice,
      USDT: 100, // Base price
      timestamp: Date.now()
    };
  } catch (error) {
    console.error("❌ Error fetching prices:", error.message);
    throw error;
  }
}

// ============ Trading Logic ============

/**
 * Get AI trading signal based on price history
 */
async function getTradeSignal(currentPrice) {
  try {
    // Need at least 2 prices for AI analysis
    if (priceHistory.length < 2) {
      return { signal: 'HOLD', reason: 'Insufficient price history' };
    }
    
    // Get AI signal from Python engine
    const aiSignal = await getAISignal(priceHistory);
    
    // Prevent duplicate trades
    if (aiSignal === 'BUY' && lastTradeType === 'BUY' && lastExecutedPrice && 
        Math.abs(currentPrice - lastExecutedPrice) < 2) {
      return { signal: 'HOLD', reason: 'Duplicate BUY prevented' };
    }
    
    if (aiSignal === 'SELL' && lastTradeType === 'SELL' && lastExecutedPrice && 
        Math.abs(currentPrice - lastExecutedPrice) < 2) {
      return { signal: 'HOLD', reason: 'Duplicate SELL prevented' };
    }
    
    return { 
      signal: aiSignal, 
      reason: aiSignal !== 'HOLD' ? `AI Signal: ${aiSignal}` : 'AI recommends holding'
    };
    
  } catch (error) {
    console.error(`❌ Error getting AI signal: ${error.message}`);
    return { signal: 'HOLD', reason: `AI error: ${error.message}` };
  }
}

/**
 * Append trade log to persistent JSON log file
 */
function appendTradeLog(logData) {
  try {
    const logFile = path.join(config.logsPath, 'trades.json');
    
    // Ensure logs directory exists
    if (!fs.existsSync(config.logsPath)) {
      fs.mkdirSync(config.logsPath, { recursive: true });
    }
    
    // Read existing logs or initialize empty array
    let logs = [];
    if (fs.existsSync(logFile)) {
      const fileContent = fs.readFileSync(logFile, 'utf8');
      if (fileContent.trim()) {
        logs = JSON.parse(fileContent);
      }
    }
    
    // Append new log entry
    logs.push(logData);
    
    // Write back to file
    fs.writeFileSync(logFile, JSON.stringify(logs, null, 2), 'utf8');
    
    console.log(`📝 Trade logged to ${logFile}`);
  } catch (error) {
    console.error(`❌ Error appending trade log: ${error.message}`);
  }
}

/**
 * Execute trade on-chain via Executor contract
 */
async function executeTrade(tradeType, price) {
  try {
    console.log(`\n⚡ Executing ${tradeType} trade...`);
    console.log(`   Price trigger: ${price.toFixed(2)}`);
    
    // TODO: Replace with real token addresses from deployment
    // For testing, using placeholder addresses
    const tokenA = "0x0000000000000000000000000000000000000001"; // Placeholder
    const tokenB = "0x0000000000000000000000000000000000000002"; // Placeholder
    const userAddress = wallet.address;
    
    // Determine swap direction based on trade type
    const tokenIn = tradeType === 'BUY' ? tokenB : tokenA;
    const tokenOut = tradeType === 'BUY' ? tokenA : tokenB;
    
    // Build swap path
    const path = [tokenIn, tokenOut];
    
    console.log(`   User:      ${userAddress}`);
    console.log(`   Token In:  ${tokenIn}`);
    console.log(`   Token Out: ${tokenOut}`);
    console.log(`   Amount In: ${ethers.formatEther(TRADE_AMOUNT)} tokens`);
    console.log(`   Min Out:   ${ethers.formatEther(MIN_OUTPUT)} tokens`);
    console.log(`   Strategy:  ${STRATEGY_ID}`);
    
    // Call Executor.executeTrade()
    const tx = await executorContract.executeTrade(
      userAddress,
      tokenIn,
      tokenOut,
      TRADE_AMOUNT,
      MIN_OUTPUT,
      path,
      STRATEGY_ID
    );
    
    console.log(`   TX Hash: ${tx.hash}`);
    console.log("   ⏳ Waiting for confirmation...");
    
    const receipt = await tx.wait();
    
    console.log(`✅ Trade executed successfully!`);
    console.log(`   Block: ${receipt.blockNumber}`);
    console.log(`   Gas Used: ${receipt.gasUsed.toString()}`);
    
    // Calculate slippage used (difference between expected and min output)
    const expectedOutput = ethers.formatEther(TRADE_AMOUNT);
    const minOutput = ethers.formatEther(MIN_OUTPUT);
    const slippageUsed = ((parseFloat(expectedOutput) - parseFloat(minOutput)) / parseFloat(expectedOutput) * 100).toFixed(2);
    
    // Log trade to persistent storage
    const tradeLog = {
      timestamp: new Date().toISOString(),
      signalType: tradeType,
      tokenIn: tokenIn,
      tokenOut: tokenOut,
      amount: ethers.formatEther(TRADE_AMOUNT),
      txHash: tx.hash,
      gasUsed: receipt.gasUsed.toString(),
      slippageUsed: `${slippageUsed}%`,
      blockNumber: receipt.blockNumber,
      price: price.toFixed(2)
    };
    
    appendTradeLog(tradeLog);
    
    // Update state
    lastExecutedPrice = price;
    lastTradeType = tradeType;
    tradeCount++;
    
    return {
      success: true,
      txHash: tx.hash,
      blockNumber: receipt.blockNumber,
      gasUsed: receipt.gasUsed.toString()
    };
    
  } catch (error) {
    console.error(`❌ Trade execution failed:`, error.message);
    
    // Log detailed error for debugging
    if (error.data) {
      console.error(`   Error data:`, error.data);
    }
    if (error.reason) {
      console.error(`   Reason:`, error.reason);
    }
    
    return {
      success: false,
      error: error.message
    };
  }
}

// ============ Main Trading Loop ============

/**
 * Main autonomous trading loop
 */
async function tradingLoop() {
  console.log("\n🔄 Starting autonomous trading loop...");
  console.log(`   Polling interval: ${config.pollingInterval / 1000}s`);
  console.log(`   Auto-trading: ${config.autoTradingEnabled ? 'ENABLED' : 'DISABLED'}`);
  console.log(`   AI Engine: ${pythonReady ? '🧠 ACTIVE' : '⚠️  INACTIVE'}`);
  console.log("=" .repeat(70));
  
  let loopCount = 0;
  
  setInterval(async () => {
    loopCount++;
    
    try {
      console.log(`\n[Loop ${loopCount}] ${new Date().toLocaleTimeString()}`);
      console.log("-".repeat(70));
      
      // Step 1: Fetch current market prices
      const prices = await fetchMarketPrices();
      const currentPrice = prices.ETH;
      
      console.log(`📊 Current Price: ${currentPrice.toFixed(2)}`);
      console.log(`   Price History: ${priceHistory.length} samples`);
      console.log(`   Last Trade: ${lastTradeType || 'None'} @ ${lastExecutedPrice?.toFixed(2) || 'N/A'}`);
      console.log(`   Total Trades: ${tradeCount}`);
      
      // Step 2: Get AI trading signal
      const decision = await getTradeSignal(currentPrice);
      
      console.log(`🤖 AI Signal: ${decision.signal}`);
      console.log(`   Reason: ${decision.reason}`);
      
      // Step 3: Execute trade if signal is BUY or SELL
      if (decision.signal !== 'HOLD') {
        if (config.autoTradingEnabled) {
          console.log(`🎯 Executing ${decision.signal} trade...`);
          
          const result = await executeTrade(decision.signal, currentPrice);
          
          if (result.success) {
            console.log(`\n✨ Trade ${tradeCount} completed successfully!`);
          } else {
            console.log(`\n⚠️  Trade failed but continuing...`);
          }
        } else {
          console.log("⏸️  Auto-trading disabled - trade signal ignored");
        }
      } else {
        console.log(`💤 Holding - no trade executed`);
      }
      
    } catch (error) {
      console.error(`\n❌ Error in trading loop:`, error.message);
      console.log("🔄 Continuing to next iteration...");
    }
    
  }, config.pollingInterval);
  
  console.log("\n✅ Trading loop started!");
}

// ============ Graceful Shutdown ============

/**
 * Handle graceful shutdown
 */
function setupShutdownHandlers() {
  const shutdown = () => {
    console.log("\n\n🛑 Shutting down gracefully...");
    
    // Kill Python process
    if (pythonProcess) {
      console.log("🐍 Stopping Python AI engine...");
      pythonProcess.kill();
    }
    
    console.log(`📊 Final Statistics:`);
    console.log(`   Total Trades Executed: ${tradeCount}`);
    console.log(`   Last Trade Type: ${lastTradeType || 'None'}`);
    console.log(`   Last Price: ${lastExecutedPrice?.toFixed(2) || 'N/A'}`);
    console.log(`   Price History Size: ${priceHistory.length}`);
    console.log("\n👋 Goodbye!");
    process.exit(0);
  };
  
  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
}

// ============ Main Entry Point ============

/**
 * Main application entry point
 */
async function main() {
  console.log("\n🎯 Initializing QIE Sentinel Autonomous Trading Engine...");
  console.log("=" .repeat(70));
  
  // Check configuration
  if (!config.privateKey) {
    console.error("\n❌ ERROR: PRIVATE_KEY not found in .env file");
    console.log("   Please set PRIVATE_KEY in your .env file to enable trading");
    console.log("   Example: PRIVATE_KEY=0x1234...");
    return;
  }
  
  // Initialize Python AI engine first
  try {
    await initializePythonEngine();
  } catch (error) {
    console.error("\n❌ Failed to initialize Python AI engine:", error.message);
    console.log("   Continuing without AI signals - will use fallback logic");
  }
  
  // Initialize blockchain connection
  const connected = await initializeBlockchain();
  
  if (!connected) {
    console.error("\n❌ Failed to initialize blockchain connection");
    console.log("   Please check your configuration and try again");
    return;
  }
  
  // Setup shutdown handlers
  setupShutdownHandlers();
  
  console.log("\n" + "=".repeat(70));
  console.log("🚀 QIE Sentinel Backend Ready!");
  console.log("=".repeat(70));
  console.log("📡 Monitoring market conditions...");
  console.log("🤖 AI-powered autonomous trading active");
  console.log("🧠 Python AI engine integrated");
  console.log("\nPress Ctrl+C to stop\n");
  
  // Start trading loop
  await tradingLoop();
}

// Start the application
main().catch((error) => {
  console.error("\n❌ Fatal error:", error);
  
  // Clean up Python process on fatal error
  if (pythonProcess) {
    pythonProcess.kill();
  }
  
  process.exit(1);
});
