/**
 * Risk Manager - Trading risk protection and safety systems
 * 
 * Implements:
 * - Kill switch after consecutive failures
 * - Daily loss limits
 * - Slippage detection
 * - Loss streak prevention
 * - Overtrading protection
 */

const fs = require('fs');
const path = require('path');
const { getInstance } = require('./data_access');

class RiskManager {
  constructor(config = {}) {
    this.dataAccess = getInstance();
    this.config = config;
    this.stateFile = path.join(__dirname, 'config', 'risk_state.json');
    this.state = this._loadState();
  }

  /**
   * Load risk state from persistent storage
   * @private
   */
  _loadState() {
    try {
      if (fs.existsSync(this.stateFile)) {
        return JSON.parse(fs.readFileSync(this.stateFile, 'utf8'));
      }
    } catch (error) {
      console.error(`⚠️  Error loading risk state: ${error.message}`);
    }

    // Default state
    return {
      killSwitchActive: false,
      consecutiveFailures: 0,
      dailyLoss: 0,
      lastResetDate: new Date().toISOString().split('T')[0],
      lossStreak: 0,
      lastTradeTimestamps: {},
      tradeCount: 0,
      startBalance: 0,
      currentBalance: 0
    };
  }

  /**
   * Persist risk state to storage
   * @private
   */
  _saveState() {
    try {
      const dir = path.dirname(this.stateFile);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      fs.writeFileSync(this.stateFile, JSON.stringify(this.state, null, 2), 'utf8');
    } catch (error) {
      console.error(`❌ Error saving risk state: ${error.message}`);
    }
  }

  /**
   * Check if trading is allowed
   * @param {String} asset - Asset identifier
   * @param {String} userId - User identifier
   * @returns {Object} {allowed: boolean, reason: string}
   */
  canTrade(asset, userId = 'default') {
    // Check kill switch
    if (this.state.killSwitchActive) {
      return {
        allowed: false,
        reason: 'Kill switch activated due to consecutive failures'
      };
    }

    // Check daily loss limit
    if (this.config.maxDailyLossPercent) {
      this._checkDailyReset();
      
      if (this.state.dailyLoss >= this.config.maxDailyLossPercent) {
        return {
          allowed: false,
          reason: `Daily loss limit exceeded: ${this.state.dailyLoss.toFixed(2)}%`
        };
      }
    }

    // Check loss streak
    if (this.config.enableLossStreakProtection && this.config.maxLossStreak) {
      if (this.state.lossStreak >= this.config.maxLossStreak) {
        return {
          allowed: false,
          reason: `Loss streak protection: ${this.state.lossStreak} consecutive losses`
        };
      }
    }

    // Check overtrading protection
    if (this.config.enableOvertradingProtection && this.config.minTimeBetweenTradesSeconds) {
      const key = `${userId}_${asset}`;
      const lastTradeTime = this.state.lastTradeTimestamps[key];
      
      if (lastTradeTime) {
        const timeSince = (Date.now() - lastTradeTime) / 1000;
        
        if (timeSince < this.config.minTimeBetweenTradesSeconds) {
          return {
            allowed: false,
            reason: `Overtrading protection: ${(this.config.minTimeBetweenTradesSeconds - timeSince).toFixed(0)}s until next trade`
          };
        }
      }
    }

    return { allowed: true, reason: 'All risk checks passed' };
  }

  /**
   * Record successful trade
   * @param {Object} tradeData - Trade information
   */
  recordSuccess(tradeData) {
    // Reset consecutive failures
    this.state.consecutiveFailures = 0;
    
    // Update last trade timestamp
    const key = `${tradeData.userId || 'default'}_${tradeData.asset}`;
    this.state.lastTradeTimestamps[key] = Date.now();
    
    this.state.tradeCount++;
    
    // Handle win/loss tracking
    if (tradeData.profit !== undefined) {
      if (tradeData.profit < 0) {
        this.state.lossStreak++;
        this.state.dailyLoss += Math.abs(tradeData.profitPercent || 0);
      } else {
        this.state.lossStreak = 0;
      }
    }
    
    this._saveState();
    
    console.log(`✅ Risk Manager: Trade recorded successfully`);
  }

  /**
   * Record failed trade
   * @param {Object} errorData - Error information
   */
  recordFailure(errorData) {
    // 🔧 NEW: Distinguish between funding errors and logic errors
    const isFundingError = errorData.isFundingError || 
                          (errorData.reason && errorData.reason.includes('FUNDING_ISSUE'));
    
    if (isFundingError) {
      console.log(`⚠️  Risk Manager: Funding error detected - NOT counting towards kill switch`);
      console.log(`   💡 Reason: ${errorData.reason}`);
      console.log(`   💡 Action: Run setup_funding.js to resolve`);
      
      // Don't increment consecutive failures for funding issues
      this._saveState();
      return;
    }
    
    // Only count logic/execution errors
    this.state.consecutiveFailures++;
    
    console.log(`⚠️  Risk Manager: Logic failure recorded (${this.state.consecutiveFailures}/${this.config.maxConsecutiveFailures})`);
    
    // Check if kill switch should be activated
    if (this.config.enableKillSwitch && this.state.consecutiveFailures >= this.config.maxConsecutiveFailures) {
      this.activateKillSwitch(errorData.reason);
    }
    
    this._saveState();
  }

  /**
   * Activate kill switch
   * @param {String} reason - Reason for activation
   */
  activateKillSwitch(reason = 'Unknown') {
    this.state.killSwitchActive = true;
    this._saveState();
    
    console.error(`🚨 KILL SWITCH ACTIVATED: ${reason}`);
    console.error(`   Consecutive failures: ${this.state.consecutiveFailures}`);
    console.error(`   Trading has been halted. Manual intervention required.`);
    
    // TODO: Send alert notification (Discord/Telegram/Email)
  }

  /**
   * Deactivate kill switch (manual intervention)
   */
  deactivateKillSwitch() {
    this.state.killSwitchActive = false;
    this.state.consecutiveFailures = 0;
    this._saveState();
    
    console.log(`✅ Kill switch deactivated. Trading resumed.`);
  }

  /**
   * Check and reset daily metrics if new day
   * @private
   */
  _checkDailyReset() {
    const today = new Date().toISOString().split('T')[0];
    
    if (this.state.lastResetDate !== today) {
      console.log(`📅 Daily reset: New trading day started`);
      this.state.dailyLoss = 0;
      this.state.lastResetDate = today;
      this.state.tradeCount = 0;
      this._saveState();
    }
  }

  /**
   * Validate slippage against oracle price
   * @param {Number} expectedPrice - Oracle fair price
   * @param {Number} executionPrice - Actual execution price
   * @param {String} direction - 'BUY' or 'SELL'
   * @returns {Object} {valid: boolean, slippageBps: number}
   */
  validateSlippage(expectedPrice, executionPrice, direction) {
    if (!expectedPrice || !executionPrice) {
      return { valid: false, slippageBps: 0, reason: 'Invalid prices' };
    }

    const slippageBps = Math.abs((executionPrice - expectedPrice) / expectedPrice * 10000);
    
    const maxSlippage = this.config.maxSlippageBps || 1000;
    
    if (slippageBps > maxSlippage) {
      return {
        valid: false,
        slippageBps: slippageBps.toFixed(0),
        reason: `Slippage ${slippageBps.toFixed(0)}bps exceeds limit ${maxSlippage}bps`
      };
    }

    return {
      valid: true,
      slippageBps: slippageBps.toFixed(0),
      reason: 'Slippage within tolerance'
    };
  }

  /**
   * Update balance tracking
   * @param {Number} balance - Current balance
   */
  updateBalance(balance) {
    if (this.state.startBalance === 0) {
      this.state.startBalance = balance;
    }
    
    this.state.currentBalance = balance;
    
    // Calculate daily loss percentage
    if (this.state.startBalance > 0) {
      const lossPercent = ((this.state.startBalance - balance) / this.state.startBalance) * 100;
      this.state.dailyLoss = Math.max(0, lossPercent);
    }
    
    this._saveState();
  }

  /**
   * Get current risk status
   * @returns {Object} Risk status summary
   */
  getStatus() {
    return {
      killSwitchActive: this.state.killSwitchActive,
      consecutiveFailures: this.state.consecutiveFailures,
      dailyLoss: this.state.dailyLoss.toFixed(2) + '%',
      lossStreak: this.state.lossStreak,
      tradeCount: this.state.tradeCount,
      lastResetDate: this.state.lastResetDate,
      tradingAllowed: !this.state.killSwitchActive && this.state.dailyLoss < (this.config.maxDailyLossPercent || 5)
    };
  }

  /**
   * Reset all risk metrics (use with caution)
   */
  reset() {
    this.state = {
      killSwitchActive: false,
      consecutiveFailures: 0,
      dailyLoss: 0,
      lastResetDate: new Date().toISOString().split('T')[0],
      lossStreak: 0,
      lastTradeTimestamps: {},
      tradeCount: 0,
      startBalance: 0,
      currentBalance: 0
    };
    this._saveState();
    console.log(`♻️  Risk Manager: All metrics reset`);
  }
}

// ============ Module Export ============

module.exports = RiskManager;
