/**
 * QIE Sentinel - Environment & Contract Validation
 * 
 * Validates that all required components are properly configured:
 * - Network connectivity
 * - Contract addresses
 * - Token configurations
 * - Wallet setup
 */

require('dotenv').config({ path: '../../.env' });
const { ethers } = require('ethers');
const fs = require('fs');
const path = require('path');

const vaultABI = require('./abi/Vault.json').abi;
const executorABI = require('./abi/Executor.json').abi;

async function validateEnvironment() {
  console.log("🔍 QIE Sentinel - Environment Validation\n");
  console.log("=" .repeat(60));
  
  const results = {
    passed: [],
    failed: [],
    warnings: []
  };

  // 1. Check environment variables
  console.log("\n1️⃣  Checking Environment Variables...");
  const requiredEnvVars = [
    'RPC_URL',
    'PRIVATE_KEY',
    'VAULT_ADDRESS',
    'EXECUTOR_ADDRESS',
    'ROUTER_ADDRESS'
  ];

  for (const envVar of requiredEnvVars) {
    if (process.env[envVar]) {
      console.log(`   ✅ ${envVar}: ${process.env[envVar].substring(0, 20)}...`);
      results.passed.push(`ENV: ${envVar}`);
    } else {
      console.log(`   ❌ ${envVar}: Missing`);
      results.failed.push(`ENV: ${envVar} is missing`);
    }
  }

  // 2. Check network connectivity
  console.log("\n2️⃣  Checking Network Connectivity...");
  try {
    const provider = new ethers.JsonRpcProvider(process.env.RPC_URL);
    const network = await provider.getNetwork();
    console.log(`   ✅ Connected to network: ${network.name} (Chain ID: ${network.chainId})`);
    results.passed.push(`Network: ${network.name}`);

    const blockNumber = await provider.getBlockNumber();
    console.log(`   ✅ Current block: ${blockNumber}`);

    // Check expected chain ID
    if (network.chainId !== 11155111n && network.chainId !== 31337n) {
      results.warnings.push(`Chain ID ${network.chainId} - Expected Sepolia (11155111) or Localhost (31337)`);
    }
  } catch (error) {
    console.log(`   ❌ Network connection failed: ${error.message}`);
    results.failed.push(`Network: Connection failed`);
    return printResults(results);
  }

  // 3. Check wallet
  console.log("\n3️⃣  Checking Wallet...");
  try {
    const provider = new ethers.JsonRpcProvider(process.env.RPC_URL);
    const wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);
    console.log(`   ✅ Wallet address: ${wallet.address}`);
    
    const balance = await provider.getBalance(wallet.address);
    const ethBalance = ethers.formatEther(balance);
    console.log(`   💰 ETH balance: ${ethBalance} ETH`);
    
    if (parseFloat(ethBalance) < 0.01) {
      results.warnings.push(`Low ETH balance: ${ethBalance} ETH (need at least 0.01 for gas)`);
    } else {
      results.passed.push(`Wallet: ${ethBalance} ETH`);
    }
  } catch (error) {
    console.log(`   ❌ Wallet setup failed: ${error.message}`);
    results.failed.push(`Wallet: Setup failed`);
  }

  // 4. Check Vault contract
  console.log("\n4️⃣  Checking Vault Contract...");
  try {
    const provider = new ethers.JsonRpcProvider(process.env.RPC_URL);
    const wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);
    const vaultContract = new ethers.Contract(
      process.env.VAULT_ADDRESS,
      vaultABI,
      wallet
    );

    const code = await provider.getCode(process.env.VAULT_ADDRESS);
    if (code === '0x') {
      console.log(`   ❌ No contract at Vault address`);
      results.failed.push(`Vault: No contract deployed`);
    } else {
      console.log(`   ✅ Vault contract found`);
      console.log(`   📍 Address: ${process.env.VAULT_ADDRESS}`);
      results.passed.push(`Vault: Contract deployed`);

      // Try to read vault state
      try {
        const balance = await vaultContract.getBalance(wallet.address, ethers.ZeroAddress);
        console.log(`   ✅ Vault is responsive`);
      } catch (error) {
        results.warnings.push(`Vault: ${error.message}`);
      }
    }
  } catch (error) {
    console.log(`   ❌ Vault validation failed: ${error.message}`);
    results.failed.push(`Vault: ${error.message}`);
  }

  // 5. Check Executor contract
  console.log("\n5️⃣  Checking Executor Contract...");
  try {
    const provider = new ethers.JsonRpcProvider(process.env.RPC_URL);
    const code = await provider.getCode(process.env.EXECUTOR_ADDRESS);
    if (code === '0x') {
      console.log(`   ❌ No contract at Executor address`);
      results.failed.push(`Executor: No contract deployed`);
    } else {
      console.log(`   ✅ Executor contract found`);
      console.log(`   📍 Address: ${process.env.EXECUTOR_ADDRESS}`);
      results.passed.push(`Executor: Contract deployed`);
    }
  } catch (error) {
    console.log(`   ❌ Executor validation failed: ${error.message}`);
    results.failed.push(`Executor: ${error.message}`);
  }

  // 6. Check Router contract
  console.log("\n6️⃣  Checking Router Contract...");
  try {
    const provider = new ethers.JsonRpcProvider(process.env.RPC_URL);
    const code = await provider.getCode(process.env.ROUTER_ADDRESS);
    if (code === '0x') {
      console.log(`   ❌ No contract at Router address`);
      results.failed.push(`Router: No contract deployed`);
    } else {
      console.log(`   ✅ Router contract found`);
      console.log(`   📍 Address: ${process.env.ROUTER_ADDRESS}`);
      results.passed.push(`Router: Contract deployed`);
    }
  } catch (error) {
    console.log(`   ❌ Router validation failed: ${error.message}`);
    results.failed.push(`Router: ${error.message}`);
  }

  // 7. Check token configuration
  console.log("\n7️⃣  Checking Token Configuration...");
  const tokenConfigPath = path.join(__dirname, 'config/tokens.json');
  if (fs.existsSync(tokenConfigPath)) {
    const tokenConfig = JSON.parse(fs.readFileSync(tokenConfigPath, 'utf8'));
    console.log(`   ✅ Token configuration found`);
    console.log(`   📋 Tokens configured: ${Object.keys(tokenConfig.tokens).join(', ')}`);
    results.passed.push(`Tokens: ${Object.keys(tokenConfig.tokens).length} configured`);
    
    // Verify each token contract
    for (const [symbol, info] of Object.entries(tokenConfig.tokens)) {
      try {
        const provider = new ethers.JsonRpcProvider(process.env.RPC_URL);
        const code = await provider.getCode(info.address);
        if (code === '0x') {
          console.log(`   ⚠️  ${symbol}: No contract at ${info.address}`);
          results.warnings.push(`Token ${symbol}: No contract deployed`);
        } else {
          console.log(`   ✅ ${symbol}: ${info.address.substring(0, 10)}... (${info.decimals} decimals)`);
        }
      } catch (error) {
        results.warnings.push(`Token ${symbol}: ${error.message}`);
      }
    }
  } else {
    console.log(`   ⚠️  No token configuration found`);
    console.log(`   💡 Run: npx hardhat run scripts/deploy_tokens.js --network sepolia`);
    results.warnings.push(`Tokens: Configuration not found - run deploy_tokens.js`);
  }

  // 8. Check configuration file
  console.log("\n8️⃣  Checking Configuration Files...");
  const configFiles = [
    'config/default.json',
    'abi/Vault.json',
    'abi/Executor.json'
  ];

  for (const file of configFiles) {
    const filePath = path.join(__dirname, file);
    if (fs.existsSync(filePath)) {
      console.log(`   ✅ ${file}`);
      results.passed.push(`Config: ${file}`);
    } else {
      console.log(`   ❌ ${file} missing`);
      results.failed.push(`Config: ${file} missing`);
    }
  }

  printResults(results);
}

function printResults(results) {
  console.log("\n" + "=".repeat(60));
  console.log(" VALIDATION SUMMARY");
  console.log("=".repeat(60));
  
  console.log(`\n✅ Passed: ${results.passed.length}`);
  if (results.passed.length > 0) {
    results.passed.forEach(item => console.log(`   - ${item}`));
  }

  if (results.warnings.length > 0) {
    console.log(`\n⚠️  Warnings: ${results.warnings.length}`);
    results.warnings.forEach(item => console.log(`   - ${item}`));
  }

  if (results.failed.length > 0) {
    console.log(`\n❌ Failed: ${results.failed.length}`);
    results.failed.forEach(item => console.log(`   - ${item}`));
  }

  console.log("\n" + "=".repeat(60));
  
  if (results.failed.length === 0) {
    console.log("✅ Environment validation PASSED!");
    console.log("\n💡 Next steps:");
    console.log("   1. Deploy tokens: npx hardhat run scripts/deploy_tokens.js --network sepolia");
    console.log("   2. Fund vault: node backend/node/setup_funding.js");
    console.log("   3. Start trading: node backend/node/index_v2.js\n");
    process.exit(0);
  } else {
    console.log("❌ Environment validation FAILED!");
    console.log("\n💡 Fix the issues above before proceeding.\n");
    process.exit(1);
  }
}

validateEnvironment();
