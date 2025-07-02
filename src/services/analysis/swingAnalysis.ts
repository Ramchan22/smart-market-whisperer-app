
// Swing analysis utilities for SMC strategy

export interface SwingPoint {
  index: number;
  price: number;
  type: 'high' | 'low';
  timestamp: number;
}

export interface Candle {
  high: number;
  low: number;
  close: number;
  open: number;
  timestamp: number;
}

// Detect swing highs and lows using 3-candle pattern
export const detectSwingPoints = (candles: Candle[]): SwingPoint[] => {
  const swingPoints: SwingPoint[] = [];
  
  for (let i = 1; i < candles.length - 1; i++) {
    const prev = candles[i - 1];
    const current = candles[i];
    const next = candles[i + 1];
    
    // Swing High: current high > previous high AND current high > next high
    if (current.high > prev.high && current.high > next.high) {
      swingPoints.push({
        index: i,
        price: current.high,
        type: 'high',
        timestamp: current.timestamp
      });
    }
    
    // Swing Low: current low < previous low AND current low < next low
    if (current.low < prev.low && current.low < next.low) {
      swingPoints.push({
        index: i,
        price: current.low,
        type: 'low',
        timestamp: current.timestamp
      });
    }
  }
  
  return swingPoints.sort((a, b) => b.timestamp - a.timestamp);
};

// Determine market structure using swing points
export const getMarketStructure = (candles: Candle[]): 'bullish' | 'bearish' | 'neutral' => {
  const swingPoints = detectSwingPoints(candles);
  
  if (swingPoints.length < 4) {
    return 'neutral';
  }
  
  const recentSwings = swingPoints.slice(0, 4);
  const swingHighs = recentSwings.filter(s => s.type === 'high');
  const swingLows = recentSwings.filter(s => s.type === 'low');
  
  // Need at least 2 swing highs and 2 swing lows for structure analysis
  if (swingHighs.length < 2 || swingLows.length < 2) {
    return 'neutral';
  }
  
  // Sort by timestamp (most recent first)
  swingHighs.sort((a, b) => b.timestamp - a.timestamp);
  swingLows.sort((a, b) => b.timestamp - a.timestamp);
  
  // Bullish: Higher highs and higher lows
  const higherHighs = swingHighs[0].price > swingHighs[1].price;
  const higherLows = swingLows[0].price > swingLows[1].price;
  
  // Bearish: Lower highs and lower lows
  const lowerHighs = swingHighs[0].price < swingHighs[1].price;
  const lowerLows = swingLows[0].price < swingLows[1].price;
  
  if (higherHighs && higherLows) {
    return 'bullish';
  } else if (lowerHighs && lowerLows) {
    return 'bearish';
  }
  
  return 'neutral';
};

// Detect CHOCH (Change of Character) and BOS (Break of Structure)
export const detectCHOCHandBOS = (candles: Candle[], currentStructure: 'bullish' | 'bearish' | 'neutral') => {
  const patterns: Array<{
    type: 'CHOCH' | 'BOS';
    price: number;
    direction: 'buy' | 'sell';
    strength: number;
  }> = [];
  
  const swingPoints = detectSwingPoints(candles);
  
  if (swingPoints.length < 3) {
    return patterns;
  }
  
  const recentCandles = candles.slice(0, 5);
  const currentPrice = recentCandles[0].close;
  
  // Get relevant swing levels
  const recentHighs = swingPoints.filter(s => s.type === 'high').slice(0, 2);
  const recentLows = swingPoints.filter(s => s.type === 'low').slice(0, 2);
  
  if (recentHighs.length >= 1 && recentLows.length >= 1) {
    const lastSwingHigh = recentHighs[0];
    const lastSwingLow = recentLows[0];
    
    // CHOCH Detection
    if (currentStructure === 'bullish') {
      // In uptrend, CHOCH occurs when price breaks below previous swing low
      if (currentPrice < lastSwingLow.price) {
        patterns.push({
          type: 'CHOCH',
          price: lastSwingLow.price,
          direction: 'sell',
          strength: Math.abs(currentPrice - lastSwingLow.price) / lastSwingLow.price
        });
      }
    } else if (currentStructure === 'bearish') {
      // In downtrend, CHOCH occurs when price breaks above previous swing high
      if (currentPrice > lastSwingHigh.price) {
        patterns.push({
          type: 'CHOCH',
          price: lastSwingHigh.price,
          direction: 'buy',
          strength: Math.abs(currentPrice - lastSwingHigh.price) / lastSwingHigh.price
        });
      }
    }
    
    // BOS Detection (Break of Structure in trend direction)
    if (currentStructure === 'bullish' && recentHighs.length >= 2) {
      // Bullish BOS: break above previous swing high
      if (currentPrice > lastSwingHigh.price) {
        patterns.push({
          type: 'BOS',
          price: lastSwingHigh.price,
          direction: 'buy',
          strength: Math.abs(currentPrice - lastSwingHigh.price) / lastSwingHigh.price
        });
      }
    } else if (currentStructure === 'bearish' && recentLows.length >= 2) {
      // Bearish BOS: break below previous swing low
      if (currentPrice < lastSwingLow.price) {
        patterns.push({
          type: 'BOS',
          price: lastSwingLow.price,
          direction: 'sell',
          strength: Math.abs(currentPrice - lastSwingLow.price) / lastSwingLow.price
        });
      }
    }
  }
  
  return patterns;
};

// Check if entry zone has been retested on execution timeframe
export const isEntryZoneRetested = (etfCandles: Candle[], entry: number, stopLoss: number): boolean => {
  const entryZoneHigh = Math.max(entry, stopLoss);
  const entryZoneLow = Math.min(entry, stopLoss);
  
  return etfCandles.some(candle => 
    candle.low <= entryZoneHigh && candle.high >= entryZoneLow
  );
};
