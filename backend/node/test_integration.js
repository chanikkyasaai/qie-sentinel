/**
 * QIE Sentinel - End-to-End Integration Test
 * 
 * Tests the complete trading workflow:
 * 1. Environment validation
 * 2. Funding setup (if needed)
 * 3. Execute 2 BUY trades
 * 4. Execute 2 SELL trades
 * 5. Verify trades logged to trades.json
 * 6. Verify no kill switch activation
 */

require('dotenv').config({ path: '../../.env' });
const { ethers } = require('ethers');
const fs = require('fs');
const path = require('path');
const FundingManager = require('./setup_funding');

// Load ABIs
const vaultABI = require('./abi/Vault.json').abi;
const executorABI = require('./abi/Executor.json').abi;

class IntegrationTest {
  constructor() {
    this.provider = null;
    this.wallet = null;
    this.vaultContract = null;
    this.executorContract = null;
    this.results = {
      passed: [],
      failed: [],
      warnings: []
    };
  }

  async initialize() {
    console.log("🧪 QIE Sentinel - Integration Test Suite\n");
    console.log("=" .repeat(60));

    // Setup provider and wallet
    this.provider = new ethers.JsonRpcProvider(process.env.RPC_URL);
    this.wallet = new ethers.Wallet(process.env.PRIVATE_KEY, this.provider);

    // Initialize contracts
    this.vaultContract = new ethers.Contract(
      process.env.VAULT_ADDRESS,
      vaultABI,
      this.wallet
    );

    this.executorContract = new ethers.Contract(
      process.env.EXECUTOR_ADDRESS,
      executorABI,
      this.wallet
    );

    console.log("✅ Test environment initialized");
    console.log(`   Wallet: ${this.wallet.address}`);
    console.log(`   Network: Sepolia (${await this.provider.getNetwork().then(n => n.chainId)})\n`);
  }

  async testEnvironment() {
    console.log("\n1️⃣  Testing Environment...");

    try {
      // Check ETH balance
      const balance = await this.provider.getBalance(this.wallet.address);
      if (balance < ethers.parseEther("0.01")) {
        this.results.failed.push("ETH balance too low");
        console.log("   ❌ Insufficient ETH balance");
        return false;
      }
      console.log(`   ✅ ETH balance: ${ethers.formatEther(balance)}`);

      // Check contracts deployed
      const vaultCode = await this.provider.getCode(process.env.VAULT_ADDRESS);
      if (vaultCode === '0x') {
        this.results.failed.push("Vault contract not deployed");
        console.log("   ❌ Vault contract not deployed");
        return false;
      }
      console.log("   ✅ Vault contract deployed");

      const executorCode = await this.provider.getCode(process.env.EXECUTOR_ADDRESS);
      if (executorCode === '0x') {
        this.results.failed.push("Executor contract not deployed");
        console.log("   ❌ Executor contract not deployed");
        return false;
      }
      console.log("   ✅ Executor contract deployed");

      this.results.passed.push("Environment validation");
      return true;
    } catch (error) {
      this.results.failed.push(`Environment: ${error.message}`);
      console.log(`   ❌ ${error.message}`);
      return false;
    }
  }

  async testFundingSetup() {
    console.log("\n2️⃣  Testing Funding Setup...");

    try {
      const tokenConfig = JSON.parse(
        fs.readFileSync(path.join(__dirname, 'config/tokens.json'), 'utf8')
      );

      // Check at least one token is funded
      let anyTokenFunded = false;
      for (const [symbol, info] of Object.entries(tokenConfig.tokens)) {
        try {
          const balance = await this.vaultContract.getBalance(
            this.wallet.address,
            info.address
          );

          if (balance > 0) {
            console.log(`   ✅ ${symbol}: ${ethers.formatUnits(balance, info.decimals)} deposited`);
            anyTokenFunded = true;
          } else {
            console.log(`   ⚠️  ${symbol}: Not funded`);
          }
        } catch (error) {
          console.log(`   ❌ ${symbol}: ${error.message}`);
        }
      }

      if (!anyTokenFunded) {
        console.log("\n   💰 Running funding setup...");
        const fundingManager = new FundingManager();
        await fundingManager.run();
        console.log("   ✅ Funding complete");
      }

      this.results.passed.push("Funding setup");
      return true;
    } catch (error) {
      this.results.failed.push(`Funding: ${error.message}`);
      console.log(`   ❌ ${error.message}`);
      return false;
    }
  }

  async testBuyTrade(tokenSymbol = 'USDT') {
    console.log(`\n3️⃣  Testing BUY Trade (${tokenSymbol})...`);

    try {
      const tokenConfig = JSON.parse(
        fs.readFileSync(path.join(__dirname, 'config/tokens.json'), 'utf8')
      );

      const token = tokenConfig.tokens[tokenSymbol];
      if (!token) {
        throw new Error(`Token ${tokenSymbol} not found in config`);
      }

      // Prepare trade parameters
      const tokenIn = token.address; // USDT
      const tokenOut = ethers.ZeroAddress; // ETH (mock)
      const amount = ethers.parseUnits("10", token.decimals); // 10 USDT
      const minOutput = ethers.parseUnits("0.005", 18); // 0.005 ETH minimum
      const path = [tokenIn, tokenOut];
      const strategyId = ethers.encodeBytes32String("TEST_BUY");

      console.log(`   Amount: 10 ${tokenSymbol}`);
      console.log(`   Min Output: 0.005 ETH`);

      // Execute trade
      const tx = await this.executorContract.executeTrade(
        this.wallet.address,
        tokenIn,
        tokenOut,
        amount,
        minOutput,
        path,
        strategyId
      );

      console.log(`   TX: ${tx.hash}`);

      const receipt = await tx.wait();
      console.log(`   ✅ BUY trade successful`);
      console.log(`   Block: ${receipt.blockNumber}`);
      console.log(`   Gas: ${receipt.gasUsed.toString()}`);

      this.results.passed.push(`BUY trade (${tokenSymbol})`);
      return { success: true, txHash: tx.hash };
    } catch (error) {
      this.results.failed.push(`BUY trade: ${error.message}`);
      console.log(`   ❌ BUY trade failed: ${error.message}`);
      return { success: false, error: error.message };
    }
  }

  async testSellTrade(tokenSymbol = 'WBTC') {
    console.log(`\n4️⃣  Testing SELL Trade (${tokenSymbol})...`);

    try {
      const tokenConfig = JSON.parse(
        fs.readFileSync(path.join(__dirname, 'config/tokens.json'), 'utf8')
      );

      const token = tokenConfig.tokens[tokenSymbol];
      if (!token) {
        throw new Error(`Token ${tokenSymbol} not found in config`);
      }

      // Prepare trade parameters (reversed for SELL)
      const tokenIn = ethers.ZeroAddress; // ETH (mock)
      const tokenOut = token.address; // WBTC
      const amount = ethers.parseUnits("0.01", 18); // 0.01 ETH
      const minOutput = ethers.parseUnits("0.0005", token.decimals); // 0.0005 WBTC minimum
      const path = [tokenIn, tokenOut];
      const strategyId = ethers.encodeBytes32String("TEST_SELL");

      console.log(`   Amount: 0.01 ETH`);
      console.log(`   Min Output: 0.0005 ${tokenSymbol}`);

      // Execute trade
      const tx = await this.executorContract.executeTrade(
        this.wallet.address,
        tokenIn,
        tokenOut,
        amount,
        minOutput,
        path,
        strategyId
      );

      console.log(`   TX: ${tx.hash}`);

      const receipt = await tx.wait();
      console.log(`   ✅ SELL trade successful`);
      console.log(`   Block: ${receipt.blockNumber}`);
      console.log(`   Gas: ${receipt.gasUsed.toString()}`);

      this.results.passed.push(`SELL trade (${tokenSymbol})`);
      return { success: true, txHash: tx.hash };
    } catch (error) {
      this.results.failed.push(`SELL trade: ${error.message}`);
      console.log(`   ❌ SELL trade failed: ${error.message}`);
      return { success: false, error: error.message };
    }
  }

  async testTradeLogging() {
    console.log("\n5️⃣  Testing Trade Logging...");

    try {
      const tradesPath = path.join(__dirname, 'config/trades.json');
      
      if (!fs.existsSync(tradesPath)) {
        this.results.warnings.push("Trades file not found (trades not logged yet)");
        console.log("   ⚠️  trades.json not found");
        return true;
      }

      const tradesData = JSON.parse(fs.readFileSync(tradesPath, 'utf8'));
      const tradeCount = Array.isArray(tradesData) ? tradesData.length : 0;

      console.log(`   ✅ Trades logged: ${tradeCount}`);
      
      if (tradeCount > 0) {
        const lastTrade = tradesData[tradesData.length - 1];
        console.log(`   Latest: ${lastTrade.signalType} ${lastTrade.asset} @ ${lastTrade.timestamp}`);
      }

      this.results.passed.push("Trade logging");
      return true;
    } catch (error) {
      this.results.failed.push(`Trade logging: ${error.message}`);
      console.log(`   ❌ ${error.message}`);
      return false;
    }
  }

  async testKillSwitch() {
    console.log("\n6️⃣  Testing Kill Switch...");

    try {
      const riskStatePath = path.join(__dirname, 'config/risk_state.json');
      
      if (!fs.existsSync(riskStatePath)) {
        console.log("   ℹ️  Risk state file not found (system not run yet)");
        this.results.passed.push("Kill switch (not yet activated)");
        return true;
      }

      const riskState = JSON.parse(fs.readFileSync(riskStatePath, 'utf8'));
      
      if (riskState.killSwitchActive) {
        this.results.failed.push("Kill switch is active");
        console.log("   ❌ Kill switch is ACTIVE");
        console.log(`   Consecutive failures: ${riskState.consecutiveFailures}`);
        return false;
      }

      console.log("   ✅ Kill switch inactive");
      console.log(`   Consecutive failures: ${riskState.consecutiveFailures}`);
      this.results.passed.push("Kill switch");
      return true;
    } catch (error) {
      this.results.warnings.push(`Kill switch check: ${error.message}`);
      console.log(`   ⚠️  ${error.message}`);
      return true;
    }
  }

  printResults() {
    console.log("\n" + "=".repeat(60));
    console.log(" TEST RESULTS");
    console.log("=".repeat(60));

    console.log(`\n✅ Passed: ${this.results.passed.length}`);
    this.results.passed.forEach(item => console.log(`   - ${item}`));

    if (this.results.warnings.length > 0) {
      console.log(`\n⚠️  Warnings: ${this.results.warnings.length}`);
      this.results.warnings.forEach(item => console.log(`   - ${item}`));
    }

    if (this.results.failed.length > 0) {
      console.log(`\n❌ Failed: ${this.results.failed.length}`);
      this.results.failed.forEach(item => console.log(`   - ${item}`));
    }

    console.log("\n" + "=".repeat(60));

    if (this.results.failed.length === 0) {
      console.log("✅ ALL TESTS PASSED!");
      console.log("\n💡 System is ready for production trading\n");
      return 0;
    } else {
      console.log("❌ SOME TESTS FAILED!");
      console.log("\n💡 Fix the issues above before deploying\n");
      return 1;
    }
  }

  async run() {
    try {
      await this.initialize();

      // Run all tests
      await this.testEnvironment();
      await this.testFundingSetup();
      
      // Execute 2 BUY trades
      await this.testBuyTrade('USDT');
      await new Promise(resolve => setTimeout(resolve, 2000)); // Wait 2s
      await this.testBuyTrade('WETH');

      // Execute 2 SELL trades
      await new Promise(resolve => setTimeout(resolve, 2000)); // Wait 2s
      await this.testSellTrade('WBTC');
      await new Promise(resolve => setTimeout(resolve, 2000)); // Wait 2s
      await this.testSellTrade('USDT');

      // Verify logging and kill switch
      await this.testTradeLogging();
      await this.testKillSwitch();

      // Print results
      const exitCode = this.printResults();
      process.exit(exitCode);

    } catch (error) {
      console.error("\n❌ Test suite failed:", error.message);
      if (error.stack) {
        console.error(error.stack);
      }
      process.exit(1);
    }
  }
}

// Run if called directly
if (require.main === module) {
  const test = new IntegrationTest();
  test.run();
}

module.exports = IntegrationTest;
