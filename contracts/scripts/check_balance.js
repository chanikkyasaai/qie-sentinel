const hre = require("hardhat");

async function main() {
  console.log("🔍 Checking QIE Network Balance...\n");
  
  const [deployer] = await hre.ethers.getSigners();
  const balance = await hre.ethers.provider.getBalance(deployer.address);
  
  console.log("Network:", hre.network.name);
  console.log("Chain ID:", (await hre.ethers.provider.getNetwork()).chainId.toString());
  console.log("\nAccount:", deployer.address);
  console.log("Balance:", hre.ethers.formatEther(balance), "QIE");
  
  if (balance === 0n) {
    console.log("\n❌ INSUFFICIENT FUNDS!");
    console.log("You need QIE coins to deploy contracts.");
    console.log("Please fund this address with QIE coins.");
  } else {
    console.log("\n✅ Wallet is funded and ready for deployment!");
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
