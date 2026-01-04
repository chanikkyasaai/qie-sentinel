"""
Quick test for Python AI Engine - standalone mode
Tests signal generation with sample price data
"""

import json
from signal_engine import generate_signal, calculate_rsi, calculate_sma

print("🧪 Testing Python AI Engine")
print("=" * 60)

# Test 1: Insufficient data
print("\n Test 1: Insufficient price history")
prices_1 = [100.0]
signal_1 = generate_signal(prices_1)
print(f"   Prices: {prices_1}")
print(f"   Signal: {signal_1}")
print(f"   ✅ Expected: HOLD, Got: {signal_1}" if signal_1 == 'HOLD' else f"   ❌ Expected HOLD, got {signal_1}")

# Test 2: Bullish momentum
print("\n📈 Test 2: Strong upward momentum (should BUY)")
prices_2 = [95.0, 96.5, 98.0, 100.0, 102.5]
signal_2 = generate_signal(prices_2)
print(f"   Prices: {prices_2}")
print(f"   Signal: {signal_2}")
print(f"   ✅ Expected: BUY, Got: {signal_2}" if signal_2 == 'BUY' else f"   ⚠️  Expected BUY, got {signal_2}")

# Test 3: Bearish momentum
print("\n📉 Test 3: Strong downward momentum (should SELL)")
prices_3 = [105.0, 103.0, 101.0, 98.5, 96.0]
signal_3 = generate_signal(prices_3)
print(f"   Prices: {prices_3}")
print(f"   Signal: {signal_3}")
print(f"   ✅ Expected: SELL, Got: {signal_3}" if signal_3 == 'SELL' else f"   ⚠️  Expected SELL, got {signal_3}")

# Test 4: Sideways (should HOLD)
print("\n↔️  Test 4: Sideways movement (should HOLD)")
prices_4 = [100.0, 100.5, 99.8, 100.2, 99.9, 100.1, 100.0]
signal_4 = generate_signal(prices_4)
print(f"   Prices: {prices_4}")
print(f"   Signal: {signal_4}")
print(f"   ✅ Expected: HOLD, Got: {signal_4}" if signal_4 == 'HOLD' else f"   ⚠️  Expected HOLD, got {signal_4}")

# Test 5: Longer history with RSI oversold
print("\n📊 Test 5: RSI oversold scenario (should BUY)")
prices_5 = [100] + [100 - i for i in range(15)]  # Declining prices
signal_5 = generate_signal(prices_5)
rsi_5 = calculate_rsi(prices_5)
print(f"   Prices: {prices_5[:5]}... (15 samples)")
print(f"   RSI: {rsi_5:.2f}")
print(f"   Signal: {signal_5}")
print(f"   ✅ RSI < 30: {rsi_5 < 30}")

# Test 6: SMA crossover
print("\n📈 Test 6: SMA bullish crossover (should BUY)")
prices_6 = [95, 96, 97, 98, 99, 100, 101, 102, 104, 106, 108, 110]
sma_short_6 = calculate_sma(prices_6, 5)
sma_long_6 = calculate_sma(prices_6, 10)
signal_6 = generate_signal(prices_6)
print(f"   SMA(5): {sma_short_6:.2f}")
print(f"   SMA(10): {sma_long_6:.2f}")
print(f"   Ratio: {(sma_short_6/sma_long_6):.4f}")
print(f"   Signal: {signal_6}")
print(f"   ✅ Bullish: {sma_short_6 > sma_long_6 * 1.02}")

print("\n" + "=" * 60)
print("✅ All tests completed!")
print("\n💡 To test full integration:")
print("   1. Start Hardhat node: cd contracts && npm run node")
print("   2. Deploy contracts: npm run deploy:local")
print("   3. Run backend: cd ../backend/node && node index.js")
