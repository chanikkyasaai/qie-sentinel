"""
QIE Sentinel - AI Signal Engine
Generates trading signals based on market data and AI analysis

Input: JSON array of price history via stdin
Output: Signal string (BUY, SELL, HOLD) via stdout
"""

import sys
import json
import numpy as np

def calculate_sma(prices, period):
    """Calculate Simple Moving Average"""
    if len(prices) < period:
        return None
    return np.mean(prices[-period:])

def calculate_rsi(prices, period=14):
    """Calculate Relative Strength Index"""
    if len(prices) < period + 1:
        return 50.0  # Neutral
    
    deltas = np.diff(prices[-period-1:])
    gains = deltas.copy()
    losses = deltas.copy()
    gains[gains < 0] = 0
    losses[losses > 0] = 0
    losses = abs(losses)
    
    avg_gain = np.mean(gains)
    avg_loss = np.mean(losses)
    
    if avg_loss == 0:
        return 100.0
    
    rs = avg_gain / avg_loss
    rsi = 100 - (100 / (1 + rs))
    return rsi

def generate_signal(price_history):
    """
    Generate trading signal based on AI/technical analysis
    
    Args:
        price_history: List of recent prices
        
    Returns:
        String: 'BUY', 'SELL', or 'HOLD'
    """
    if len(price_history) < 2:
        return 'HOLD'
    
    # Current and recent prices
    current_price = price_history[-1]
    
    # Calculate technical indicators
    if len(price_history) >= 10:
        sma_short = calculate_sma(price_history, 5)
        sma_long = calculate_sma(price_history, 10)
        rsi = calculate_rsi(price_history)
        
        # AI Decision Logic (simplified)
        # TODO: Replace with actual ML model prediction
        
        # RSI-based signals
        if rsi < 30:  # Oversold
            return 'BUY'
        elif rsi > 70:  # Overbought
            return 'SELL'
        
        # SMA crossover strategy
        if sma_short and sma_long:
            if sma_short > sma_long * 1.02:  # 2% above
                return 'BUY'
            elif sma_short < sma_long * 0.98:  # 2% below
                return 'SELL'
    else:
        # Simple momentum for short history
        if len(price_history) >= 3:
            price_change = (current_price - price_history[-3]) / price_history[-3]
            
            if price_change > 0.03:  # 3% increase
                return 'BUY'
            elif price_change < -0.03:  # 3% decrease
                return 'SELL'
    
    return 'HOLD'

def main():
    """
    Main loop: Read price history from stdin, output signal to stdout
    """
    # Signal that we're ready
    print("READY", flush=True)
    
    # Continuous loop waiting for price data
    for line in sys.stdin:
        try:
            # Parse incoming JSON price history
            data = json.loads(line.strip())
            price_history = data.get('prices', [])
            
            # Generate signal
            signal = generate_signal(price_history)
            
            # Output signal (Node.js will read this)
            print(signal, flush=True)
            
        except json.JSONDecodeError as e:
            # Error in JSON parsing
            print(f"ERROR: Invalid JSON - {str(e)}", flush=True)
        except Exception as e:
            # Any other error - output HOLD to prevent crash
            print(f"ERROR: {str(e)}", flush=True)
            print("HOLD", flush=True)

if __name__ == "__main__":
    main()
