
import { marketDataService } from './marketDataService';

export interface SMCTradeSetup {
  id: number;
  pair: string;
  strategy: 'primary' | 'fallback';
  direction: 'buy' | 'sell';
  pattern: string;
  higherTimeframe: string;
  analysisTimeframe: string;
  executionTimeframe: string;
  entry: string;
  stopLoss: string;
  takeProfit: string;
  probability: 'high' | 'medium' | 'low';
  confirmationStatus: 'confirmed' | 'pending' | 'watching';
  patternType: 'FVG' | 'OB' | 'BOS' | 'CHOCH';
  confluenceScore: number;
}

// Primary strategy timeframes
const PRIMARY_STRATEGY = {
  higherTimeframes: ['4H', '1H'],
  analysisTimeframes: ['30M', '15M'],
  executionTimeframes: ['5M']
};

// Fallback strategy timeframes
const FALLBACK_STRATEGY = {
  higherTimeframes: ['30M', '15M'],
  analysisTimeframes: ['10M', '5M'],
  executionTimeframes: ['3M', '1M']
};

const CURRENCY_PAIRS = [
  'EUR/USD', 'USD/JPY', 'GBP/USD', 'AUD/USD', 'EUR/GBP', 'EUR/CHF', 'GBP/JPY'
];

// Helper function to analyze multi-timeframe data
const analyzeMultiTimeframeData = async (pair: string, strategy: 'primary' | 'fallback'): Promise<SMCTradeSetup[]> => {
  const setups: SMCTradeSetup[] = [];
  const config = strategy === 'primary' ? PRIMARY_STRATEGY : FALLBACK_STRATEGY;
  
  console.log(`Analyzing ${pair} using ${strategy} strategy...`);
  
  // Step 1: Analyze higher timeframes for market structure
  let marketStructure: 'bullish' | 'bearish' | 'neutral' = 'neutral';
  
  for (const htf of config.higherTimeframes) {
    try {
      const htfData = await marketDataService.fetchFromFCS('forex/history', {
        symbol: pair,
        period: htf,
        limit: '10'
      });
      
      if (htfData.status && htfData.response) {
        const candles = Array.isArray(htfData.response) ? htfData.response : Object.values(htfData.response);
        
        if (candles.length >= 3) {
          const recent = candles.slice(0, 3).map((c: any) => ({
            high: parseFloat(c.h),
            low: parseFloat(c.l),
            close: parseFloat(c.c),
            open: parseFloat(c.o)
          }));
          
          // Determine market structure from higher timeframe
          if (recent[0].high > recent[1].high && recent[0].high > recent[2].high) {
            marketStructure = 'bullish';
          } else if (recent[0].low < recent[1].low && recent[0].low < recent[2].low) {
            marketStructure = 'bearish';
          }
          
          console.log(`${pair} ${htf} market structure: ${marketStructure}`);
          
          if (marketStructure !== 'neutral') break;
        }
      }
    } catch (error) {
      console.error(`Error analyzing ${pair} on ${htf}:`, error);
    }
  }
  
  // Step 2: Look for FVG and OB in analysis timeframes
  if (marketStructure !== 'neutral') {
    for (const atf of config.analysisTimeframes) {
      try {
        const atfData = await marketDataService.fetchFromFCS('forex/history', {
          symbol: pair,
          period: atf,
          limit: '20'
        });
        
        if (atfData.status && atfData.response) {
          const candles = Array.isArray(atfData.response) ? atfData.response : Object.values(atfData.response);
          
          if (candles.length >= 5) {
            const patterns = await detectSMCPatterns(candles, pair, atf, marketStructure);
            
            // Step 3: Create trade setups for execution timeframes
            for (const pattern of patterns) {
              for (const etf of config.executionTimeframes) {
                const setup: SMCTradeSetup = {
                  id: Math.floor(Math.random() * 10000),
                  pair,
                  strategy,
                  direction: pattern.direction,
                  pattern: `${pattern.type} (${atf} → ${etf})`,
                  higherTimeframe: config.higherTimeframes.join('/'),
                  analysisTimeframe: atf,
                  executionTimeframe: etf,
                  entry: pattern.entry,
                  stopLoss: pattern.stopLoss,
                  takeProfit: pattern.takeProfit,
                  probability: pattern.probability,
                  confirmationStatus: 'confirmed',
                  patternType: pattern.type,
                  confluenceScore: calculateConfluenceScore(pattern, marketStructure)
                };
                
                setups.push(setup);
              }
            }
          }
        }
      } catch (error) {
        console.error(`Error analyzing ${pair} on ${atf}:`, error);
      }
    }
  }
  
  return setups;
};

// Detect SMC patterns (FVG and OB)
const detectSMCPatterns = async (candles: any[], pair: string, timeframe: string, bias: 'bullish' | 'bearish' | 'neutral') => {
  const patterns: any[] = [];
  
  const processedCandles = candles.slice(0, 15).map((c: any) => ({
    high: parseFloat(c.h),
    low: parseFloat(c.l),
    close: parseFloat(c.c),
    open: parseFloat(c.o),
    timestamp: parseInt(c.tm)
  })).sort((a, b) => b.timestamp - a.timestamp);
  
  // Look for Fair Value Gaps (FVG)
  for (let i = 0; i < processedCandles.length - 2; i++) {
    const candle1 = processedCandles[i];
    const candle2 = processedCandles[i + 1];
    const candle3 = processedCandles[i + 2];
    
    // Bullish FVG (only if market bias is bullish)
    if (bias === 'bullish' && candle1.low > candle3.high) {
      const gapSize = candle1.low - candle3.high;
      const gapPercent = gapSize / candle2.close;
      
      if (gapPercent > 0.0003) {
        patterns.push({
          type: 'FVG' as const,
          direction: 'buy' as const,
          entry: ((candle1.low + candle3.high) / 2).toFixed(pair.includes('JPY') ? 3 : 5),
          stopLoss: (candle3.high * 0.9995).toFixed(pair.includes('JPY') ? 3 : 5),
          takeProfit: (candle1.low * 1.002).toFixed(pair.includes('JPY') ? 3 : 5),
          probability: gapPercent > 0.001 ? 'high' as const : 'medium' as const,
          strength: gapPercent
        });
      }
    }
    
    // Bearish FVG (only if market bias is bearish)
    if (bias === 'bearish' && candle1.high < candle3.low) {
      const gapSize = candle3.low - candle1.high;
      const gapPercent = gapSize / candle2.close;
      
      if (gapPercent > 0.0003) {
        patterns.push({
          type: 'FVG' as const,
          direction: 'sell' as const,
          entry: ((candle1.high + candle3.low) / 2).toFixed(pair.includes('JPY') ? 3 : 5),
          stopLoss: (candle3.low * 1.0005).toFixed(pair.includes('JPY') ? 3 : 5),
          takeProfit: (candle1.high * 0.998).toFixed(pair.includes('JPY') ? 3 : 5),
          probability: gapPercent > 0.001 ? 'high' as const : 'medium' as const,
          strength: gapPercent
        });
      }
    }
  }
  
  // Look for Order Blocks (OB)
  for (let i = 0; i < processedCandles.length - 1; i++) {
    const candle = processedCandles[i];
    const bodySize = Math.abs(candle.close - candle.open);
    const totalRange = candle.high - candle.low;
    const bodyRatio = totalRange > 0 ? bodySize / totalRange : 0;
    
    // Bullish Order Block (only if market bias is bullish)
    if (bias === 'bullish' && candle.close > candle.open && bodyRatio > 0.6) {
      const strength = bodySize / candle.close;
      
      if (strength > 0.001) {
        patterns.push({
          type: 'OB' as const,
          direction: 'buy' as const,
          entry: candle.open.toFixed(pair.includes('JPY') ? 3 : 5),
          stopLoss: (candle.low * 0.999).toFixed(pair.includes('JPY') ? 3 : 5),
          takeProfit: (candle.high * 1.003).toFixed(pair.includes('JPY') ? 3 : 5),
          probability: strength > 0.003 ? 'high' as const : 'medium' as const,
          strength
        });
      }
    }
    
    // Bearish Order Block (only if market bias is bearish)
    if (bias === 'bearish' && candle.close < candle.open && bodyRatio > 0.6) {
      const strength = bodySize / candle.close;
      
      if (strength > 0.001) {
        patterns.push({
          type: 'OB' as const,
          direction: 'sell' as const,
          entry: candle.open.toFixed(pair.includes('JPY') ? 3 : 5),
          stopLoss: (candle.high * 1.001).toFixed(pair.includes('JPY') ? 3 : 5),
          takeProfit: (candle.low * 0.997).toFixed(pair.includes('JPY') ? 3 : 5),
          probability: strength > 0.003 ? 'high' as const : 'medium' as const,
          strength
        });
      }
    }
  }
  
  return patterns;
};

// Calculate confluence score based on multiple factors
const calculateConfluenceScore = (pattern: any, marketStructure: 'bullish' | 'bearish' | 'neutral'): number => {
  let score = 0;
  
  // Base score for pattern strength
  score += pattern.strength * 1000;
  
  // Bonus for alignment with market structure
  if ((pattern.direction === 'buy' && marketStructure === 'bullish') ||
      (pattern.direction === 'sell' && marketStructure === 'bearish')) {
    score += 20;
  }
  
  // Bonus for high probability patterns
  if (pattern.probability === 'high') {
    score += 15;
  } else if (pattern.probability === 'medium') {
    score += 10;
  }
  
  // Bonus for FVG patterns (considered more reliable)
  if (pattern.type === 'FVG') {
    score += 10;
  }
  
  return Math.min(100, Math.round(score));
};

// Main analysis function
export const analyzeSMCStrategy = async (): Promise<SMCTradeSetup[]> => {
  console.log('Starting multi-timeframe SMC analysis...');
  const allSetups: SMCTradeSetup[] = [];
  
  for (const pair of CURRENCY_PAIRS) {
    try {
      console.log(`Analyzing ${pair}...`);
      
      // Try primary strategy first
      const primarySetups = await analyzeMultiTimeframeData(pair, 'primary');
      
      if (primarySetups.length > 0) {
        console.log(`Found ${primarySetups.length} primary setups for ${pair}`);
        allSetups.push(...primarySetups);
      } else {
        console.log(`No primary setups for ${pair}, trying fallback strategy...`);
        
        // Try fallback strategy if no primary setups found
        const fallbackSetups = await analyzeMultiTimeframeData(pair, 'fallback');
        
        if (fallbackSetups.length > 0) {
          console.log(`Found ${fallbackSetups.length} fallback setups for ${pair}`);
          allSetups.push(...fallbackSetups);
        }
      }
      
      // Add delay between pairs to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 200));
      
    } catch (error) {
      console.error(`Error analyzing ${pair}:`, error);
    }
  }
  
  // Sort by confluence score (highest first)
  allSetups.sort((a, b) => b.confluenceScore - a.confluenceScore);
  
  console.log(`Total SMC setups found: ${allSetups.length}`);
  return allSetups.slice(0, 20); // Return top 20 setups
};
