
import { marketDataService } from './marketDataService';
import { getMarketStructure, detectSwingPoints, detectCHOCHandBOS, isEntryZoneRetested, Candle } from './analysis/swingAnalysis';
import { calculateEnhancedConfluence, ScoringFactors } from './analysis/confluenceScoring';
import { deduplicateSetups } from './analysis/setupDeduplication';

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

// Convert API response to Candle format
const convertToCandles = (apiResponse: any[]): Candle[] => {
  return apiResponse.map(c => ({
    high: parseFloat(c.h),
    low: parseFloat(c.l),
    close: parseFloat(c.c),
    open: parseFloat(c.o),
    timestamp: parseInt(c.tm)
  })).sort((a, b) => b.timestamp - a.timestamp);
};

// Enhanced multi-timeframe analysis with proper swing detection
const analyzeMultiTimeframeData = async (pair: string, strategy: 'primary' | 'fallback'): Promise<SMCTradeSetup[]> => {
  const setups: SMCTradeSetup[] = [];
  const config = strategy === 'primary' ? PRIMARY_STRATEGY : FALLBACK_STRATEGY;
  
  console.log(`Analyzing ${pair} using ${strategy} strategy with swing detection...`);
  
  // Step 1: Analyze higher timeframes for market structure using swing points
  let marketStructure: 'bullish' | 'bearish' | 'neutral' = 'neutral';
  
  for (const htf of config.higherTimeframes) {
    try {
      const htfData = await marketDataService.fetchFromFCS('forex/history', {
        symbol: pair,
        period: htf,
        limit: '20'
      });
      
      if (htfData.status && htfData.response) {
        const candles = Array.isArray(htfData.response) ? htfData.response : Object.values(htfData.response);
        const processedCandles = convertToCandles(candles);
        
        if (processedCandles.length >= 10) {
          marketStructure = getMarketStructure(processedCandles);
          console.log(`${pair} ${htf} market structure: ${marketStructure}`);
          
          if (marketStructure !== 'neutral') break;
        }
      }
    } catch (error) {
      console.error(`Error analyzing ${pair} on ${htf}:`, error);
    }
  }
  
  // Step 2: Look for patterns in analysis timeframes
  if (marketStructure !== 'neutral') {
    for (const atf of config.analysisTimeframes) {
      try {
        const atfData = await marketDataService.fetchFromFCS('forex/history', {
          symbol: pair,
          period: atf,
          limit: '30'
        });
        
        if (atfData.status && atfData.response) {
          const candles = Array.isArray(atfData.response) ? atfData.response : Object.values(atfData.response);
          const processedCandles = convertToCandles(candles);
          
          if (processedCandles.length >= 15) {
            // Detect all pattern types
            const fvgPatterns = await detectFVGPatterns(processedCandles, pair, atf, marketStructure);
            const obPatterns = await detectOBPatterns(processedCandles, pair, atf, marketStructure);
            const chochBosPatterns = detectCHOCHandBOS(processedCandles, marketStructure);
            
            const allPatterns = [
              ...fvgPatterns,
              ...obPatterns,
              ...chochBosPatterns.map(p => ({
                type: p.type,
                direction: p.direction,
                entry: p.price.toFixed(pair.includes('JPY') ? 3 : 5),
                stopLoss: p.direction === 'buy' 
                  ? (p.price * 0.995).toFixed(pair.includes('JPY') ? 3 : 5)
                  : (p.price * 1.005).toFixed(pair.includes('JPY') ? 3 : 5),
                takeProfit: p.direction === 'buy'
                  ? (p.price * 1.01).toFixed(pair.includes('JPY') ? 3 : 5)
                  : (p.price * 0.99).toFixed(pair.includes('JPY') ? 3 : 5),
                probability: p.strength > 0.003 ? 'high' as const : 'medium' as const,
                strength: p.strength
              }))
            ];
            
            // Step 3: Create trade setups with execution timeframe confirmation
            for (const pattern of allPatterns) {
              for (const etf of config.executionTimeframes) {
                // Fetch execution timeframe data for confirmation
                let confirmationStatus: 'confirmed' | 'pending' | 'watching' = 'pending';
                
                try {
                  const etfData = await marketDataService.fetchFromFCS('forex/history', {
                    symbol: pair,
                    period: etf,
                    limit: '50'
                  });
                  
                  if (etfData.status && etfData.response) {
                    const etfCandles = Array.isArray(etfData.response) ? etfData.response : Object.values(etfData.response);
                    const processedETFCandles = convertToCandles(etfCandles);
                    
                    const isRetested = isEntryZoneRetested(
                      processedETFCandles, 
                      parseFloat(pattern.entry), 
                      parseFloat(pattern.stopLoss)
                    );
                    
                    confirmationStatus = isRetested ? 'confirmed' : 'pending';
                  }
                } catch (error) {
                  console.error(`Error fetching ${pair} ${etf} for confirmation:`, error);
                  confirmationStatus = 'watching';
                }
                
                // Calculate enhanced confluence score
                const rewardToRisk = Math.abs(parseFloat(pattern.takeProfit) - parseFloat(pattern.entry)) / 
                                   Math.abs(parseFloat(pattern.entry) - parseFloat(pattern.stopLoss));
                
                const confluenceScore = calculateEnhancedConfluence({
                  patternStrength: pattern.strength,
                  marketAlignment: (pattern.direction === 'buy' && marketStructure === 'bullish') ||
                                 (pattern.direction === 'sell' && marketStructure === 'bearish'),
                  patternType: pattern.type as 'FVG' | 'OB' | 'CHOCH' | 'BOS',
                  probability: pattern.probability,
                  rewardToRisk,
                  executionConfirmed: confirmationStatus === 'confirmed',
                  swingLevel: pattern.type === 'CHOCH' || pattern.type === 'BOS'
                });
                
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
                  confirmationStatus,
                  patternType: pattern.type as 'FVG' | 'OB' | 'BOS' | 'CHOCH',
                  confluenceScore
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

// Enhanced FVG detection
const detectFVGPatterns = async (candles: Candle[], pair: string, timeframe: string, bias: 'bullish' | 'bearish' | 'neutral') => {
  const patterns: any[] = [];
  
  for (let i = 0; i < candles.length - 2; i++) {
    const candle1 = candles[i];
    const candle2 = candles[i + 1];
    const candle3 = candles[i + 2];
    
    // Bullish FVG
    if (bias === 'bullish' && candle1.low > candle3.high) {
      const gapSize = candle1.low - candle3.high;
      const gapPercent = gapSize / candle2.close;
      
      if (gapPercent > 0.0005) {
        patterns.push({
          type: 'FVG',
          direction: 'buy',
          entry: ((candle1.low + candle3.high) / 2).toFixed(pair.includes('JPY') ? 3 : 5),
          stopLoss: (candle3.high * 0.9995).toFixed(pair.includes('JPY') ? 3 : 5),
          takeProfit: (candle1.low * 1.003).toFixed(pair.includes('JPY') ? 3 : 5),
          probability: gapPercent > 0.001 ? 'high' : 'medium',
          strength: gapPercent
        });
      }
    }
    
    // Bearish FVG
    if (bias === 'bearish' && candle1.high < candle3.low) {
      const gapSize = candle3.low - candle1.high;
      const gapPercent = gapSize / candle2.close;
      
      if (gapPercent > 0.0005) {
        patterns.push({
          type: 'FVG',
          direction: 'sell',
          entry: ((candle1.high + candle3.low) / 2).toFixed(pair.includes('JPY') ? 3 : 5),
          stopLoss: (candle3.low * 1.0005).toFixed(pair.includes('JPY') ? 3 : 5),
          takeProfit: (candle1.high * 0.997).toFixed(pair.includes('JPY') ? 3 : 5),
          probability: gapPercent > 0.001 ? 'high' : 'medium',
          strength: gapPercent
        });
      }
    }
  }
  
  return patterns;
};

// Enhanced Order Block detection
const detectOBPatterns = async (candles: Candle[], pair: string, timeframe: string, bias: 'bullish' | 'bearish' | 'neutral') => {
  const patterns: any[] = [];
  
  for (let i = 0; i < candles.length - 1; i++) {
    const candle = candles[i];
    const bodySize = Math.abs(candle.close - candle.open);
    const totalRange = candle.high - candle.low;
    const bodyRatio = totalRange > 0 ? bodySize / totalRange : 0;
    
    // Bullish Order Block
    if (bias === 'bullish' && candle.close > candle.open && bodyRatio > 0.7) {
      const strength = bodySize / candle.close;
      
      if (strength > 0.002) {
        patterns.push({
          type: 'OB',
          direction: 'buy',
          entry: candle.open.toFixed(pair.includes('JPY') ? 3 : 5),
          stopLoss: (candle.low * 0.998).toFixed(pair.includes('JPY') ? 3 : 5),
          takeProfit: (candle.high * 1.005).toFixed(pair.includes('JPY') ? 3 : 5),
          probability: strength > 0.004 ? 'high' : 'medium',
          strength
        });
      }
    }
    
    // Bearish Order Block
    if (bias === 'bearish' && candle.close < candle.open && bodyRatio > 0.7) {
      const strength = bodySize / candle.close;
      
      if (strength > 0.002) {
        patterns.push({
          type: 'OB',
          direction: 'sell',
          entry: candle.open.toFixed(pair.includes('JPY') ? 3 : 5),
          stopLoss: (candle.high * 1.002).toFixed(pair.includes('JPY') ? 3 : 5),
          takeProfit: (candle.low * 0.995).toFixed(pair.includes('JPY') ? 3 : 5),
          probability: strength > 0.004 ? 'high' : 'medium',
          strength
        });
      }
    }
  }
  
  return patterns;
};

// Main analysis function with all improvements
export const analyzeSMCStrategy = async (): Promise<SMCTradeSetup[]> => {
  console.log('Starting enhanced multi-timeframe SMC analysis with swing detection...');
  const allSetups: SMCTradeSetup[] = [];
  
  for (const pair of CURRENCY_PAIRS) {
    try {
      console.log(`Analyzing ${pair} with enhanced SMC logic...`);
      
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
      await new Promise(resolve => setTimeout(resolve, 300));
      
    } catch (error) {
      console.error(`Error analyzing ${pair}:`, error);
    }
  }
  
  // Deduplicate similar setups
  const uniqueSetups = deduplicateSetups(allSetups);
  
  // Sort by confluence score (highest first)
  uniqueSetups.sort((a, b) => b.confluenceScore - a.confluenceScore);
  
  console.log(`Enhanced SMC analysis complete: ${uniqueSetups.length} unique setups found`);
  console.log(`Pattern distribution:`, {
    FVG: uniqueSetups.filter(s => s.patternType === 'FVG').length,
    OB: uniqueSetups.filter(s => s.patternType === 'OB').length,
    CHOCH: uniqueSetups.filter(s => s.patternType === 'CHOCH').length,
    BOS: uniqueSetups.filter(s => s.patternType === 'BOS').length
  });
  
  return uniqueSetups.slice(0, 15); // Return top 15 setups
};
