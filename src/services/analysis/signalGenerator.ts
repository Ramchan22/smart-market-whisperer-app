
import { TradeSignal } from '../types/marketTypes';

// Helper function to analyze real price data for signals
export const analyzeMarketData = (timeSeriesData: any, pair: string): TradeSignal[] => {
  const signals: TradeSignal[] = [];
  let idCounter = Math.floor(Math.random() * 1000);

  if (!timeSeriesData || timeSeriesData.length < 5) {
    console.log(`Insufficient data for ${pair}: ${timeSeriesData ? timeSeriesData.length : 0} candles`);
    return signals;
  }

  console.log(`Analyzing ${timeSeriesData.length} candles for ${pair}`);

  // Convert FCS data format with proper timestamp handling
  const recentData = timeSeriesData.slice(0, 10).map((item: any) => {
    const timestamp = Number(item.tm);
    const date = !isNaN(timestamp) ? new Date(timestamp * 1000).toISOString() : "Invalid Date";

    return {
      date,
      open: parseFloat(item.o || 0),
      high: parseFloat(item.h || 0),
      low: parseFloat(item.l || 0),
      close: parseFloat(item.c || 0),
      timestamp: timestamp
    };
  }).filter(data => data.date !== "Invalid Date" && data.close > 0)
    .sort((a, b) => b.timestamp - a.timestamp); // Sort by newest first

  if (recentData.length < 5) {
    console.log(`Not enough valid data for ${pair}: ${recentData.length} valid candles`);
    return signals;
  }

  console.log(`${pair} - Latest price: ${recentData[0].close}, Data points: ${recentData.length}`);

  // Real SMC Analysis based on actual price data
  
  // 1. Identify Market Structure Break (BOS/CHOCH)
  for (let i = 0; i < recentData.length - 3; i++) {
    const current = recentData[i];
    const prev1 = recentData[i + 1];
    const prev2 = recentData[i + 2];
    const prev3 = recentData[i + 3];
    
    // Bullish Break of Structure: Current high > previous highs
    if (current.high > prev1.high && current.high > prev2.high && current.close > current.open) {
      const entry = (current.low + prev1.low) / 2; // Entry at premium zone
      const riskReward = Math.abs(current.high - current.low) / current.close;
      
      if (riskReward > 0.001) { // Minimum volatility requirement
        signals.push({
          id: idCounter++,
          pair,
          direction: 'buy',
          pattern: 'Bullish BOS (Break of Structure)',
          entry: entry.toFixed(pair.includes('JPY') ? 3 : 5),
          stopLoss: (entry * 0.9985).toFixed(pair.includes('JPY') ? 3 : 5),
          takeProfit: (current.high * 1.001).toFixed(pair.includes('JPY') ? 3 : 5),
          probability: riskReward > 0.005 ? 'high' : 'medium',
          timeframe: '1H',
          signalType: 'choch',
          analysisTimeframe: 'primary',
          confirmationStatus: 'confirmed'
        });
        console.log(`Generated Bullish BOS signal for ${pair} at ${entry}`);
      }
    }
    
    // Bearish Break of Structure: Current low < previous lows
    if (current.low < prev1.low && current.low < prev2.low && current.close < current.open) {
      const entry = (current.high + prev1.high) / 2; // Entry at discount zone
      const riskReward = Math.abs(current.high - current.low) / current.close;
      
      if (riskReward > 0.001) {
        signals.push({
          id: idCounter++,
          pair,
          direction: 'sell',
          pattern: 'Bearish BOS (Break of Structure)',
          entry: entry.toFixed(pair.includes('JPY') ? 3 : 5),
          stopLoss: (entry * 1.0015).toFixed(pair.includes('JPY') ? 3 : 5),
          takeProfit: (current.low * 0.999).toFixed(pair.includes('JPY') ? 3 : 5),
          probability: riskReward > 0.005 ? 'high' : 'medium',
          timeframe: '1H',
          signalType: 'choch',
          analysisTimeframe: 'primary',
          confirmationStatus: 'confirmed'
        });
        console.log(`Generated Bearish BOS signal for ${pair} at ${entry}`);
      }
    }
  }

  // 2. Real Fair Value Gap Analysis
  for (let i = 0; i < recentData.length - 2; i++) {
    const candle1 = recentData[i];
    const candle2 = recentData[i + 1];
    const candle3 = recentData[i + 2];
    
    // Bullish FVG: candle1.low > candle3.high (gap between them)
    if (candle1.low > candle3.high) {
      const gapSize = candle1.low - candle3.high;
      const gapSizePercent = gapSize / candle2.close;
      
      if (gapSizePercent > 0.0005) { // Minimum gap size
        const gapMidpoint = (candle1.low + candle3.high) / 2;
        signals.push({
          id: idCounter++,
          pair,
          direction: 'buy',
          pattern: `Bullish FVG (${(gapSizePercent * 100).toFixed(3)}% gap)`,
          entry: gapMidpoint.toFixed(pair.includes('JPY') ? 3 : 5),
          stopLoss: candle3.high.toFixed(pair.includes('JPY') ? 3 : 5),
          takeProfit: (candle1.low + gapSize * 2).toFixed(pair.includes('JPY') ? 3 : 5),
          probability: gapSizePercent > 0.002 ? 'high' : 'medium',
          timeframe: '1H',
          signalType: 'discount',
          analysisTimeframe: 'primary',
          confirmationStatus: 'pending',
          fibLevel: '61.8%'
        });
        console.log(`Generated Bullish FVG signal for ${pair}, gap: ${(gapSizePercent * 100).toFixed(3)}%`);
      }
    }
    
    // Bearish FVG: candle1.high < candle3.low
    if (candle1.high < candle3.low) {
      const gapSize = candle3.low - candle1.high;
      const gapSizePercent = gapSize / candle2.close;
      
      if (gapSizePercent > 0.0005) {
        const gapMidpoint = (candle1.high + candle3.low) / 2;
        signals.push({
          id: idCounter++,
          pair,
          direction: 'sell',
          pattern: `Bearish FVG (${(gapSizePercent * 100).toFixed(3)}% gap)`,
          entry: gapMidpoint.toFixed(pair.includes('JPY') ? 3 : 5),
          stopLoss: candle3.low.toFixed(pair.includes('JPY') ? 3 : 5),
          takeProfit: (candle1.high - gapSize * 2).toFixed(pair.includes('JPY') ? 3 : 5),
          probability: gapSizePercent > 0.002 ? 'high' : 'medium',
          timeframe: '1H',
          signalType: 'premium',
          analysisTimeframe: 'primary',
          confirmationStatus: 'pending',
          fibLevel: '61.8%'
        });
        console.log(`Generated Bearish FVG signal for ${pair}, gap: ${(gapSizePercent * 100).toFixed(3)}%`);
      }
    }
  }

  // 3. Order Block Detection (Strong rejection candles)
  for (let i = 0; i < recentData.length - 1; i++) {
    const candle = recentData[i];
    const nextCandle = recentData[i + 1];
    
    const bodySize = Math.abs(candle.close - candle.open);
    const totalRange = candle.high - candle.low;
    const bodyRatio = totalRange > 0 ? bodySize / totalRange : 0;
    
    // Strong bullish candle with good body ratio
    if (candle.close > candle.open && bodyRatio > 0.6 && bodySize / candle.close > 0.002) {
      // Check if next candle shows some rejection or continuation
      const priceMove = Math.abs(nextCandle.close - candle.close) / candle.close;
      
      if (priceMove > 0.001) {
        signals.push({
          id: idCounter++,
          pair,
          direction: 'buy',
          pattern: `Bullish Order Block (${(bodyRatio * 100).toFixed(1)}% body)`,
          entry: candle.open.toFixed(pair.includes('JPY') ? 3 : 5),
          stopLoss: (candle.low * 0.9995).toFixed(pair.includes('JPY') ? 3 : 5),
          takeProfit: (candle.high * 1.002).toFixed(pair.includes('JPY') ? 3 : 5),
          probability: bodyRatio > 0.8 ? 'high' : 'medium',
          timeframe: '4H',
          signalType: 'discount',
          analysisTimeframe: 'primary',
          confirmationStatus: 'watching'
        });
        console.log(`Generated Bullish OB signal for ${pair}, body ratio: ${(bodyRatio * 100).toFixed(1)}%`);
      }
    }
    
    // Strong bearish candle
    if (candle.close < candle.open && bodyRatio > 0.6 && bodySize / candle.close > 0.002) {
      const priceMove = Math.abs(nextCandle.close - candle.close) / candle.close;
      
      if (priceMove > 0.001) {
        signals.push({
          id: idCounter++,
          pair,
          direction: 'sell',
          pattern: `Bearish Order Block (${(bodyRatio * 100).toFixed(1)}% body)`,
          entry: candle.open.toFixed(pair.includes('JPY') ? 3 : 5),
          stopLoss: (candle.high * 1.0005).toFixed(pair.includes('JPY') ? 3 : 5),
          takeProfit: (candle.low * 0.998).toFixed(pair.includes('JPY') ? 3 : 5),
          probability: bodyRatio > 0.8 ? 'high' : 'medium',
          timeframe: '4H',
          signalType: 'premium',
          analysisTimeframe: 'primary',
          confirmationStatus: 'watching'
        });
        console.log(`Generated Bearish OB signal for ${pair}, body ratio: ${(bodyRatio * 100).toFixed(1)}%`);
      }
    }
  }

  // 4. Liquidity Grab Detection (Wicks taking out previous highs/lows)
  for (let i = 0; i < recentData.length - 2; i++) {
    const current = recentData[i];
    const prev1 = recentData[i + 1];
    const prev2 = recentData[i + 2];
    
    // Bullish liquidity grab: High wick takes out previous high, then closes lower
    if (current.high > prev1.high && current.high > prev2.high && current.close < current.high * 0.998) {
      const wickSize = current.high - Math.max(current.open, current.close);
      const wickPercent = wickSize / current.close;
      
      if (wickPercent > 0.001) {
        signals.push({
          id: idCounter++,
          pair,
          direction: 'sell',
          pattern: `Liquidity Grab High (${(wickPercent * 100).toFixed(2)}% wick)`,
          entry: (current.high * 0.9995).toFixed(pair.includes('JPY') ? 3 : 5),
          stopLoss: current.high.toFixed(pair.includes('JPY') ? 3 : 5),
          takeProfit: (current.close * 0.998).toFixed(pair.includes('JPY') ? 3 : 5),
          probability: wickPercent > 0.003 ? 'high' : 'medium',
          timeframe: '1H',
          signalType: 'liquidity-grab',
          analysisTimeframe: 'secondary',
          confirmationStatus: 'confirmed'
        });
        console.log(`Generated Liquidity Grab High signal for ${pair}, wick: ${(wickPercent * 100).toFixed(2)}%`);
      }
    }
    
    // Bearish liquidity grab: Low wick takes out previous low, then closes higher
    if (current.low < prev1.low && current.low < prev2.low && current.close > current.low * 1.002) {
      const wickSize = Math.min(current.open, current.close) - current.low;
      const wickPercent = wickSize / current.close;
      
      if (wickPercent > 0.001) {
        signals.push({
          id: idCounter++,
          pair,
          direction: 'buy',
          pattern: `Liquidity Grab Low (${(wickPercent * 100).toFixed(2)}% wick)`,
          entry: (current.low * 1.0005).toFixed(pair.includes('JPY') ? 3 : 5),
          stopLoss: current.low.toFixed(pair.includes('JPY') ? 3 : 5),
          takeProfit: (current.close * 1.002).toFixed(pair.includes('JPY') ? 3 : 5),
          probability: wickPercent > 0.003 ? 'high' : 'medium',
          timeframe: '1H',
          signalType: 'liquidity-grab',
          analysisTimeframe: 'secondary',
          confirmationStatus: 'confirmed'
        });
        console.log(`Generated Liquidity Grab Low signal for ${pair}, wick: ${(wickPercent * 100).toFixed(2)}%`);
      }
    }
  }

  console.log(`Generated ${signals.length} real SMC signals for ${pair} based on live market data`);
  return signals;
};
