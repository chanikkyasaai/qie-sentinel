/**
 * Setup Chainlink Oracle Feeds for Executor Contract
 * Run: npx hardhat run scripts/setup-oracles.js --network <network>
 */

const hre = require("hardhat");
const fs = require("fs");
const path = require("path");

// Chainlink Price Feed Addresses by Network
const ORACLE_FEEDS = {
    // Ethereum Mainnet
    mainnet: {
        WETH: "0x5f4eC3Df9cbd43714FE2740f5E3616155c5b8419", // ETH/USD
        USDC: "0x8fFfFfd4AfB6115b954Bd326cbe7B4BA576818f6", // USDC/USD
        USDT: "0x3E7d1eAB13ad0104d2750B8863b489D65364e32D", // USDT/USD
        WBTC: "0xF4030086522a5bEEa4988F8cA5B36dbC97BeE88c", // BTC/USD
        DAI: "0xAed0c38402a5d19df6E4c03F4E2DceD6e29c1ee9", // DAI/USD
    },
    
    // Sepolia Testnet
    sepolia: {
        ETH: "0x694AA1769357215DE4FAC081bf1f309aDC325306", // ETH/USD
        USDC: "0xA2F78ab2355fe2f984D808B5CeE7FD0A93D5270E", // USDC/USD
        BTC: "0x1b44F3514812d835EB1BDB0acB33d3fA3351Ee43", // BTC/USD
    },
    
    // Polygon Mainnet
    polygon: {
        WMATIC: "0xAB594600376Ec9fD91F8e885dADF0CE036862dE0", // MATIC/USD
        USDC: "0xfE4A8cc5b5B2366C1B58Bea3858e81843581b2F7", // USDC/USD
        WETH: "0xF9680D99D6C9589e2a93a78A04A279e509205945", // ETH/USD
    },
    
    // Arbitrum One
    arbitrum: {
        WETH: "0x639Fe6ab55C921f74e7fac1ee960C0B6293ba612", // ETH/USD
        USDC: "0x50834F3163758fcC1Df9973b6e91f0F0F0434aD3", // USDC/USD
        WBTC: "0x6ce185860a4963106506C203335A2910413708e9", // BTC/USD
    },
    
    // Localhost (use deployed mock feeds if available)
    localhost: {},
    hardhat: {},
};

async function main() {
    console.log("🔮 Setting up Chainlink Oracle Feeds for Executor...\n");
    
    // Get network
    const network = hre.network.name;
    console.log(`📍 Network: ${network}`);
    
    // Load deployed addresses
    const deployedPath = path.join(__dirname, "..", "deployed-addresses.json");
    if (!fs.existsSync(deployedPath)) {
        console.error("❌ Error: deployed-addresses.json not found");
        console.log("   Run deploy script first: npx hardhat run scripts/deploy.js --network", network);
        process.exit(1);
    }
    
    const deployed = JSON.parse(fs.readFileSync(deployedPath, "utf8"));
    const executorAddress = deployed.executor;
    
    if (!executorAddress) {
        console.error("❌ Error: Executor address not found in deployed-addresses.json");
        process.exit(1);
    }
    
    console.log(`📍 Executor: ${executorAddress}\n`);
    
    // Get oracle feeds for this network
    const feeds = ORACLE_FEEDS[network];
    
    if (!feeds || Object.keys(feeds).length === 0) {
        console.log(`⚠️  No Chainlink oracle feeds configured for network: ${network}`);
        console.log(`   Oracle validation will remain disabled.`);
        console.log(`   For production, add feeds to ORACLE_FEEDS in this script.\n`);
        return;
    }
    
    // Get Executor contract
    const executor = await hre.ethers.getContractAt("Executor", executorAddress);
    
    // Get deployer signer
    const [deployer] = await hre.ethers.getSigners();
    console.log(`👤 Setting up with account: ${deployer.address}\n`);
    
    // Set oracle feeds
    console.log("📊 Configuring oracle feeds...");
    
    for (const [tokenSymbol, feedAddress] of Object.entries(feeds)) {
        try {
            // In production, tokenAddress should come from your token registry
            // For now, we'll just demonstrate with the feed address
            console.log(`   ${tokenSymbol}: ${feedAddress}`);
            
            // Note: You'll need to provide actual token addresses
            // This is a placeholder - replace with actual token deployment
            // const tx = await executor.setOracleFeed(TOKEN_ADDRESS, feedAddress);
            // await tx.wait();
            // console.log(`   ✅ ${tokenSymbol} oracle feed set`);
        } catch (error) {
            console.error(`   ❌ Failed to set ${tokenSymbol} feed:`, error.message);
        }
    }
    
    console.log("\n⚠️  Note: This script demonstrates oracle feed configuration.");
    console.log("   To fully configure, you need to:");
    console.log("   1. Deploy or identify your ERC20 token addresses");
    console.log("   2. Uncomment and modify the setOracleFeed calls above");
    console.log("   3. Enable oracle validation with setOracleValidation(true)\n");
    
    // Example of enabling validation (commented out)
    // console.log("✅ Enabling oracle validation...");
    // const tx = await executor.setOracleValidation(true);
    // await tx.wait();
    // console.log("✅ Oracle validation enabled!\n");
    
    console.log("📋 Current Executor Configuration:");
    const maxSlippage = await executor.maxSlippageBps();
    const validationEnabled = await executor.oracleValidationEnabled();
    
    console.log(`   Max Slippage: ${maxSlippage} bps (${maxSlippage / 100}%)`);
    console.log(`   Oracle Validation: ${validationEnabled ? "✅ Enabled" : "❌ Disabled"}`);
    
    console.log("\n🔮 Oracle setup complete!");
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
