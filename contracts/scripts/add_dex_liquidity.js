const hre = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  console.log("💰 Adding DEX Liquidity...\n");

  const [deployer] = await hre.ethers.getSigners();
  console.log(`Deployer: ${deployer.address}`);

  // Load token config
  const tokensPath = path.join(__dirname, "../../backend/node/config/tokens.json");
  const tokens = JSON.parse(fs.readFileSync(tokensPath, "utf8"));

  // Load config
  const configPath = path.join(__dirname, "../../backend/node/config/config.json");
  const config = JSON.parse(fs.readFileSync(configPath, "utf8"));

  const dexAddress = config.contracts.routerAddress;
  console.log(`DEX: ${dexAddress}\n`);

  // Get token contracts
  const MockToken = await hre.ethers.getContractFactory("MockERC20");
  const usdt = MockToken.attach(tokens.tokens.USDT.address);
  const wbtc = MockToken.attach(tokens.tokens.WBTC.address);
  const weth = MockToken.attach(tokens.tokens.WETH.address);

  // Get DEX contract
  const SimpleSwap = await hre.ethers.getContractFactory("SimpleSwap");
  const dex = SimpleSwap.attach(dexAddress);

  // Check current balances
  console.log("📊 Current DEX Balances:");
  const usdtBalance = await dex.getBalance(usdt.target);
  const wbtcBalance = await dex.getBalance(wbtc.target);
  const wethBalance = await dex.getBalance(weth.target);
  
  console.log(`   USDT: ${hre.ethers.formatUnits(usdtBalance, 6)}`);
  console.log(`   WBTC: ${hre.ethers.formatUnits(wbtcBalance, 8)}`);
  console.log(`   WETH: ${hre.ethers.formatUnits(wethBalance, 18)}\n`);

  // Add liquidity: 10,000 USDT, 100 WBTC, 1000 WETH
  const liquidityAmounts = {
    USDT: hre.ethers.parseUnits("10000", 6),
    WBTC: hre.ethers.parseUnits("100", 8),
    WETH: hre.ethers.parseUnits("1000", 18)
  };

  console.log("💧 Adding liquidity...");
  
  // Mint tokens
  await usdt.mint(deployer.address, liquidityAmounts.USDT);
  await wbtc.mint(deployer.address, liquidityAmounts.WBTC);
  await weth.mint(deployer.address, liquidityAmounts.WETH);
  console.log("   ✅ Minted tokens");

  // Approve DEX
  await usdt.approve(dex.target, liquidityAmounts.USDT);
  await wbtc.approve(dex.target, liquidityAmounts.WBTC);
  await weth.approve(dex.target, liquidityAmounts.WETH);
  console.log("   ✅ Approved DEX");

  // Add liquidity
  await dex.addLiquidity(usdt.target, liquidityAmounts.USDT);
  console.log("   ✅ Added 10,000 USDT");
  
  await dex.addLiquidity(wbtc.target, liquidityAmounts.WBTC);
  console.log("   ✅ Added 100 WBTC");
  
  await dex.addLiquidity(weth.target, liquidityAmounts.WETH);
  console.log("   ✅ Added 1,000 WETH");

  // Check new balances
  console.log("\n📊 New DEX Balances:");
  const newUsdtBalance = await dex.getBalance(usdt.target);
  const newWbtcBalance = await dex.getBalance(wbtc.target);
  const newWethBalance = await dex.getBalance(weth.target);
  
  console.log(`   USDT: ${hre.ethers.formatUnits(newUsdtBalance, 6)}`);
  console.log(`   WBTC: ${hre.ethers.formatUnits(newWbtcBalance, 8)}`);
  console.log(`   WETH: ${hre.ethers.formatUnits(newWethBalance, 18)}`);

  console.log("\n✅ DEX liquidity added successfully!");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
