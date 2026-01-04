const hre = require("hardhat");

async function main() {
  console.log("🔄 Redeploying Executor with REAL Uniswap V3 SwapRouter...\n");
  
  const [deployer] = await hre.ethers.getSigners();
  console.log("📍 Deployer:", deployer.address);
  console.log("💰 Balance:", hre.ethers.formatEther(await hre.ethers.provider.getBalance(deployer.address)), "ETH\n");

  // Existing contract addresses
  const vaultAddress = "0x53f95B19e7191B4737E0A8D2d9298aA2C2853E48";
  const realUniswapV3Router = "0x3bFA4769FB09eefC5a80d6E87c3B9C650f7Ae48E"; // Sepolia Uniswap V3 SwapRouter
  const authorizedExecutor = deployer.address;

  console.log("📋 Configuration:");
  console.log("   Vault:", vaultAddress);
  console.log("   Router (Uniswap V3):", realUniswapV3Router);
  console.log("   Authorized Executor:", authorizedExecutor);
  console.log();

  // Deploy new Executor
  console.log("⚡ Deploying NEW Executor contract...");
  const Executor = await hre.ethers.getContractFactory("Executor");
  const executor = await Executor.deploy(
    vaultAddress,
    realUniswapV3Router,
    authorizedExecutor
  );
  await executor.waitForDeployment();
  const executorAddress = await executor.getAddress();
  console.log("✅ NEW Executor deployed to:", executorAddress);
  console.log();

  // Link to Vault
  console.log("🔗 Linking to Vault...");
  const vault = await hre.ethers.getContractAt("Vault", vaultAddress);
  await vault.approveExecutor(executorAddress);
  console.log("✅ Vault approved new Executor\n");

  console.log("=" .repeat(70));
  console.log("📋 REDEPLOYMENT COMPLETE");
  console.log("=" .repeat(70));
  console.log("OLD Executor (Mock Router):  0x29A9844f954DFc6fe84dD335771962d5Eb2d8711");
  console.log("NEW Executor (Uniswap V3):  ", executorAddress);
  console.log("Router (Uniswap V3):        ", realUniswapV3Router);
  console.log("=" .repeat(70));
  
  console.log("\n📝 Update these files:");
  console.log("1. backend/node/config/config.json → executorAddress");
  console.log("2. .env → EXECUTOR_ADDRESS");
  console.log();

  // Save addresses
  const fs = require('fs');
  const addresses = {
    vault: vaultAddress,
    router: realUniswapV3Router,
    executor: executorAddress,
    oldExecutor: "0x29A9844f954DFc6fe84dD335771962d5Eb2d8711",
    authorizedExecutor: authorizedExecutor,
    network: hre.network.name,
    deployedAt: new Date().toISOString()
  };
  
  fs.writeFileSync(
    'deployed_addresses_v2.json',
    JSON.stringify(addresses, null, 2)
  );
  console.log("✅ Addresses saved to deployed_addresses_v2.json\n");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
