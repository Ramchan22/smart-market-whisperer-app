
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
}

export interface SMCPattern {
  name: string;
  description: string;
  status: 'Detected' | 'Pending' | 'Active' | 'Watching';
  pair: string;
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
  
  // Fetch trade signals based on current market conditions
  fetchTradeSignals: async (): Promise<TradeSignal[]> => {
    try {
      // In a real implementation, this would call a backend API that analyzes charts
      // For this demo, we'll make a call to a free API to get some real forex data
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
      
      // Get the last 5 days of data to analyze trend
      const dates = Object.keys(timeSeriesData).slice(0, 5);
      const latestData = timeSeriesData[dates[0]];
      const yesterdayData = timeSeriesData[dates[1]];
      
      const latestClose = parseFloat(latestData['4. close']);
      const yesterdayClose = parseFloat(yesterdayData['4. close']);
      
      // Determine if we're in an uptrend or downtrend
      const trend = latestClose > yesterdayClose ? 'buy' : 'sell';
      
      // Generate signals based on real market data
      const patterns = ['Order Block', 'Fair Value Gap', 'Liquidity Grab', 'Breaker Block', 'Imbalance'];
      const timeframes = ['15m', '1H', '4H', '1D'];
      
      // Generate 3-5 signals
      const signalCount = Math.floor(Math.random() * 3) + 3;
      const signals: TradeSignal[] = [];
      
      for (let i = 1; i <= signalCount; i++) {
        // Use random but realistic price levels based on the current EUR/USD price
        const pair = CURRENCY_PAIRS[Math.floor(Math.random() * CURRENCY_PAIRS.length)];
        const direction = Math.random() > 0.5 ? trend : (trend === 'buy' ? 'sell' : 'buy');
        
        // Calculate realistic price levels
        let basePrice = latestClose;
        if (pair === 'GBP/USD') basePrice *= 1.17;
        else if (pair === 'USD/JPY') basePrice *= 148;
        else if (pair === 'AUD/USD') basePrice *= 0.6;
        else if (pair === 'EUR/GBP') basePrice *= 0.85;
        else if (pair === 'EUR/CHF') basePrice *= 0.95;
        else if (pair === 'GBP/JPY') basePrice = basePrice * 1.17 * 148;
        
        const entry = basePrice.toFixed(pair.includes('JPY') ? 2 : 4);
        const stopLoss = direction === 'buy' 
          ? (basePrice - (basePrice * 0.003)).toFixed(pair.includes('JPY') ? 2 : 4)
          : (basePrice + (basePrice * 0.003)).toFixed(pair.includes('JPY') ? 2 : 4);
        const takeProfit = direction === 'buy'
          ? (basePrice + (basePrice * 0.006)).toFixed(pair.includes('JPY') ? 2 : 4)
          : (basePrice - (basePrice * 0.006)).toFixed(pair.includes('JPY') ? 2 : 4);
        
        signals.push({
          id: i,
          pair,
          direction,
          pattern: patterns[Math.floor(Math.random() * patterns.length)],
          entry,
          stopLoss,
          takeProfit,
          probability: ['high', 'medium', 'low'][Math.floor(Math.random() * 3)] as 'high' | 'medium' | 'low',
          timeframe: timeframes[Math.floor(Math.random() * timeframes.length)]
        });
      }
      
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
      // For this demo, we'll make a call to a free API to get some real forex data
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
      
      // Pattern descriptions for SMC concepts
      const patternDescriptions = {
        'Order Block': 'Areas where smart money placed their positions, causing market movement',
        'Fair Value Gap': 'Imbalances created by quick moves, often filling liquidity',
        'Liquidity Sweep': 'Price moves breaking key levels to collect stops before reversing',
        'Breaker Block': 'Area where price previously reversed acting as S/R',
        'Equal Highs/Lows': 'Areas where price creates equal peaks before reversing',
        'Market Structure Break': 'Key level where market structure shifts direction',
        'Discount Block': 'Premium zones where smart money accumulates positions'
      };
      
      const patternNames = Object.keys(patternDescriptions);
      const statuses = ['Detected', 'Pending', 'Active', 'Watching'];
      
      // Generate 4-6 patterns based on the latest market data
      const patternCount = Math.floor(Math.random() * 3) + 4;
      
      // Analyze price action to determine which patterns are more likely
      const dates = Object.keys(timeSeriesData).slice(0, 10);
      const latestData = timeSeriesData[dates[0]];
      const tenDaysAgo = timeSeriesData[dates[9]];
      
      const latestClose = parseFloat(latestData['4. close']);
      const tenDayClose = parseFloat(tenDaysAgo['4. close']);
      
      // If price has moved significantly, certain patterns are more likely
      const significantMove = Math.abs(latestClose - tenDayClose) / tenDayClose > 0.01;
      
      // Select patterns based on market conditions
      let relevantPatterns = patternNames;
      if (significantMove) {
        // After significant moves, these patterns are more common
        relevantPatterns = ['Fair Value Gap', 'Liquidity Sweep', 'Order Block', 'Breaker Block'];
      }
      
      // Randomly select from relevant patterns
      const shuffledPatterns = [...relevantPatterns].sort(() => Math.random() - 0.5);
      
      const selectedPatterns: SMCPattern[] = [];
      
      for (let i = 0; i < patternCount; i++) {
        const patternName = shuffledPatterns[i % shuffledPatterns.length];
        const pair = CURRENCY_PAIRS[Math.floor(Math.random() * CURRENCY_PAIRS.length)];
        const status = statuses[Math.floor(Math.random() * statuses.length)];
        
        selectedPatterns.push({
          name: patternName,
          description: patternDescriptions[patternName as keyof typeof patternDescriptions],
          status: status as 'Detected' | 'Pending' | 'Active' | 'Watching',
          pair
        });
      }
      
      return selectedPatterns;
    } catch (error) {
      console.error('Error fetching SMC patterns:', error);
      toast.error('Failed to fetch pattern data');
      throw error;
    }
  }
};
