/**
 * Strategy Resolver - Multi-strategy trading signal generation
 * 
 * Implements:
 * 1. RSI + SMA Crossover (existing)
 * 2. Volatility Breakout (Bollinger Bands)
 * 3. Momentum Trend Following (MACD-style)
 */

const { getInstance } = require('./data_access');

class StrategyResolver {
  constructor() {
    this.dataAccess = getInstance();
    this.strategies = null;
    this.loadStrategies();
  }

  /**
   * Load strategy configuration
   */
  async loadStrategies() {
    this.strategies = await this.dataAccess.read('config.strategies');
    if (!this.strategies) {
      console.error('❌ Failed to load strategies configuration');
      this.strategies = { strategies: [], defaultStrategy: 1 };
    }
  }

  /**
   * Get trading signal using specified strategy
   * @param {Number} strategyId - Strategy ID to use
   * @param {Array} priceHistory - Historical prices
   * @param {String} asset - Asset identifier
   * @returns {Object} {signal: string, reason: string, confidence: number}
   */
  async getSignal(strategyId, priceHistory, asset = 'unknown') {
    if (!this.strategies) {
      await this.loadStrategies();
    }

    const strategy = this.strategies.strategies.find(s => s.id === strategyId);
    
    if (!strategy || !strategy.enabled) {
      console.warn(`⚠️  Strategy ${strategyId} not found or disabled, using default`);
      return this.getSignal(this.strategies.defaultStrategy, priceHistory, asset);
    }

    // Insufficient data check
    if (priceHistory.length < 15) {
      return {
        signal: 'HOLD',
        reason: 'Insufficient price history',
        confidence: 0,
        strategyId,
        strategyName: strategy.name
      };
    }

    // Route to appropriate strategy implementation
    switch (strategyId) {
      case 1:
        return this._strategyRSI_SMA(priceHistory, strategy.parameters);
      case 2:
        return this._strategyBollingerBands(priceHistory, strategy.parameters);
      case 3:
        return this._strategyMACD(priceHistory, strategy.parameters);
      default:
        return {
          signal: 'HOLD',
          reason: 'Unknown strategy',
          confidence: 0,
          strategyId,
          strategyName: 'Unknown'
        };
    }
  }

  /**
   * Strategy 1: RSI + SMA Crossover
   * @private
   */
  _strategyRSI_SMA(prices, params) {
    const rsi = this._calculateRSI(prices, params.rsi_period || 14);
    const smaFast = this._calculateSMA(prices, params.sma_fast || 5);
    const smaSlow = this._calculateSMA(prices, params.sma_slow || 10);
    const momentum = this._calculateMomentum(prices, 3);

    const currentPrice = prices[prices.length - 1];
    const momentumPercent = (momentum / currentPrice) * 100;

    // RSI-based signals
    if (rsi < params.rsi_oversold) {
      return {
        signal: 'BUY',
        reason: `RSI oversold: ${rsi.toFixed(2)}`,
        confidence: 0.85,
        strategyId: 1,
        strategyName: 'RSI + SMA Crossover',
        indicators: { rsi, smaFast, smaSlow, momentumPercent }
      };
    }

    if (rsi > params.rsi_overbought) {
      return {
        signal: 'SELL',
        reason: `RSI overbought: ${rsi.toFixed(2)}`,
        confidence: 0.85,
        strategyId: 1,
        strategyName: 'RSI + SMA Crossover',
        indicators: { rsi, smaFast, smaSlow, momentumPercent }
      };
    }

    // SMA crossover
    if (smaFast > smaSlow && momentumPercent > params.momentum_threshold) {
      return {
        signal: 'BUY',
        reason: `Bullish SMA crossover + momentum: ${momentumPercent.toFixed(2)}%`,
        confidence: 0.75,
        strategyId: 1,
        strategyName: 'RSI + SMA Crossover',
        indicators: { rsi, smaFast, smaSlow, momentumPercent }
      };
    }

    if (smaFast < smaSlow && momentumPercent < -params.momentum_threshold) {
      return {
        signal: 'SELL',
        reason: `Bearish SMA crossover + momentum: ${momentumPercent.toFixed(2)}%`,
        confidence: 0.75,
        strategyId: 1,
        strategyName: 'RSI + SMA Crossover',
        indicators: { rsi, smaFast, smaSlow, momentumPercent }
      };
    }

    return {
      signal: 'HOLD',
      reason: 'No clear signal',
      confidence: 0,
      strategyId: 1,
      strategyName: 'RSI + SMA Crossover',
      indicators: { rsi, smaFast, smaSlow, momentumPercent }
    };
  }

  /**
   * Strategy 2: Bollinger Bands Breakout
   * @private
   */
  _strategyBollingerBands(prices, params) {
    const period = params.period || 20;
    const stdDevMultiplier = params.std_dev_multiplier || 2.0;
    const breakoutThreshold = params.breakout_threshold || 0.8;

    if (prices.length < period) {
      return {
        signal: 'HOLD',
        reason: 'Insufficient data for Bollinger Bands',
        confidence: 0,
        strategyId: 2,
        strategyName: 'Volatility Breakout'
      };
    }

    const sma = this._calculateSMA(prices, period);
    const stdDev = this._calculateStdDev(prices, period);
    
    const upperBand = sma + (stdDev * stdDevMultiplier);
    const lowerBand = sma - (stdDev * stdDevMultiplier);
    const currentPrice = prices[prices.length - 1];

    // Calculate position within bands
    const bandRange = upperBand - lowerBand;
    const positionInBand = (currentPrice - lowerBand) / bandRange;

    // Lower band touch (buy signal)
    if (positionInBand <= breakoutThreshold * 0.5) {
      return {
        signal: 'BUY',
        reason: `Price near lower Bollinger Band: ${currentPrice.toFixed(2)} vs ${lowerBand.toFixed(2)}`,
        confidence: 0.80,
        strategyId: 2,
        strategyName: 'Volatility Breakout',
        indicators: { upperBand, lowerBand, sma, currentPrice, positionInBand: positionInBand.toFixed(2) }
      };
    }

    // Upper band touch (sell signal)
    if (positionInBand >= (1 - breakoutThreshold * 0.5)) {
      return {
        signal: 'SELL',
        reason: `Price near upper Bollinger Band: ${currentPrice.toFixed(2)} vs ${upperBand.toFixed(2)}`,
        confidence: 0.80,
        strategyId: 2,
        strategyName: 'Volatility Breakout',
        indicators: { upperBand, lowerBand, sma, currentPrice, positionInBand: positionInBand.toFixed(2) }
      };
    }

    return {
      signal: 'HOLD',
      reason: `Price within bands (${(positionInBand * 100).toFixed(0)}%)`,
      confidence: 0,
      strategyId: 2,
      strategyName: 'Volatility Breakout',
      indicators: { upperBand, lowerBand, sma, currentPrice, positionInBand: positionInBand.toFixed(2) }
    };
  }

  /**
   * Strategy 3: MACD-style Momentum
   * @private
   */
  _strategyMACD(prices, params) {
    const fastPeriod = params.fast_ema || 12;
    const slowPeriod = params.slow_ema || 26;
    const signalPeriod = params.signal_line || 9;
    const histogramThreshold = params.histogram_threshold || 0.5;

    if (prices.length < slowPeriod + signalPeriod) {
      return {
        signal: 'HOLD',
        reason: 'Insufficient data for MACD',
        confidence: 0,
        strategyId: 3,
        strategyName: 'Momentum Trend Following'
      };
    }

    const fastEMA = this._calculateEMA(prices, fastPeriod);
    const slowEMA = this._calculateEMA(prices, slowPeriod);
    const macdLine = fastEMA - slowEMA;

    // Simplified signal line (would need historical MACD values for true signal line)
    const recentPrices = prices.slice(-signalPeriod);
    const signalLine = this._calculateSMA(recentPrices, signalPeriod);
    const currentPrice = prices[prices.length - 1];
    const histogram = ((macdLine / currentPrice) * 100); // Normalized histogram

    // MACD crossover signals
    if (histogram > histogramThreshold) {
      return {
        signal: 'BUY',
        reason: `Bullish MACD histogram: ${histogram.toFixed(2)}%`,
        confidence: 0.78,
        strategyId: 3,
        strategyName: 'Momentum Trend Following',
        indicators: { fastEMA, slowEMA, macdLine: macdLine.toFixed(2), histogram: histogram.toFixed(2) }
      };
    }

    if (histogram < -histogramThreshold) {
      return {
        signal: 'SELL',
        reason: `Bearish MACD histogram: ${histogram.toFixed(2)}%`,
        confidence: 0.78,
        strategyId: 3,
        strategyName: 'Momentum Trend Following',
        indicators: { fastEMA, slowEMA, macdLine: macdLine.toFixed(2), histogram: histogram.toFixed(2) }
      };
    }

    return {
      signal: 'HOLD',
      reason: `MACD neutral: ${histogram.toFixed(2)}%`,
      confidence: 0,
      strategyId: 3,
      strategyName: 'Momentum Trend Following',
      indicators: { fastEMA, slowEMA, macdLine: macdLine.toFixed(2), histogram: histogram.toFixed(2) }
    };
  }

  /**
   * Calculate RSI
   * @private
   */
  _calculateRSI(prices, period = 14) {
    if (prices.length < period + 1) return 50;

    let gains = 0;
    let losses = 0;

    for (let i = prices.length - period; i < prices.length; i++) {
      const change = prices[i] - prices[i - 1];
      if (change > 0) {
        gains += change;
      } else {
        losses += Math.abs(change);
      }
    }

    const avgGain = gains / period;
    const avgLoss = losses / period;

    if (avgLoss === 0) return 100;

    const rs = avgGain / avgLoss;
    return 100 - (100 / (1 + rs));
  }

  /**
   * Calculate Simple Moving Average
   * @private
   */
  _calculateSMA(prices, period) {
    const relevantPrices = prices.slice(-period);
    return relevantPrices.reduce((a, b) => a + b, 0) / relevantPrices.length;
  }

  /**
   * Calculate Exponential Moving Average
   * @private
   */
  _calculateEMA(prices, period) {
    if (prices.length < period) {
      return this._calculateSMA(prices, prices.length);
    }

    const k = 2 / (period + 1);
    let ema = this._calculateSMA(prices.slice(0, period), period);

    for (let i = period; i < prices.length; i++) {
      ema = (prices[i] * k) + (ema * (1 - k));
    }

    return ema;
  }

  /**
   * Calculate Standard Deviation
   * @private
   */
  _calculateStdDev(prices, period) {
    const relevantPrices = prices.slice(-period);
    const mean = this._calculateSMA(relevantPrices, period);
    
    const squaredDiffs = relevantPrices.map(price => Math.pow(price - mean, 2));
    const variance = squaredDiffs.reduce((a, b) => a + b, 0) / period;
    
    return Math.sqrt(variance);
  }

  /**
   * Calculate Momentum
   * @private
   */
  _calculateMomentum(prices, period = 3) {
    if (prices.length < period) return 0;
    return prices[prices.length - 1] - prices[prices.length - period];
  }

  /**
   * Get enabled strategies
   * @returns {Array} List of enabled strategies
   */
  getEnabledStrategies() {
    if (!this.strategies) return [];
    return this.strategies.strategies.filter(s => s.enabled);
  }
}

// ============ Module Export ============

module.exports = StrategyResolver;
