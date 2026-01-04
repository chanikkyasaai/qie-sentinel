const hre = require("hardhat");

async function main() {
  console.log("🔐 Approving NEW Executor in Vault...\n");
  
  const vaultAddress = "0x53f95B19e7191B4737E0A8D2d9298aA2C2853E48";
  const newExecutorAddress = "0x8152251F92827E44B56cA7B116751dD45C6C67D5";
  
  console.log("Vault:", vaultAddress);
  console.log("NEW Executor:", newExecutorAddress);
  console.log();
  
  const vault = await hre.ethers.getContractAt("Vault", vaultAddress);
  
  console.log("📝 Calling vault.approveExecutor()...");
  const tx = await vault.approveExecutor(newExecutorAddress, {
    gasLimit: 100000,
    maxFeePerGas: hre.ethers.parseUnits("50", "gwei"),
    maxPriorityFeePerGas: hre.ethers.parseUnits("2", "gwei")
  });
  console.log("TX:", tx.hash);
  console.log("⏳ Waiting for confirmation...");
  
  const receipt = await tx.wait();
  console.log("✅ NEW Executor approved in Vault!");
  console.log("   Block:", receipt.blockNumber);
  console.log();
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
