// Deploy mock tokens and setup funding for QIE Sentinel
require('dotenv').config({ path: '../../.env' });
const hre = require("hardhat");
const fs = require('fs');
const path = require('path');

async function main() {
  console.log("🪙  Deploying Mock ERC20 Tokens for Testing...\n");

  const [deployer] = await hre.ethers.getSigners();
  console.log("Deployer address:", deployer.address);
  console.log("Deployer balance:", hre.ethers.formatEther(await hre.ethers.provider.getBalance(deployer.address)), "ETH\n");

  // Deploy Mock Tokens
  const MockERC20 = await hre.ethers.getContractFactory("MockERC20");
  
  console.log("📋 Deploying USDT Mock...");
  const mockUSDT = await MockERC20.deploy("Mock Tether USD", "USDT", 6);
  await mockUSDT.waitForDeployment();
  const usdtAddress = await mockUSDT.getAddress();
  console.log("✅ Mock USDT deployed to:", usdtAddress);
  
  console.log("\n📋 Deploying WBTC Mock...");
  const mockWBTC = await MockERC20.deploy("Mock Wrapped Bitcoin", "WBTC", 8);
  await mockWBTC.waitForDeployment();
  const wbtcAddress = await mockWBTC.getAddress();
  console.log("✅ Mock WBTC deployed to:", wbtcAddress);
  
  console.log("\n📋 Deploying WETH Mock...");
  const mockWETH = await MockERC20.deploy("Mock Wrapped Ether", "WETH", 18);
  await mockWETH.waitForDeployment();
  const wethAddress = await mockWETH.getAddress();
  console.log("✅ Mock WETH deployed to:", wethAddress);

  // Mint initial tokens to deployer
  console.log("\n💰 Minting initial token supply...");
  
  const usdtAmount = hre.ethers.parseUnits("100000", 6); // 100k USDT
  await mockUSDT.mint(deployer.address, usdtAmount);
  console.log("✅ Minted 100,000 USDT to deployer");
  
  const wbtcAmount = hre.ethers.parseUnits("10", 8); // 10 WBTC
  await mockWBTC.mint(deployer.address, wbtcAmount);
  console.log("✅ Minted 10 WBTC to deployer");
  
  const wethAmount = hre.ethers.parseUnits("100", 18); // 100 WETH
  await mockWETH.mint(deployer.address, wethAmount);
  console.log("✅ Minted 100 WETH to deployer");

  // Save token addresses to config
  const tokenConfig = {
    network: hre.network.name,
    deployer: deployer.address,
    tokens: {
      USDT: {
        address: usdtAddress,
        decimals: 6,
        symbol: "USDT"
      },
      WBTC: {
        address: wbtcAddress,
        decimals: 8,
        symbol: "WBTC"
      },
      WETH: {
        address: wethAddress,
        decimals: 18,
        symbol: "WETH"
      }
    },
    deployedAt: new Date().toISOString()
  };

  const configPath = path.join(__dirname, '../../backend/node/config/tokens.json');
  fs.writeFileSync(configPath, JSON.stringify(tokenConfig, null, 2));
  console.log("\n✅ Token addresses saved to backend/node/config/tokens.json");

  console.log("\n========================================");
  console.log(" Mock Token Deployment Complete!");
  console.log("========================================\n");
  console.log("Token Addresses:");
  console.log("  USDT:", usdtAddress);
  console.log("  WBTC:", wbtcAddress);
  console.log("  WETH:", wethAddress);
  console.log("\n💡 Run 'node backend/node/setup_funding.js' to fund the Vault");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
