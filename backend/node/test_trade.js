/**
 * Test a single trade execution to debug contract issues
 */

require('dotenv').config({ path: '../../.env' });
const { ethers } = require('ethers');
const fs = require('fs');

async function main() {
  console.log("🧪 Testing Trade Execution...\n");
  
  // Load config
  const config = JSON.parse(fs.readFileSync('./config/config.json', 'utf8'));
  const tokens = JSON.parse(fs.readFileSync('./config/tokens.json', 'utf8'));
  
  // Setup provider and wallet
  const provider = new ethers.JsonRpcProvider(config.network.rpcUrl);
  const privateKey = process.env.PRIVATE_KEY || config.wallet?.privateKey;
  const wallet = new ethers.Wallet(privateKey, provider);
  
  console.log("📋 Wallet:", wallet.address);
  console.log("💰 Balance:", ethers.formatEther(await provider.getBalance(wallet.address)), "ETH\n");
  
  // Load contracts
  const vaultABI = require('./abi/Vault.json').abi;
  const executorABI = require('./abi/Executor.json').abi;
  
  const vaultContract = new ethers.Contract(config.contracts.vaultAddress, vaultABI, wallet);
  const executorContract = new ethers.Contract(config.contracts.executorAddress, executorABI, wallet);
  
  console.log("✅ Vault:", config.contracts.vaultAddress);
  console.log("✅ Executor:", config.contracts.executorAddress);
  console.log("✅ Router:", config.contracts.routerAddress, "\n");
  
  // Use USDT/WBTC pair
  const pair = tokens.tokens[0]; // USDT/WBTC
  console.log("📊 Testing:", pair.tradingPair);
  console.log("   TokenIn:", pair.tokenIn, "(USDT)");
  console.log("   TokenOut:", pair.tokenOut, "(WBTC)");
  console.log("   Amount:", pair.tradeAmount, "USDT");
  console.log();
  
  // Check balances
  console.log("🔍 Checking vault status...");
  const balance = await vaultContract.getBalance(wallet.address, pair.tokenIn);
  console.log("   Vault balance:", ethers.formatUnits(balance, pair.decimals), "USDT");
  
  const allowance = await vaultContract.getAllowance(wallet.address, pair.tokenIn);
  console.log("   Executor allowance:", ethers.formatUnits(allowance, pair.decimals), "USDT");
  console.log();
  
  // Prepare trade params
  const tradeAmount = ethers.parseUnits(pair.tradeAmount, pair.decimals);
  const minOutput = ethers.parseUnits(pair.minOutput, pair.decimals);
  const path = [pair.tokenIn, pair.tokenOut];
  
  console.log("⚡ Executing test trade...");
  console.log("   Amount:", ethers.formatUnits(tradeAmount, pair.decimals));
  console.log("   Min output:", ethers.formatUnits(minOutput, pair.decimals));
  console.log();
  
  try {
    // Estimate gas first
    console.log("📊 Estimating gas...");
    const gasEstimate = await executorContract.executeTrade.estimateGas(
      wallet.address,
      pair.tokenIn,
      pair.tokenOut,
      tradeAmount,
      minOutput,
      path,
      1 // strategy ID
    );
    console.log("   Gas estimate:", gasEstimate.toString());
    console.log();
    
    // Execute trade
    console.log("🚀 Sending transaction...");
    const tx = await executorContract.executeTrade(
      wallet.address,
      pair.tokenIn,
      pair.tokenOut,
      tradeAmount,
      minOutput,
      path,
      1
    );
    
    console.log("   TX hash:", tx.hash);
    console.log("   ⏳ Waiting for confirmation...");
    
    const receipt = await tx.wait();
    
    console.log("\n✅ TRADE SUCCESSFUL!");
    console.log("   Block:", receipt.blockNumber);
    console.log("   Gas used:", receipt.gasUsed.toString());
    console.log("   Status:", receipt.status === 1 ? "Success" : "Failed");
    
  } catch (error) {
    console.log("\n❌ TRADE FAILED!");
    console.log("   Error:", error.message);
    
    if (error.data) {
      console.log("   Error data:", error.data);
    }
    
    if (error.reason) {
      console.log("   Reason:", error.reason);
    }
    
    if (error.code) {
      console.log("   Code:", error.code);
    }
    
    // Try to decode error
    try {
      const iface = new ethers.Interface(executorABI);
      const decodedError = iface.parseError(error.data);
      console.log("   Decoded error:", decodedError);
    } catch (e) {
      console.log("   Could not decode error");
    }
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
