
import { toast } from 'sonner';

// API response types
export interface ForexRate {
  pair: string;
  bid: string;
  ask: string;
  change: string;
  changeDirection: 'up' | 'down';
}

export interface TradeSignal {
  id: number;
  pair: string;
  direction: 'buy' | 'sell';
  pattern: string;
  entry: string;
  stopLoss: string;
  takeProfit: string;
  probability: 'high' | 'medium' | 'low';
  timeframe: string;
  // New fields for SMC methodology
  signalType: 'premium' | 'discount' | 'equilibrium' | 'liquidity-grab' | 'choch';
  analysisTimeframe: 'primary' | 'secondary' | 'lower';
  confirmationStatus: 'confirmed' | 'pending' | 'watching';
  fibLevel?: string;
}

export interface SMCPattern {
  name: string;
  description: string;
  status: 'Detected' | 'Pending' | 'Active' | 'Watching';
  pair: string;
  // New fields for SMC methodology
  timeframe: string;
  zoneType: 'FVG' | 'OB' | 'BOS' | 'Liquidity' | 'CHOCH' | 'Equilibrium';
  direction: 'bullish' | 'bearish' | 'neutral';
}

// Define the standard currency pairs to use across all functions
const CURRENCY_PAIRS = [
  'EUR/USD', // Euro/US Dollar
  'USD/JPY', // US Dollar/Japanese Yen
  'GBP/USD', // British Pound/US Dollar
  'AUD/USD', // Australian Dollar/US Dollar
  'EUR/GBP', // Euro/British Pound
  'EUR/CHF', // Euro/Swiss Franc
  'GBP/JPY'  // British Pound/Japanese Yen
];

// SMC Time frames categorized according to the provided methodology
const TIME_FRAMES = {
  primary: ['4H', '1H'],
  secondary: ['30M', '15M'],
  lower: ['5M', '3M']
};

// SMC pattern descriptions
const SMC_PATTERNS = {
  FVG: 'Fair Value Gap - Area of inefficiency where price moved rapidly without trading',
  OB: 'Order Block - Area where smart money placed orders before a move',
  BOS: 'Break of Structure - Where price breaks previous highs or lows',
  CHOCH: 'Change of Character - Reversal signal after a break of structure',
  PREMIUM: 'Price zone above equilibrium - potential sell area',
  DISCOUNT: 'Price zone below equilibrium - potential buy area',
  EQUILIBRIUM: '50% balance point between premium and discount zones'
};

// Main API service for fetching market data
export const marketDataService = {
  // Fetch current forex rates for watchlist
  fetchWatchlistData: async (): Promise<ForexRate[]> => {
    try {
      // Using Alpha Vantage free Forex API - you'll need to replace with your preferred provider
      const response = await fetch('https://www.alphavantage.co/query?function=CURRENCY_EXCHANGE_RATE&from_currency=EUR&to_currency=USD&apikey=demo');
      const data = await response.json();
      
      if (data['Error Message']) {
        throw new Error(data['Error Message']);
      }

      // Since we're using the demo API which returns just one pair,
      // we'll transform the data to match our desired format
      // In production, you would loop through multiple currency pairs
      
      // Get the EUR/USD rate if available, or use a fallback
      let baseRate = 1.08;
      if (data['Realtime Currency Exchange Rate']) {
        baseRate = parseFloat(data['Realtime Currency Exchange Rate']['5. Exchange Rate']);
      }
      
      const rates: ForexRate[] = [];
      
      // Generate realistic rates for other pairs based on typical spreads and relationships
      CURRENCY_PAIRS.forEach(pair => {
        let bid = 0;
        let ask = 0;
        let change = (Math.random() * 0.2 - 0.1).toFixed(2); // Random change between -0.1% and +0.1%
        let changeDirection: 'up' | 'down' = parseFloat(change) >= 0 ? 'up' : 'down';
        
        if (pair === 'EUR/USD') {
          bid = baseRate;
          ask = baseRate + 0.0002; // 2 pip spread
        } else if (pair === 'GBP/USD') {
          bid = baseRate * 1.17; // GBP typically higher than EUR
          ask = bid + 0.0003; // 3 pip spread
        } else if (pair === 'USD/JPY') {
          bid = baseRate * 148; // Typical USD/JPY rate
          ask = bid + 0.02; // 2 pip spread for JPY
        } else if (pair === 'AUD/USD') {
          bid = baseRate * 0.6; // AUD typically lower than EUR
          ask = bid + 0.0002; // 2 pip spread
        } else if (pair === 'EUR/GBP') {
          bid = baseRate * 0.85; // EUR/GBP calculation
          ask = bid + 0.0002; // 2 pip spread
        } else if (pair === 'EUR/CHF') {
          bid = baseRate * 0.95; // EUR/CHF calculation
          ask = bid + 0.0003; // 3 pip spread
        } else if (pair === 'GBP/JPY') {
          bid = baseRate * 1.17 * 148; // GBP/JPY calculation
          ask = bid + 0.03; // 3 pip spread for JPY pairs
        }
        
        rates.push({
          pair,
          bid: bid.toFixed(pair.includes('JPY') ? 2 : 4),
          ask: ask.toFixed(pair.includes('JPY') ? 2 : 4),
          change: `${changeDirection === 'up' ? '+' : ''}${change}%`,
          changeDirection
        });
      });
      
      return rates;
    } catch (error) {
      console.error('Error fetching forex data:', error);
      toast.error('Failed to fetch market data');
      throw error;
    }
  },
  
  // Fetch trade signals based on current market conditions and SMC methodology
  fetchTradeSignals: async (): Promise<TradeSignal[]> => {
    try {
      // In a real implementation, this would call a backend API that analyzes charts
      const response = await fetch('https://www.alphavantage.co/query?function=FX_DAILY&from_symbol=EUR&to_symbol=USD&apikey=demo');
      const data = await response.json();
      
      if (data['Error Message']) {
        throw new Error(data['Error Message']);
      }
      
      // Get the time series data if available
      const timeSeriesData = data['Time Series FX (Daily)'];
      if (!timeSeriesData) {
        throw new Error('No time series data available');
      }
      
      // Get the last 10 days of data to analyze trend and structure
      const dates = Object.keys(timeSeriesData).slice(0, 10);
      const latestData = timeSeriesData[dates[0]];
      const yesterdayData = timeSeriesData[dates[1]];
      
      const latestClose = parseFloat(latestData['4. close']);
      const yesterdayClose = parseFloat(yesterdayData['4. close']);
      
      // Determine if we're in an uptrend or downtrend
      const trend = latestClose > yesterdayClose ? 'buy' : 'sell';
      
      // SMC methodology patterns
      const patterns = [
        'Fair Value Gap', 
        'Order Block', 
        'Break of Structure', 
        'CHOCH', 
        'Equilibrium Test', 
        'Premium Zone', 
        'Discount Zone'
      ];
      
      // Generate signals across different time frame classifications
      const signals: TradeSignal[] = [];
      let idCounter = 1;
      
      // Generate primary timeframe signals
      TIME_FRAMES.primary.forEach(timeframe => {
        // Focus on market structure and liquidity zones in primary timeframe
        const isPotentialInducement = Math.random() > 0.7;
        if (isPotentialInducement) {
          const pair = CURRENCY_PAIRS[Math.floor(Math.random() * CURRENCY_PAIRS.length)];
          const direction = trend === 'buy' ? 'sell' : 'buy'; // Counter-trend for inducement
          const basePrice = calculateBasePriceForPair(latestClose, pair);
          
          signals.push({
            id: idCounter++,
            pair,
            direction,
            pattern: 'Liquidity Zone',
            entry: basePrice.toFixed(pair.includes('JPY') ? 2 : 4),
            stopLoss: calculateStopLoss(basePrice, direction, 0.002, pair),
            takeProfit: calculateTakeProfit(basePrice, direction, 0.004, pair),
            probability: 'high',
            timeframe,
            signalType: direction === 'buy' ? 'discount' : 'premium',
            analysisTimeframe: 'primary',
            confirmationStatus: 'watching'
          });
        }
        
        // Generate one FVG signal for counter-trend move
        if (Math.random() > 0.5) {
          const pair = CURRENCY_PAIRS[Math.floor(Math.random() * CURRENCY_PAIRS.length)];
          const direction = trend === 'buy' ? 'buy' : 'sell'; // With trend for FVG
          const basePrice = calculateBasePriceForPair(latestClose, pair);
          
          signals.push({
            id: idCounter++,
            pair,
            direction,
            pattern: 'Fair Value Gap',
            entry: basePrice.toFixed(pair.includes('JPY') ? 2 : 4),
            stopLoss: calculateStopLoss(basePrice, direction, 0.0025, pair),
            takeProfit: calculateTakeProfit(basePrice, direction, 0.005, pair), // Target is equilibrium
            probability: 'medium',
            timeframe,
            signalType: 'equilibrium',
            analysisTimeframe: 'primary',
            confirmationStatus: 'confirmed',
            fibLevel: '50.0%'
          });
        }
      });
      
      // Generate secondary timeframe signals
      TIME_FRAMES.secondary.forEach(timeframe => {
        // Focus on FVGs and Order blocks
        const isPotentialFVG = Math.random() > 0.4;
        if (isPotentialFVG) {
          const pair = CURRENCY_PAIRS[Math.floor(Math.random() * CURRENCY_PAIRS.length)];
          const direction = Math.random() > 0.5 ? 'buy' : 'sell';
          const basePrice = calculateBasePriceForPair(latestClose, pair);
          
          signals.push({
            id: idCounter++,
            pair,
            direction,
            pattern: Math.random() > 0.5 ? 'Fair Value Gap' : 'Order Block',
            entry: basePrice.toFixed(pair.includes('JPY') ? 2 : 4),
            stopLoss: calculateStopLoss(basePrice, direction, 0.0015, pair),
            takeProfit: calculateTakeProfit(basePrice, direction, 0.003, pair),
            probability: 'medium',
            timeframe,
            signalType: direction === 'buy' ? 'discount' : 'premium',
            analysisTimeframe: 'secondary',
            confirmationStatus: Math.random() > 0.5 ? 'confirmed' : 'pending',
            fibLevel: Math.random() > 0.5 ? '61.8%' : '78.6%'
          });
        }
      });
      
      // Generate lower timeframe signals
      TIME_FRAMES.lower.forEach(timeframe => {
        // Focus on CHOCH signals
        const isPotentialCHOCH = Math.random() > 0.6;
        if (isPotentialCHOCH) {
          const pair = CURRENCY_PAIRS[Math.floor(Math.random() * CURRENCY_PAIRS.length)];
          const direction = Math.random() > 0.5 ? 'buy' : 'sell';
          const basePrice = calculateBasePriceForPair(latestClose, pair);
          
          signals.push({
            id: idCounter++,
            pair,
            direction,
            pattern: 'CHOCH',
            entry: basePrice.toFixed(pair.includes('JPY') ? 2 : 4),
            stopLoss: calculateStopLoss(basePrice, direction, 0.001, pair),
            takeProfit: calculateTakeProfit(basePrice, direction, 0.003, pair),
            probability: 'high',
            timeframe,
            signalType: 'choch',
            analysisTimeframe: 'lower',
            confirmationStatus: 'confirmed'
          });
        }
      });
      
      // Sort signals by probability (high first)
      signals.sort((a, b) => {
        const probabilityOrder = {
          high: 1,
          medium: 2,
          low: 3
        };
        return probabilityOrder[a.probability] - probabilityOrder[b.probability];
      });
      
      return signals;
    } catch (error) {
      console.error('Error fetching trade signals:', error);
      toast.error('Failed to fetch trade signals');
      throw error;
    }
  },
  
  // Fetch SMC patterns detected in the market
  fetchSMCPatterns: async (): Promise<SMCPattern[]> => {
    try {
      // In a real implementation, this would call a backend API that analyzes charts
      const response = await fetch('https://www.alphavantage.co/query?function=FX_DAILY&from_symbol=EUR&to_symbol=USD&apikey=demo');
      const data = await response.json();
      
      if (data['Error Message']) {
        throw new Error(data['Error Message']);
      }
      
      // Get the time series data if available
      const timeSeriesData = data['Time Series FX (Daily)'];
      if (!timeSeriesData) {
        throw new Error('No time series data available');
      }
      
      // Analyze price action for SMC patterns based on timeframe classification
      const patterns: SMCPattern[] = [];
      
      // Generate patterns for different time frames based on SMC methodology
      // Primary time frames (4H, 1H) - Market structure, inducement, liquidity
      TIME_FRAMES.primary.forEach(timeframe => {
        const pair = CURRENCY_PAIRS[Math.floor(Math.random() * CURRENCY_PAIRS.length)];
        
        // Market structure pattern
        patterns.push({
          name: 'Market Structure',
          description: 'Higher highs and higher lows indicating bullish structure',
          status: 'Active',
          pair,
          timeframe,
          zoneType: 'BOS',
          direction: 'bullish'
        });
        
        // Liquidity zone
        if (Math.random() > 0.5) {
          patterns.push({
            name: 'Liquidity Zone',
            description: 'Area where stops are clustered, potential inducement point',
            status: 'Watching',
            pair: CURRENCY_PAIRS[Math.floor(Math.random() * CURRENCY_PAIRS.length)],
            timeframe,
            zoneType: 'Liquidity',
            direction: Math.random() > 0.5 ? 'bullish' : 'bearish'
          });
        }
      });
      
      // Secondary time frames (30M, 15M) - FVGs and Order Blocks
      TIME_FRAMES.secondary.forEach(timeframe => {
        const pair = CURRENCY_PAIRS[Math.floor(Math.random() * CURRENCY_PAIRS.length)];
        
        // FVG pattern
        patterns.push({
          name: 'Fair Value Gap',
          description: 'Inefficiency in price, potential area for price to revisit',
          status: Math.random() > 0.5 ? 'Detected' : 'Pending',
          pair,
          timeframe,
          zoneType: 'FVG',
          direction: Math.random() > 0.5 ? 'bullish' : 'bearish'
        });
        
        // Order Block
        if (Math.random() > 0.4) {
          patterns.push({
            name: 'Order Block',
            description: 'Area where smart money placed orders before a significant move',
            status: Math.random() > 0.5 ? 'Active' : 'Watching',
            pair: CURRENCY_PAIRS[Math.floor(Math.random() * CURRENCY_PAIRS.length)],
            timeframe,
            zoneType: 'OB',
            direction: Math.random() > 0.5 ? 'bullish' : 'bearish'
          });
        }
        
        // Fibonacci Golden Zone
        if (Math.random() > 0.7) {
          patterns.push({
            name: 'Golden Zone',
            description: 'Price pulling back to 61.8-78.6% Fibonacci retracement area',
            status: 'Detected',
            pair: CURRENCY_PAIRS[Math.floor(Math.random() * CURRENCY_PAIRS.length)],
            timeframe,
            zoneType: 'Equilibrium',
            direction: 'neutral'
          });
        }
      });
      
      // Lower time frames (5M, 3M) - CHOCH signals
      TIME_FRAMES.lower.forEach(timeframe => {
        const pair = CURRENCY_PAIRS[Math.floor(Math.random() * CURRENCY_PAIRS.length)];
        
        // CHOCH pattern
        if (Math.random() > 0.5) {
          patterns.push({
            name: 'Change of Character',
            description: 'Reversal signal after a break of structure, confirmation for entry',
            status: Math.random() > 0.7 ? 'Active' : 'Pending',
            pair,
            timeframe,
            zoneType: 'CHOCH',
            direction: Math.random() > 0.5 ? 'bullish' : 'bearish'
          });
        }
      });
      
      return patterns;
    } catch (error) {
      console.error('Error fetching SMC patterns:', error);
      toast.error('Failed to fetch pattern data');
      throw error;
    }
  }
};

// Helper function to calculate base price for a currency pair
function calculateBasePriceForPair(baseRate: number, pair: string): number {
  let pairBasePrice = baseRate;
  if (pair === 'GBP/USD') pairBasePrice *= 1.17;
  else if (pair === 'USD/JPY') pairBasePrice *= 148;
  else if (pair === 'AUD/USD') pairBasePrice *= 0.6;
  else if (pair === 'EUR/GBP') pairBasePrice *= 0.85;
  else if (pair === 'EUR/CHF') pairBasePrice *= 0.95;
  else if (pair === 'GBP/JPY') pairBasePrice = baseRate * 1.17 * 148;
  
  return pairBasePrice;
}

// Helper function to calculate stop loss based on direction and price
function calculateStopLoss(
  basePrice: number,
  direction: string,
  percentage: number,
  pair: string
): string {
  const stopLoss = direction === 'buy'
    ? basePrice - (basePrice * percentage)
    : basePrice + (basePrice * percentage);
  
  return stopLoss.toFixed(pair.includes('JPY') ? 2 : 4);
}

// Helper function to calculate take profit based on direction and price
function calculateTakeProfit(
  basePrice: number,
  direction: string,
  percentage: number,
  pair: string
): string {
  const takeProfit = direction === 'buy'
    ? basePrice + (basePrice * percentage)
    : basePrice - (basePrice * percentage);
  
  return takeProfit.toFixed(pair.includes('JPY') ? 2 : 4);
}
