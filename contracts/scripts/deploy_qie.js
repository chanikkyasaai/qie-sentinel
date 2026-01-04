const hre = require("hardhat");
const fs = require('fs');
const path = require('path');

async function main() {
  console.log("🚀 Starting QIE Sentinel Full Deployment on QIE Network...");
  
  const [deployer] = await hre.ethers.getSigners();
  console.log("Deployer:", deployer.address);

  // 1. Deploy Mock Tokens
  console.log("\n1️⃣  Deploying Mock Tokens...");
  const MockERC20 = await hre.ethers.getContractFactory("MockERC20");
  
  const mockUSDT = await MockERC20.deploy("Mock Tether USD", "USDT", 6);
  await mockUSDT.waitForDeployment();
  const usdtAddress = await mockUSDT.getAddress();
  console.log("   ✅ USDT:", usdtAddress);
  
  const mockWBTC = await MockERC20.deploy("Mock Wrapped Bitcoin", "WBTC", 8);
  await mockWBTC.waitForDeployment();
  const wbtcAddress = await mockWBTC.getAddress();
  console.log("   ✅ WBTC:", wbtcAddress);
  
  const mockWETH = await MockERC20.deploy("Mock Wrapped Ether", "WETH", 18);
  await mockWETH.waitForDeployment();
  const wethAddress = await mockWETH.getAddress();
  console.log("   ✅ WETH:", wethAddress);

  // 2. Deploy SimpleSwap DEX
  console.log("\n2️⃣  Deploying SimpleSwap DEX...");
  const SimpleSwap = await hre.ethers.getContractFactory("SimpleSwap");
  const simpleSwap = await SimpleSwap.deploy();
  await simpleSwap.waitForDeployment();
  const simpleSwapAddress = await simpleSwap.getAddress();
  console.log("   ✅ SimpleSwap:", simpleSwapAddress);

  // 3. Deploy Vault
  console.log("\n3️⃣  Deploying Vault...");
  const Vault = await hre.ethers.getContractFactory("Vault");
  const vault = await Vault.deploy();
  await vault.waitForDeployment();
  const vaultAddress = await vault.getAddress();
  console.log("   ✅ Vault:", vaultAddress);

  // 4. Deploy Executor
  console.log("\n4️⃣  Deploying Executor...");
  const Executor = await hre.ethers.getContractFactory("Executor");
  const executor = await Executor.deploy(
    vaultAddress,
    simpleSwapAddress, // Use SimpleSwap as Router
    deployer.address   // Authorized Executor
  );
  await executor.waitForDeployment();
  const executorAddress = await executor.getAddress();
  console.log("   ✅ Executor:", executorAddress);

  // 5. Link Contracts
  console.log("\n5️⃣  Linking Contracts...");
  await vault.approveExecutor(executorAddress);
  console.log("   ✅ Vault approved Executor");

  // 6. Fund SimpleSwap (Liquidity)
  console.log("\n6️⃣  Funding SimpleSwap (Adding Liquidity)...");
  
  try {
    // Mint tokens to deployer first
    const usdtAmount = hre.ethers.parseUnits("100000", 6);
    const wbtcAmount = hre.ethers.parseUnits("10", 8);
    const wethAmount = hre.ethers.parseUnits("100", 18);
    
    console.log("   Minting tokens...");
    await (await mockUSDT.mint(deployer.address, usdtAmount)).wait();
    await (await mockWBTC.mint(deployer.address, wbtcAmount)).wait();
    await (await mockWETH.mint(deployer.address, wethAmount)).wait();
    
    console.log("   Approving tokens...");
    await (await mockUSDT.approve(simpleSwapAddress, usdtAmount)).wait();
    await (await mockWBTC.approve(simpleSwapAddress, wbtcAmount)).wait();
    await (await mockWETH.approve(simpleSwapAddress, wethAmount)).wait();
    
    console.log("   Adding liquidity...");
    await (await simpleSwap.addLiquidity(usdtAddress, usdtAmount)).wait();
    await (await simpleSwap.addLiquidity(wbtcAddress, wbtcAmount)).wait();
    await (await simpleSwap.addLiquidity(wethAddress, wethAmount)).wait();
    console.log("   ✅ Liquidity added to SimpleSwap");
  } catch (error) {
    console.log("   ⚠️  Liquidity funding skipped (will add manually later)");
    console.log("   Error:", error.message);
  }

  // 7. Save Configurations
  console.log("\n7️⃣  Saving Configurations...");
  
  // Update tokens.json
  const tokenConfig = {
    network: "qie",
    deployer: deployer.address,
    tokens: {
      USDT: { address: usdtAddress, decimals: 6, symbol: "USDT" },
      WBTC: { address: wbtcAddress, decimals: 8, symbol: "WBTC" },
      WETH: { address: wethAddress, decimals: 18, symbol: "WETH" }
    },
    deployedAt: new Date().toISOString()
  };
  fs.writeFileSync(
    path.join(__dirname, '../../backend/node/config/tokens.json'),
    JSON.stringify(tokenConfig, null, 2)
  );
  
  // Update config.json (Contract Addresses)
  const configPath = path.join(__dirname, '../../backend/node/config/config.json');
  const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
  
  config.contracts.vaultAddress = vaultAddress;
  config.contracts.executorAddress = executorAddress;
  config.contracts.routerAddress = simpleSwapAddress;
  config.network.networkName = "qie-testnet";
  config.network.chainId = 1983;
  config.network.rpcUrl = "https://rpc1testnet.qie.digital/";
  
  fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
  
  console.log("   ✅ Configuration files updated");
  
  console.log("\n🎉 QIE Network Migration Complete!");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
