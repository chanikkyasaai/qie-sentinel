# QIE Sentinel - Testnet Deployment & Startup Script (PowerShell)
#
# This script automates the complete testnet deployment process:
# 1. Deploy Vault and Executor contracts
# 2. Configure Chainlink oracle feeds
# 3. Start backend trading engine in live mode

param(
    [string]$Network = "sepolia"
)

$ErrorActionPreference = "Stop"

Write-Host "========================================================================" -ForegroundColor Cyan
Write-Host "🚀 QIE Sentinel - Testnet Deployment" -ForegroundColor Cyan
Write-Host "========================================================================" -ForegroundColor Cyan
Write-Host ""

# ============ Configuration ============

$ContractsDir = "..\..\contracts"
$BackendDir = "."
$EnvFile = "..\..\. env"

Write-Host "📋 Configuration:" -ForegroundColor Yellow
Write-Host "   Network: $Network"
Write-Host "   Contracts: $ContractsDir"
Write-Host "   Backend: $BackendDir"
Write-Host ""

# ============ Pre-flight Checks ============

Write-Host "🔍 Running pre-flight checks..." -ForegroundColor Yellow

# Check if .env exists
if (-not (Test-Path $EnvFile)) {
    Write-Host "❌ Error: .env file not found at $EnvFile" -ForegroundColor Red
    Write-Host "   Please create .env with required variables:" -ForegroundColor Red
    Write-Host "   - RPC_URL"
    Write-Host "   - PRIVATE_KEY"
    Write-Host "   - ETHERSCAN_API_KEY (optional)"
    exit 1
}

# Check if contracts directory exists
if (-not (Test-Path $ContractsDir)) {
    Write-Host "❌ Error: Contracts directory not found" -ForegroundColor Red
    exit 1
}

# Check if node_modules exist
if (-not (Test-Path "$ContractsDir\node_modules")) {
    Write-Host "⚠️  Warning: Contract dependencies not installed" -ForegroundColor Yellow
    Write-Host "   Installing dependencies..."
    Push-Location $ContractsDir
    npm install
    Pop-Location
}

Write-Host "✅ Pre-flight checks passed" -ForegroundColor Green
Write-Host ""

# ============ Step 1: Deploy Contracts ============

Write-Host "========================================================================" -ForegroundColor Cyan
Write-Host "📜 Step 1: Deploying Smart Contracts to $Network" -ForegroundColor Cyan
Write-Host "========================================================================" -ForegroundColor Cyan
Write-Host ""

Push-Location $ContractsDir

Write-Host "🔨 Compiling contracts..." -ForegroundColor Yellow
npx hardhat compile

Write-Host ""
Write-Host "🚀 Deploying Vault and Executor..." -ForegroundColor Yellow
npx hardhat run scripts/deploy.js --network $Network

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Contract deployment failed" -ForegroundColor Red
    Pop-Location
    exit 1
}

Write-Host ""
Write-Host "✅ Contracts deployed successfully" -ForegroundColor Green
Write-Host ""

# Check if deployed-addresses.json was created
if (-not (Test-Path "deployed-addresses.json")) {
    Write-Host "❌ Error: deployed-addresses.json not found after deployment" -ForegroundColor Red
    Pop-Location
    exit 1
}

# Read deployed addresses
$DeployedAddresses = Get-Content "deployed-addresses.json" | ConvertFrom-Json
$VaultAddress = $DeployedAddresses.vault
$ExecutorAddress = $DeployedAddresses.executor
$RouterAddress = $DeployedAddresses.router

Write-Host "📍 Deployed Addresses:" -ForegroundColor Yellow
Write-Host "   Vault:    $VaultAddress"
Write-Host "   Executor: $ExecutorAddress"
Write-Host "   Router:   $RouterAddress"
Write-Host ""

Pop-Location

# ============ Step 2: Configure Oracles ============

Write-Host "========================================================================" -ForegroundColor Cyan
Write-Host "🔮 Step 2: Configuring Chainlink Oracle Feeds" -ForegroundColor Cyan
Write-Host "========================================================================" -ForegroundColor Cyan
Write-Host ""

Push-Location $ContractsDir

if (Test-Path "scripts\setup-oracles.js") {
    Write-Host "⚙️  Running oracle setup..." -ForegroundColor Yellow
    npx hardhat run scripts/setup-oracles.js --network $Network
    
    if ($LASTEXITCODE -ne 0) {
        Write-Host "⚠️  Warning: Oracle setup encountered errors" -ForegroundColor Yellow
        Write-Host "   You may need to configure oracles manually"
    } else {
        Write-Host "✅ Oracle feeds configured" -ForegroundColor Green
    }
} else {
    Write-Host "⚠️  Warning: setup-oracles.js not found, skipping oracle configuration" -ForegroundColor Yellow
}

Write-Host ""

Pop-Location

# ============ Step 3: Update Backend Config ============

Write-Host "========================================================================" -ForegroundColor Cyan
Write-Host "⚙️  Step 3: Updating Backend Configuration" -ForegroundColor Cyan
Write-Host "========================================================================" -ForegroundColor Cyan
Write-Host ""

$ConfigFile = "$BackendDir\config\config.json"

if (Test-Path $ConfigFile) {
    Write-Host "📝 Updating config.json with deployed addresses..." -ForegroundColor Yellow
    
    $Config = Get-Content $ConfigFile | ConvertFrom-Json
    $Deployed = Get-Content "$ContractsDir\deployed-addresses.json" | ConvertFrom-Json
    
    $Config.contracts.vaultAddress = $Deployed.vault
    $Config.contracts.executorAddress = $Deployed.executor
    if ($Deployed.router) {
        $Config.contracts.routerAddress = $Deployed.router
    }
    $Config.network.networkName = $Network
    
    $Config | ConvertTo-Json -Depth 10 | Set-Content $ConfigFile
    Write-Host "✅ Configuration updated" -ForegroundColor Green
} else {
    Write-Host "⚠️  Warning: config.json not found, skipping configuration update" -ForegroundColor Yellow
}

Write-Host ""

# ============ Step 4: Start Backend ============

Write-Host "========================================================================" -ForegroundColor Cyan
Write-Host "🤖 Step 4: Starting Backend Trading Engine" -ForegroundColor Cyan
Write-Host "========================================================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "🔄 Starting QIE Sentinel backend in live mode..." -ForegroundColor Yellow
Write-Host ""
Write-Host "📢 Backend will start in 3 seconds..." -ForegroundColor Yellow
Write-Host "   Press Ctrl+C to cancel"
Write-Host ""

Start-Sleep -Seconds 1
Write-Host "   3..."
Start-Sleep -Seconds 1
Write-Host "   2..."
Start-Sleep -Seconds 1
Write-Host "   1..."
Write-Host ""

Push-Location $BackendDir

# Check if using new modular backend
if (Test-Path "index_v2.js") {
    Write-Host "🚀 Starting modular backend (index_v2.js)..." -ForegroundColor Green
    node index_v2.js
} else {
    Write-Host "🚀 Starting backend (index.js)..." -ForegroundColor Green
    node index.js
}

# This line will only be reached if the backend exits
Write-Host ""
Write-Host "========================================================================" -ForegroundColor Cyan
Write-Host "🛑 Backend stopped" -ForegroundColor Cyan
Write-Host "========================================================================" -ForegroundColor Cyan

Pop-Location
