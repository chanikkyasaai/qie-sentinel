const fs = require('fs');
const path = require('path');

console.log("🔄 Resetting Kill Switch...\n");

const riskFilePath = path.join(__dirname, 'config/risk_state.json');

try {
  // Ensure config directory exists
  const configDir = path.join(__dirname, 'config');
  if (!fs.existsSync(configDir)) {
    fs.mkdirSync(configDir, { recursive: true });
  }
  
  // Delete old state file to force fresh start
  if (fs.existsSync(riskFilePath)) {
    fs.unlinkSync(riskFilePath);
    console.log("🗑️  Deleted old risk state file");
  }
  
  // Create fresh state with kill switch OFF
  let riskData = { 
    killSwitchActive: false, 
    consecutiveFailures: 0,
    dailyLoss: 0,
    lossStreak: 0,
    lastTradeTimestamps: {},
    lastResetDate: new Date().toISOString().split('T')[0]
  };
  
  // Write fresh state
  fs.writeFileSync(riskFilePath, JSON.stringify(riskData, null, 2));
  
  console.log("✅ Kill switch has been reset!");
  console.log("   - Kill switch: INACTIVE");
  console.log("   - Consecutive failures: 0\n");
  console.log("🚀 You can now restart the bot: node index_v2.js");
  
} catch (error) {
  console.error("❌ Failed to reset kill switch:", error.message);
}
