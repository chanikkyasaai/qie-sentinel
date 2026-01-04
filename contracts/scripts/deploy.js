const hre = require("hardhat");

async function main() {
  console.log("🚀 Starting QIE Sentinel contract deployment...");
  
  // Get deployer account
  const [deployer] = await hre.ethers.getSigners();
  console.log("\n📍 Deploying contracts with account:", deployer.address);
  console.log("💰 Account balance:", hre.ethers.formatEther(await hre.ethers.provider.getBalance(deployer.address)), "ETH");

  // Deploy Vault contract
  console.log("\n📦 Deploying Vault contract...");
  const Vault = await hre.ethers.getContractFactory("Vault");
  const vault = await Vault.deploy();
  await vault.waitForDeployment();
  const vaultAddress = await vault.getAddress();
  console.log("✅ Vault deployed to:", vaultAddress);

  // TODO: In production, replace with actual Uniswap V2 Router address
  // Mainnet: 0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D
  // For now, deploy a mock router for testing
  console.log("\n🔀 Deploying Mock DEX Router (for testing)...");
  const MockRouter = await hre.ethers.getContractFactory("MockUniswapV2Router");
  const mockRouter = await MockRouter.deploy();
  await mockRouter.waitForDeployment();
  const routerAddress = await mockRouter.getAddress();
  console.log("✅ Mock Router deployed to:", routerAddress);
  console.log("⚠️  NOTE: Replace with real Uniswap V2 Router address in production!");

  // Set authorized executor (in production, use secure backend hot wallet)
  const authorizedExecutor = deployer.address; // For testing, use deployer
  console.log("\n🔐 Setting authorized executor:", authorizedExecutor);
  console.log("⚠️  NOTE: In production, use a dedicated backend hot wallet address!");

  // Deploy Executor contract
  console.log("\n⚡ Deploying Executor contract...");
  const Executor = await hre.ethers.getContractFactory("Executor");
  const executor = await Executor.deploy(
    vaultAddress,
    routerAddress,
    authorizedExecutor
  );
  await executor.waitForDeployment();
  const executorAddress = await executor.getAddress();
  console.log("✅ Executor deployed to:", executorAddress);

  // Link contracts
  console.log("\n🔗 Linking contracts...");
  await vault.approveExecutor(executorAddress);
  console.log("✅ Vault approved Executor");

  // Display summary
  console.log("\n" + "=".repeat(70));
  console.log("📋 DEPLOYMENT SUMMARY");
  console.log("=".repeat(70));
  console.log("Deployer Address:           ", deployer.address);
  console.log("Vault Address:              ", vaultAddress);
  console.log("Router Address (Mock):      ", routerAddress);
  console.log("Executor Address:           ", executorAddress);
  console.log("Authorized Executor Wallet: ", authorizedExecutor);
  console.log("=".repeat(70));
  
  console.log("\n📝 Next Steps:");
  console.log("1. Update .env file with deployed contract addresses");
  console.log("2. In production, replace Mock Router with real Uniswap V2 Router");
  console.log("3. Set authorized executor to your backend hot wallet address");
  console.log("4. Fund the Mock Router with tokens for testing swaps");
  console.log("5. Configure backend to use these contract addresses");
  
  console.log("\n✨ Deployment complete!");
  
  // Save addresses to a file for backend integration
  const fs = require('fs');
  const addresses = {
    vault: vaultAddress,
    router: routerAddress,
    executor: executorAddress,
    authorizedExecutor: authorizedExecutor,
    network: hre.network.name,
    deployedAt: new Date().toISOString()
  };
  
  fs.writeFileSync(
    'deployed-addresses.json',
    JSON.stringify(addresses, null, 2)
  );
  console.log("\n💾 Contract addresses saved to: deployed-addresses.json");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Deployment failed:", error);
    process.exit(1);
  });
