const hre = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  console.log("💰 Adding More WBTC Liquidity...\n");

  const [deployer] = await hre.ethers.getSigners();

  // Load configs
  const tokensPath = path.join(__dirname, "../../backend/node/config/tokens.json");
  const tokens = JSON.parse(fs.readFileSync(tokensPath, "utf8"));

  const configPath = path.join(__dirname, "../../backend/node/config/config.json");
  const config = JSON.parse(fs.readFileSync(configPath, "utf8"));

  const dexAddress = config.contracts.routerAddress;

  // Get contracts
  const MockToken = await hre.ethers.getContractFactory("MockERC20");
  const wbtc = MockToken.attach(tokens.tokens.WBTC.address);

  const SimpleSwap = await hre.ethers.getContractFactory("SimpleSwap");
  const dex = SimpleSwap.attach(dexAddress);

  // Check current balance
  const currentBalance = await dex.getBalance(wbtc.target);
  console.log(`📊 Current DEX WBTC: ${hre.ethers.formatUnits(currentBalance, 8)}`);

  // Add 1000 more WBTC
  const additionalWBTC = hre.ethers.parseUnits("1000", 8);
  
  console.log("\n💧 Adding 1000 WBTC...");
  await wbtc.mint(deployer.address, additionalWBTC);
  console.log("   ✅ Minted");
  
  await wbtc.approve(dex.target, additionalWBTC);
  console.log("   ✅ Approved");
  
  await dex.addLiquidity(wbtc.target, additionalWBTC);
  console.log("   ✅ Added to DEX");

  // Check new balance
  const newBalance = await dex.getBalance(wbtc.target);
  console.log(`\n📊 New DEX WBTC: ${hre.ethers.formatUnits(newBalance, 8)}`);
  console.log("\n✅ WBTC liquidity added!");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
