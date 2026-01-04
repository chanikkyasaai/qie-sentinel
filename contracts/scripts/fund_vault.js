const hre = require("hardhat");
const fs = require('fs');
const path = require('path');

async function main() {
  console.log("💰 Funding Vault on QIE Testnet...\n");
  
  const [deployer] = await hre.ethers.getSigners();
  
  // Load deployed addresses
  const tokenConfig = JSON.parse(fs.readFileSync(path.join(__dirname, '../../backend/node/config/tokens.json'), 'utf8'));
  const config = JSON.parse(fs.readFileSync(path.join(__dirname, '../../backend/node/config/config.json'), 'utf8'));
  
  const vaultAddress = config.contracts.vaultAddress;
  const vault = await hre.ethers.getContractAt("Vault", vaultAddress);
  
  console.log("Vault:", vaultAddress);
  console.log("Deployer:", deployer.address);
  
  // Tokens to fund
  const tokens = [
    { symbol: "USDT", address: tokenConfig.tokens.USDT.address, decimals: 6, amount: "100" },
    { symbol: "WBTC", address: tokenConfig.tokens.WBTC.address, decimals: 8, amount: "1" },
    { symbol: "WETH", address: tokenConfig.tokens.WETH.address, decimals: 18, amount: "10" }
  ];
  
  for (const token of tokens) {
    console.log(`\n💵 ${token.symbol}:`);
    
    const tokenContract = await hre.ethers.getContractAt("MockERC20", token.address);
    
    // Check deployer balance
    const deployerBalance = await tokenContract.balanceOf(deployer.address);
    console.log(`   Deployer balance: ${hre.ethers.formatUnits(deployerBalance, token.decimals)}`);
    
    // Mint if needed
    const amountToFund = hre.ethers.parseUnits(token.amount, token.decimals);
    if (deployerBalance < amountToFund) {
      console.log(`   Minting ${token.amount} ${token.symbol}...`);
      await (await tokenContract.mint(deployer.address, amountToFund)).wait();
    }
    
    // Approve Vault
    console.log(`   Approving Vault...`);
    await (await tokenContract.approve(vaultAddress, amountToFund)).wait();
    
    // Deposit to Vault
    console.log(`   Depositing ${token.amount} ${token.symbol} to Vault...`);
    await (await vault.deposit(token.address, amountToFund)).wait();
    
    // Approve Executor allowance
    console.log(`   Approving Executor allowance...`);
    await (await vault.approveExecutorAllowance(token.address, amountToFund)).wait();
    
    // Check final balance
    const vaultBalance = await vault.getBalance(deployer.address, token.address);
    console.log(`   ✅ Vault balance: ${hre.ethers.formatUnits(vaultBalance, token.decimals)} ${token.symbol}`);
  }
  
  console.log("\n✅ Vault funded successfully!\n");
  console.log("🚀 You can now start the trading bot: node index_v2.js");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
