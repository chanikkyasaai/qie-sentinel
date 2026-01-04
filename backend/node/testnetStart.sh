#!/usr/bin/env bash
#
# QIE Sentinel - Testnet Deployment & Startup Script
#
# This script automates the complete testnet deployment process:
# 1. Deploy Vault and Executor contracts
# 2. Configure Chainlink oracle feeds
# 3. Start backend trading engine in live mode
#

set -e  # Exit on error

echo "========================================================================"
echo "🚀 QIE Sentinel - Testnet Deployment"
echo "========================================================================"
echo ""

# ============ Configuration ============

NETWORK=${1:-sepolia}
CONTRACTS_DIR="../../contracts"
BACKEND_DIR="."
ENV_FILE="../../.env"

echo "📋 Configuration:"
echo "   Network: $NETWORK"
echo "   Contracts: $CONTRACTS_DIR"
echo "   Backend: $BACKEND_DIR"
echo ""

# ============ Pre-flight Checks ============

echo "🔍 Running pre-flight checks..."

# Check if .env exists
if [ ! -f "$ENV_FILE" ]; then
    echo "❌ Error: .env file not found at $ENV_FILE"
    echo "   Please create .env with required variables:"
    echo "   - RPC_URL"
    echo "   - PRIVATE_KEY"
    echo "   - ETHERSCAN_API_KEY (optional)"
    exit 1
fi

# Check if contracts directory exists
if [ ! -d "$CONTRACTS_DIR" ]; then
    echo "❌ Error: Contracts directory not found"
    exit 1
fi

# Check if node_modules exist
if [ ! -d "$CONTRACTS_DIR/node_modules" ]; then
    echo "⚠️  Warning: Contract dependencies not installed"
    echo "   Installing dependencies..."
    cd "$CONTRACTS_DIR"
    npm install
    cd - > /dev/null
fi

echo "✅ Pre-flight checks passed"
echo ""

# ============ Step 1: Deploy Contracts ============

echo "========================================================================"
echo "📜 Step 1: Deploying Smart Contracts to $NETWORK"
echo "========================================================================"
echo ""

cd "$CONTRACTS_DIR"

echo "🔨 Compiling contracts..."
npx hardhat compile

echo ""
echo "🚀 Deploying Vault and Executor..."
npx hardhat run scripts/deploy.js --network $NETWORK

if [ $? -ne 0 ]; then
    echo "❌ Contract deployment failed"
    exit 1
fi

echo ""
echo "✅ Contracts deployed successfully"
echo ""

# Check if deployed-addresses.json was created
if [ ! -f "deployed-addresses.json" ]; then
    echo "❌ Error: deployed-addresses.json not found after deployment"
    exit 1
fi

# Read deployed addresses
VAULT_ADDRESS=$(node -p "JSON.parse(require('fs').readFileSync('deployed-addresses.json', 'utf8')).vault")
EXECUTOR_ADDRESS=$(node -p "JSON.parse(require('fs').readFileSync('deployed-addresses.json', 'utf8')).executor")
ROUTER_ADDRESS=$(node -p "JSON.parse(require('fs').readFileSync('deployed-addresses.json', 'utf8')).router || 'N/A'")

echo "📍 Deployed Addresses:"
echo "   Vault:    $VAULT_ADDRESS"
echo "   Executor: $EXECUTOR_ADDRESS"
echo "   Router:   $ROUTER_ADDRESS"
echo ""

cd - > /dev/null

# ============ Step 2: Configure Oracles ============

echo "========================================================================"
echo "🔮 Step 2: Configuring Chainlink Oracle Feeds"
echo "========================================================================"
echo ""

cd "$CONTRACTS_DIR"

if [ -f "scripts/setup-oracles.js" ]; then
    echo "⚙️  Running oracle setup..."
    npx hardhat run scripts/setup-oracles.js --network $NETWORK
    
    if [ $? -ne 0 ]; then
        echo "⚠️  Warning: Oracle setup encountered errors"
        echo "   You may need to configure oracles manually"
    else
        echo "✅ Oracle feeds configured"
    fi
else
    echo "⚠️  Warning: setup-oracles.js not found, skipping oracle configuration"
fi

echo ""

cd - > /dev/null

# ============ Step 3: Update Backend Config ============

echo "========================================================================"
echo "⚙️  Step 3: Updating Backend Configuration"
echo "========================================================================"
echo ""

CONFIG_FILE="$BACKEND_DIR/config/config.json"

if [ -f "$CONFIG_FILE" ]; then
    echo "📝 Updating config.json with deployed addresses..."
    
    # Use Node.js to update JSON (more reliable than sed)
    node -e "
        const fs = require('fs');
        const config = JSON.parse(fs.readFileSync('$CONFIG_FILE', 'utf8'));
        const deployed = JSON.parse(fs.readFileSync('$CONTRACTS_DIR/deployed-addresses.json', 'utf8'));
        
        config.contracts.vaultAddress = deployed.vault;
        config.contracts.executorAddress = deployed.executor;
        if (deployed.router) {
            config.contracts.routerAddress = deployed.router;
        }
        config.network.networkName = '$NETWORK';
        
        fs.writeFileSync('$CONFIG_FILE', JSON.stringify(config, null, 2));
        console.log('✅ Configuration updated');
    "
else
    echo "⚠️  Warning: config.json not found, skipping configuration update"
fi

echo ""

# ============ Step 4: Start Backend ============

echo "========================================================================"
echo "🤖 Step 4: Starting Backend Trading Engine"
echo "========================================================================"
echo ""

echo "🔄 Starting QIE Sentinel backend in live mode..."
echo ""
echo "📢 Backend will start in 3 seconds..."
echo "   Press Ctrl+C to cancel"
echo ""

sleep 1
echo "   3..."
sleep 1
echo "   2..."
sleep 1
echo "   1..."
echo ""

cd "$BACKEND_DIR"

# Check if using new modular backend
if [ -f "index_v2.js" ]; then
    echo "🚀 Starting modular backend (index_v2.js)..."
    node index_v2.js
else
    echo "🚀 Starting backend (index.js)..."
    node index.js
fi

# This line will only be reached if the backend exits
echo ""
echo "========================================================================"
echo "🛑 Backend stopped"
echo "========================================================================"
