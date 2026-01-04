const hre = require("hardhat");

async function main() {
  console.log("🚀 Deploying SimpleSwap DEX...\n");
  
  const SimpleSwap = await hre.ethers.getContractFactory("SimpleSwap");
  const swap = await SimpleSwap.deploy();
  await swap.waitForDeployment();
  
  const swapAddress = await swap.getAddress();
  console.log("✅ SimpleSwap deployed:", swapAddress);
  console.log();
  
  console.log("========================================");
  console.log(" ✅ SimpleSwap DEX Ready!");
  console.log("========================================");
  console.log();
  console.log("Router Address:", swapAddress);
  console.log();
  console.log("⚠️  IMPORTANT: Run these commands:");
  console.log(`1. Update Executor router: npx hardhat run scripts/update_router_new.js --network sepolia`);
  console.log(`2. Fund SimpleSwap: npx hardhat run scripts/fund_simpleswap.js --network sepolia`);
  console.log(`3. Update config.json routerAddress: "${swapAddress}"`);
  console.log();
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
