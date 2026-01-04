const hre = require("hardhat");

async function main() {
  console.log("💰 Adding liquidity to SimpleSwap from Vault...\n");
  
  const vaultAddress = "0x53f95B19e7191B4737E0A8D2d9298aA2C2853E48";
  const swapAddress = "0x9096a949cF3d24f67e41691E7a5276F658875019";
  
  const tokens = {
    USDT: { address: "0x7755b09dFdB1944e6cCD98c7f9e22e806E9BD631", decimals: 6, amount: "100" },
    WBTC: { address: "0xbe96d720ecd35a1fA139410D0454B94A17197DC1", decimals: 8, amount: "1" },
    WETH: { address: "0xBC138a9ddB997A8A10213E60Bc4a54929A0b1d8f", decimals: 18, amount: "1" }
  };
  
  const vault = await hre.ethers.getContractAt("Vault", vaultAddress);
  const [deployer] = await hre.ethers.getSigners();
  
  for (const [symbol, info] of Object.entries(tokens)) {
    console.log(`📤 Withdrawing ${info.amount} ${symbol} from Vault...`);
    const amount = hre.ethers.parseUnits(info.amount, info.decimals);
    
    const tx = await vault.withdraw(info.address, amount);
    await tx.wait();
    console.log(`   ✅ Withdrawn\n`);
    
    console.log(`📝 Approving ${symbol} for SimpleSwap...`);
    const token = await hre.ethers.getContractAt("MockERC20", info.address);
    const approveTx = await token.approve(swapAddress, amount);
    await approveTx.wait();
    console.log(`   ✅ Approved\n`);
    
    console.log(`💸 Adding ${symbol} liquidity to SimpleSwap...`);
    const swap = await hre.ethers.getContractAt("SimpleSwap", swapAddress);
    const addTx = await swap.addLiquidity(info.address, amount);
    await addTx.wait();
    
    const balance = await swap.getBalance(info.address);
    console.log(`   ✅ ${symbol} liquidity: ${hre.ethers.formatUnits(balance, info.decimals)}\n`);
  }
  
  console.log("========================================");
  console.log(" ✅ SimpleSwap DEX Ready for Trading!");
  console.log("========================================\n");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
