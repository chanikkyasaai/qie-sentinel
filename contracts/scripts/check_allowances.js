const hre = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  console.log("🔍 Checking Vault Allowances...\n");

  const [deployer] = await hre.ethers.getSigners();

  // Load configs
  const tokensPath = path.join(__dirname, "../../backend/node/config/tokens.json");
  const tokens = JSON.parse(fs.readFileSync(tokensPath, "utf8"));

  const configPath = path.join(__dirname, "../../backend/node/config/config.json");
  const config = JSON.parse(fs.readFileSync(configPath, "utf8"));

  const vaultAddress = config.contracts.vaultAddress;
  const executorAddress = config.contracts.executorAddress;

  console.log(`Vault: ${vaultAddress}`);
  console.log(`Executor: ${executorAddress}\n`);

  // Get contracts
  const MockToken = await hre.ethers.getContractFactory("MockERC20");
  const usdt = MockToken.attach(tokens.tokens.USDT.address);
  const wbtc = MockToken.attach(tokens.tokens.WBTC.address);
  const weth = MockToken.attach(tokens.tokens.WETH.address);

  const Vault = await hre.ethers.getContractFactory("Vault");
  const vault = Vault.attach(vaultAddress);

  // Check balances
  console.log("📊 Vault Balances:");
  const usdtBalance = await vault.getBalance(deployer.address, usdt.target);
  const wbtcBalance = await vault.getBalance(deployer.address, wbtc.target);
  const wethBalance = await vault.getBalance(deployer.address, weth.target);
  
  console.log(`   USDT: ${hre.ethers.formatUnits(usdtBalance, 6)}`);
  console.log(`   WBTC: ${hre.ethers.formatUnits(wbtcBalance, 8)}`);
  console.log(`   WETH: ${hre.ethers.formatUnits(wethBalance, 18)}\n`);

  // Check allowances
  console.log("🔓 Executor Allowances:");
  const usdtAllowance = await vault.getAllowance(deployer.address, usdt.target, executorAddress);
  const wbtcAllowance = await vault.getAllowance(deployer.address, wbtc.target, executorAddress);
  const wethAllowance = await vault.getAllowance(deployer.address, weth.target, executorAddress);
  
  console.log(`   USDT: ${hre.ethers.formatUnits(usdtAllowance, 6)}`);
  console.log(`   WBTC: ${hre.ethers.formatUnits(wbtcAllowance, 8)}`);
  console.log(`   WETH: ${hre.ethers.formatUnits(wethAllowance, 18)}\n`);

  // Fix WETH allowance if needed
  if (wethAllowance < wethBalance) {
    console.log("⚠️  WETH allowance is lower than balance!");
    console.log("💡 Fixing WETH allowance...");
    
    await vault.approveExecutor(weth.target, executorAddress, wethBalance);
    console.log("✅ WETH allowance updated!");
    
    const newAllowance = await vault.getAllowance(deployer.address, weth.target, executorAddress);
    console.log(`   New WETH allowance: ${hre.ethers.formatUnits(newAllowance, 18)}`);
  } else {
    console.log("✅ All allowances are sufficient!");
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
