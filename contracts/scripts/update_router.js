const hre = require("hardhat");

async function main() {
  console.log("🔄 Updating Executor Router...\n");
  
  const executorAddress = "0x8152251F92827E44B56cA7B116751dD45C6C67D5";
  const newRouterAddress = "0x9096a949cF3d24f67e41691E7a5276F658875019"; // SimpleSwap v2
  
  console.log("Executor:", executorAddress);
  console.log("NEW Router:", newRouterAddress);
  console.log();
  
  const executor = await hre.ethers.getContractAt("Executor", executorAddress);
  
  console.log("📝 Calling executor.setRouter()...");
  const tx = await executor.setRouter(newRouterAddress, {
    gasLimit: 100000
  });
  console.log("TX:", tx.hash);
  console.log("⏳ Waiting for confirmation...");
  
  const receipt = await tx.wait();
  console.log("✅ Router updated!");
  console.log("   Block:", receipt.blockNumber);
  console.log();
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
