/**
 * QIE Sentinel - Automatic Funding & Allowance Setup
 * 
 * This script:
 * 1. Mints test tokens to the trading wallet
 * 2. Deposits tokens into the Vault contract
 * 3. Approves Executor to spend from Vault
 * 
 * Run this BEFORE starting the trading loop
 */

require('dotenv').config({ path: '../../.env' });
const { ethers } = require('ethers');
const fs = require('fs');
const path = require('path');

// Load config
const config = JSON.parse(fs.readFileSync(path.join(__dirname, 'config/config.json'), 'utf8'));

// Load configurations
const defaultConfig = require('./config/config.json');
const vaultArtifact = require('./abi/Vault.json');
const vaultABI = vaultArtifact.abi;
const erc20ABI = [
  "function mint(address to, uint256 amount) public",
  "function faucet() public",
  "function balanceOf(address owner) view returns (uint256)",
  "function decimals() view returns (uint8)",
  "function approve(address spender, uint256 amount) returns (bool)",
  "function allowance(address owner, address spender) view returns (uint256)"
];

class FundingManager {
  constructor() {
    this.provider = null;
    this.wallet = null;
    this.vaultContract = null;
    this.tokens = {};
    this.config = defaultConfig;
  }

  async initialize() {
    console.log("🚀 Initializing Funding Manager...\n");

    // Setup provider and wallet
    this.provider = new ethers.JsonRpcProvider(config.network.rpcUrl);
    this.wallet = new ethers.Wallet(process.env.PRIVATE_KEY, this.provider);
    
    console.log("📋 Wallet Address:", this.wallet.address);
    const balance = await this.provider.getBalance(this.wallet.address);
    console.log("💰 Native Balance:", ethers.formatEther(balance), "QIE\n");

    if (balance < ethers.parseEther("0.001")) {
      throw new Error("❌ Insufficient QIE for gas fees. Need at least 0.001 QIE");
    }

    // Load Vault contract
    this.vaultContract = new ethers.Contract(
      config.contracts.vaultAddress,
      vaultABI,
      this.wallet
    );
    console.log("✅ Vault contract loaded:", config.contracts.vaultAddress);

    // Load token configuration
    const tokenConfigPath = path.join(__dirname, 'config/tokens.json');
    if (fs.existsSync(tokenConfigPath)) {
      const tokenConfig = JSON.parse(fs.readFileSync(tokenConfigPath, 'utf8'));
      this.tokens = tokenConfig.tokenMap || tokenConfig.tokens;
      console.log("✅ Token configuration loaded\n");
    } else {
      throw new Error("❌ tokens.json not found. Run 'npx hardhat run scripts/deploy_tokens.js --network sepolia' first");
    }
  }

  async mintTokens() {
    console.log("🪙  Minting test tokens...\n");

    for (const [symbol, tokenInfo] of Object.entries(this.tokens)) {
      const tokenContract = new ethers.Contract(
        tokenInfo.address,
        erc20ABI,
        this.wallet
      );

      try {
        // Check current balance
        const currentBalance = await tokenContract.balanceOf(this.wallet.address);
        const formattedBalance = ethers.formatUnits(currentBalance, tokenInfo.decimals);
        console.log(`   Current ${symbol} balance: ${formattedBalance}`);

        // Mint tokens if balance is low
        const minBalance = ethers.parseUnits("1000", tokenInfo.decimals);
        if (currentBalance < minBalance) {
          console.log(`   ⛏️  Minting ${symbol}...`);
          const tx = await tokenContract.faucet();
          await tx.wait();
          const newBalance = await tokenContract.balanceOf(this.wallet.address);
          console.log(`   ✅ Minted! New balance: ${ethers.formatUnits(newBalance, tokenInfo.decimals)}`);
        } else {
          console.log(`   ✅ Sufficient ${symbol} balance`);
        }
        console.log();
      } catch (error) {
        console.error(`   ❌ Error minting ${symbol}:`, error.message);
      }
    }
  }

  async depositToVault() {
    console.log("💼 Depositing tokens to Vault...\n");

    const depositAmount = this.config.trading.autoFunding?.defaultDepositAmount || "10";

    for (const [symbol, tokenInfo] of Object.entries(this.tokens)) {
      try {
        const tokenContract = new ethers.Contract(
          tokenInfo.address,
          erc20ABI,
          this.wallet
        );

        // Check current vault balance
        const vaultBalance = await this.vaultContract.getBalance(
          this.wallet.address,
          tokenInfo.address
        );
        const formattedVaultBalance = ethers.formatUnits(vaultBalance, tokenInfo.decimals);
        console.log(`   Current ${symbol} in Vault: ${formattedVaultBalance}`);

        // Deposit if vault balance is low
        const minVaultBalance = ethers.parseUnits(depositAmount, tokenInfo.decimals);
        if (vaultBalance < minVaultBalance) {
          const amount = ethers.parseUnits(depositAmount, tokenInfo.decimals);
          
          // Approve Vault to spend tokens
          console.log(`   📝 Approving ${symbol} for Vault...`);
          const approveTx = await tokenContract.approve(process.env.VAULT_ADDRESS, amount);
          await approveTx.wait();
          console.log(`   ✅ Approved`);

          // Deposit to Vault
          console.log(`   💸 Depositing ${depositAmount} ${symbol} to Vault...`);
          const depositTx = await this.vaultContract.deposit(tokenInfo.address, amount);
          await depositTx.wait();
          
          const newVaultBalance = await this.vaultContract.getBalance(
            this.wallet.address,
            tokenInfo.address
          );
          console.log(`   ✅ Deposited! New Vault balance: ${ethers.formatUnits(newVaultBalance, tokenInfo.decimals)}`);
        } else {
          console.log(`   ✅ Sufficient ${symbol} in Vault`);
        }
        console.log();
      } catch (error) {
        console.error(`   ❌ Error depositing ${symbol}:`, error.message);
      }
    }
  }

  async approveExecutor() {
    console.log("🔐 Approving Executor allowance...\n");

    const allowanceAmount = this.config.trading.autoFunding?.defaultAllowanceAmount || "10";

    for (const [symbol, tokenInfo] of Object.entries(this.tokens)) {
      try {
        // Check current allowance
        const currentAllowance = await this.vaultContract.getAllowance(
          this.wallet.address,
          tokenInfo.address
        );
        const formattedAllowance = ethers.formatUnits(currentAllowance, tokenInfo.decimals);
        console.log(`   Current ${symbol} allowance: ${formattedAllowance}`);

        // Approve if allowance is low
        const minAllowance = ethers.parseUnits(allowanceAmount, tokenInfo.decimals);
        if (currentAllowance < minAllowance) {
          const amount = ethers.parseUnits(allowanceAmount, tokenInfo.decimals);
          console.log(`   🔓 Approving ${allowanceAmount} ${symbol} for Executor...`);
          
          const approveTx = await this.vaultContract.approveExecutorAllowance(
            tokenInfo.address,
            amount
          );
          await approveTx.wait();
          
          const newAllowance = await this.vaultContract.getAllowance(
            this.wallet.address,
            tokenInfo.address
          );
          console.log(`   ✅ Approved! New allowance: ${ethers.formatUnits(newAllowance, tokenInfo.decimals)}`);
        } else {
          console.log(`   ✅ Sufficient ${symbol} allowance`);
        }
        console.log();
      } catch (error) {
        console.error(`   ❌ Error approving ${symbol}:`, error.message);
      }
    }
  }

  async run() {
    try {
      await this.initialize();
      await this.mintTokens();
      await this.depositToVault();
      await this.approveExecutor();

      console.log("\n========================================");
      console.log(" ✅ Funding Setup Complete!");
      console.log("========================================\n");
      console.log("✅ Tokens minted to wallet");
      console.log("✅ Tokens deposited to Vault");
      console.log("✅ Executor allowance approved");
      console.log("\n💡 You can now start the trading bot: node index_v2.js\n");

    } catch (error) {
      console.error("\n❌ Funding setup failed:", error.message);
      if (error.stack) {
        console.error(error.stack);
      }
      process.exit(1);
    }
  }
}

// Run if called directly
if (require.main === module) {
  const manager = new FundingManager();
  manager.run();
}

module.exports = FundingManager;
