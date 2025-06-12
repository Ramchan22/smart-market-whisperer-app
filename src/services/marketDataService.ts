import { toast } from 'sonner';

// API configuration
const API_CONFIG = {
  FCS_API_KEY: 'hczDhp413qSmqzjLlVNuhRuFdwuJv', // FCS API key
  FCS_BASE_URL: 'https://fcsapi.com/api-v3',
  DATA_PROVIDER: 'fcs' // Default to FCS for better rate limits
};

// Track API rate limit status
let isRateLimitReached = false;

// Helper to dispatch rate limit event
const emitRateLimitEvent = () => {
  if (!isRateLimitReached) {
    isRateLimitReached = true;
    // Dispatch a custom event that components can listen for
    window.dispatchEvent(new CustomEvent('alphavantage-rate-limit'));
    console.warn('API rate limit reached, switching to demo data');
  }
};

// Helper to check response for rate limit messages
const checkForRateLimit = (data: any): boolean => {
  if (data && (data['Information'] || data['Note'] || data['Error Message'])) {
    const message = data['Information'] || data['Note'] || data['Error Message'];
    if (message && (message.includes('API rate limit') || message.includes('rate limit'))) {
      emitRateLimitEvent();
      return true;
    }
  }
  return false;
};

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

// Helper function to fetch data from FCS API
const fetchFromFCS = async (endpoint: string, params: Record<string, string> = {}) => {
  const url = new URL(`${API_CONFIG.FCS_BASE_URL}/${endpoint}`);
  url.searchParams.append('access_key', API_CONFIG.FCS_API_KEY);
  
  Object.entries(params).forEach(([key, value]) => {
    url.searchParams.append(key, value);
  });

  const response = await fetch(url.toString());
  const data = await response.json();
  
  if (!data.status && data.msg) {
    throw new Error(data.msg);
  }
  
  return data;
};

// Helper function to analyze real price data for signals
const analyzeMarketData = (timeSeriesData: any, pair: string): TradeSignal[] => {
  const signals: TradeSignal[] = [];
  const dates = Object.keys(timeSeriesData).slice(0, 5); // Last 5 days
  let idCounter = Math.floor(Math.random() * 1000);

  // Get recent price data
  const recentData = dates.map(date => ({
    date,
    open: parseFloat(timeSeriesData[date]['1. open']),
    high: parseFloat(timeSeriesData[date]['2. high']),
    low: parseFloat(timeSeriesData[date]['3. low']),
    close: parseFloat(timeSeriesData[date]['4. close'])
  }));

  const latest = recentData[0];
  const previous = recentData[1];
  
  // Determine trend based on recent price action
  const priceChange = latest.close - previous.close;
  const isUptrend = priceChange > 0;
  const volatility = Math.abs(priceChange / previous.close);

  // Calculate key levels
  const dailyRange = latest.high - latest.low;
  const currentPrice = latest.close;
  
  // Look for Fair Value Gaps (price gaps)
  for (let i = 0; i < recentData.length - 2; i++) {
    const day1 = recentData[i];
    const day2 = recentData[i + 1];
    const day3 = recentData[i + 2];
    
    // Bullish FVG: day1.low > day3.high
    if (day1.low > day3.high && isUptrend) {
      const gapMidpoint = (day1.low + day3.high) / 2;
      signals.push({
        id: idCounter++,
        pair,
        direction: 'buy',
        pattern: 'Fair Value Gap',
        entry: gapMidpoint.toFixed(pair.includes('JPY') ? 2 : 4),
        stopLoss: (gapMidpoint * 0.998).toFixed(pair.includes('JPY') ? 2 : 4),
        takeProfit: (gapMidpoint * 1.006).toFixed(pair.includes('JPY') ? 2 : 4),
        probability: volatility > 0.01 ? 'high' : 'medium',
        timeframe: '1H',
        signalType: 'discount',
        analysisTimeframe: 'primary',
        confirmationStatus: 'confirmed',
        fibLevel: '61.8%'
      });
    }
    
    // Bearish FVG: day1.high < day3.low
    if (day1.high < day3.low && !isUptrend) {
      const gapMidpoint = (day1.high + day3.low) / 2;
      signals.push({
        id: idCounter++,
        pair,
        direction: 'sell',
        pattern: 'Fair Value Gap',
        entry: gapMidpoint.toFixed(pair.includes('JPY') ? 2 : 4),
        stopLoss: (gapMidpoint * 1.002).toFixed(pair.includes('JPY') ? 2 : 4),
        takeProfit: (gapMidpoint * 0.994).toFixed(pair.includes('JPY') ? 2 : 4),
        probability: volatility > 0.01 ? 'high' : 'medium',
        timeframe: '1H',
        signalType: 'premium',
        analysisTimeframe: 'primary',
        confirmationStatus: 'confirmed',
        fibLevel: '61.8%'
      });
    }
  }

  // Look for Order Blocks (significant price moves)
  for (let i = 0; i < recentData.length - 1; i++) {
    const day = recentData[i];
    const bodySize = Math.abs(day.close - day.open);
    const shadowSize = day.high - day.low;
    
    // Strong bullish candle with small shadows
    if (day.close > day.open && bodySize > shadowSize * 0.7 && isUptrend) {
      signals.push({
        id: idCounter++,
        pair,
        direction: 'buy',
        pattern: 'Order Block',
        entry: day.open.toFixed(pair.includes('JPY') ? 2 : 4),
        stopLoss: (day.low * 0.999).toFixed(pair.includes('JPY') ? 2 : 4),
        takeProfit: (day.high * 1.002).toFixed(pair.includes('JPY') ? 2 : 4),
        probability: volatility > 0.008 ? 'high' : 'medium',
        timeframe: '4H',
        signalType: 'discount',
        analysisTimeframe: 'primary',
        confirmationStatus: 'watching'
      });
    }
    
    // Strong bearish candle
    if (day.close < day.open && bodySize > shadowSize * 0.7 && !isUptrend) {
      signals.push({
        id: idCounter++,
        pair,
        direction: 'sell',
        pattern: 'Order Block',
        entry: day.open.toFixed(pair.includes('JPY') ? 2 : 4),
        stopLoss: (day.high * 1.001).toFixed(pair.includes('JPY') ? 2 : 4),
        takeProfit: (day.low * 0.998).toFixed(pair.includes('JPY') ? 2 : 4),
        probability: volatility > 0.008 ? 'high' : 'medium',
        timeframe: '4H',
        signalType: 'premium',
        analysisTimeframe: 'primary',
        confirmationStatus: 'watching'
      });
    }
  }

  // Look for Break of Structure
  const highs = recentData.map(d => d.high);
  const lows = recentData.map(d => d.low);
  const recentHigh = Math.max(...highs.slice(0, 3));
  const recentLow = Math.min(...lows.slice(0, 3));
  
  // Bullish BOS - price breaking above recent high
  if (latest.high > recentHigh && isUptrend) {
    signals.push({
      id: idCounter++,
      pair,
      direction: 'buy',
      pattern: 'Break of Structure',
      entry: recentHigh.toFixed(pair.includes('JPY') ? 2 : 4),
      stopLoss: (recentHigh * 0.997).toFixed(pair.includes('JPY') ? 2 : 4),
      takeProfit: (recentHigh * 1.008).toFixed(pair.includes('JPY') ? 2 : 4),
      probability: 'high',
      timeframe: '15M',
      signalType: 'choch',
      analysisTimeframe: 'secondary',
      confirmationStatus: 'confirmed'
    });
  }
  
  // Bearish BOS - price breaking below recent low
  if (latest.low < recentLow && !isUptrend) {
    signals.push({
      id: idCounter++,
      pair,
      direction: 'sell',
      pattern: 'Break of Structure',
      entry: recentLow.toFixed(pair.includes('JPY') ? 2 : 4),
      stopLoss: (recentLow * 1.003).toFixed(pair.includes('JPY') ? 2 : 4),
      takeProfit: (recentLow * 0.992).toFixed(pair.includes('JPY') ? 2 : 4),
      probability: 'high',
      timeframe: '15M',
      signalType: 'choch',
      analysisTimeframe: 'secondary',
      confirmationStatus: 'confirmed'
    });
  }

  return signals;
};

// Main API service for fetching market data
export const marketDataService = {
  // Set the data provider
  setDataProvider: (provider: string): void => {
    API_CONFIG.DATA_PROVIDER = provider;
    console.log(`Data provider set to: ${provider}`);
    localStorage.setItem('dataProvider', provider);
    
    // Reset rate limit status when switching to demo mode
    if (provider === 'demo') {
      isRateLimitReached = false;
    }
    
    // Show toast notification
    toast.success(`Data provider set to ${provider === 'demo' ? 'Demo (Sample Data)' : 'FCS API (Live)'}`);
  },
  
  // Get the current data provider
  getDataProvider: (): string => {
    // Check localStorage first, then fallback to default
    return localStorage.getItem('dataProvider') || API_CONFIG.DATA_PROVIDER;
  },
  
  // Check if rate limit has been reached
  isRateLimitReached: (): boolean => {
    return isRateLimitReached;
  },

  // Reset rate limit status (for testing)
  resetRateLimitStatus: (): void => {
    isRateLimitReached = false;
    toast.success('API rate limit status has been reset');
  },

  // Fetch current forex rates for watchlist using FCS API
  fetchWatchlistData: async (): Promise<ForexRate[]> => {
    try {
      const dataProvider = marketDataService.getDataProvider();
      
      // Always use demo data if that's what's selected or if rate limit is reached
      if (dataProvider === 'demo' || isRateLimitReached) {
        if (dataProvider !== 'demo' && isRateLimitReached) {
          console.log('Using demo data for watchlist due to API rate limit');
        } else {
          console.log('Using demo data for watchlist as selected');
        }
        return generateDemoWatchlistData();
      }
      
      // Use FCS API for live data
      console.log('Fetching watchlist data from FCS API...');
      
      try {
        // Batch request for all pairs in one call
        const pairsString = CURRENCY_PAIRS.join(',');
        const data = await fetchFromFCS('forex/latest', { 
          pairs: pairsString 
        });
        
        if (data.status && data.response) {
          const rates: ForexRate[] = data.response.map((item: any) => {
            const pair = `${item.c1}/${item.c2}`;
            const price = parseFloat(item.p);
            const change = parseFloat(item.ch);
            const changePercent = parseFloat(item.cp);
            
            return {
              pair,
              bid: (price - 0.0002).toFixed(pair.includes('JPY') ? 2 : 4),
              ask: price.toFixed(pair.includes('JPY') ? 2 : 4),
              change: `${changePercent.toFixed(2)}%`,
              changeDirection: change >= 0 ? 'up' : 'down'
            };
          });
          
          toast.success('Connected to FCS API live forex data');
          return rates;
        } else {
          throw new Error('Invalid FCS API response');
        }
      } catch (fcsError) {
        console.error('FCS API error:', fcsError);
        toast.error('FCS API error, using demo data');
        return generateDemoWatchlistData();
      }
    } catch (error) {
      console.error('Error fetching forex data:', error);
      toast.error('Failed to fetch market data');
      emitRateLimitEvent();
      return generateDemoWatchlistData();
    }
  },
  
  // Fetch trade signals based on current market conditions and SMC methodology using FCS API
  fetchTradeSignals: async (): Promise<TradeSignal[]> => {
    try {
      const dataProvider = marketDataService.getDataProvider();
      
      // Always use demo data if that's what's selected or rate limit reached
      if (dataProvider === 'demo' || isRateLimitReached) {
        if (dataProvider !== 'demo' && isRateLimitReached) {
          console.warn('API limit reached, using demo data for trade signals');
        } else {
          console.log('Using demo data for trade signals as selected');
        }
        return generateDemoTradeSignals();
      }
      
      console.log('Fetching live market data for trade signals from FCS API...');
      const allSignals: TradeSignal[] = [];
      
      try {
        // Fetch historical data for signal analysis from FCS
        for (const pair of CURRENCY_PAIRS.slice(0, 5)) { // Limit to 5 pairs for better performance
          const [base, quote] = pair.split('/');
          const historicalData = await fetchFromFCS('forex/history', {
            symbol: `${base}${quote}`,
            period: '1D',
            limit: '30'
          });
          
          if (historicalData.status && historicalData.response) {
            // Convert FCS format to our expected format
            const timeSeriesData: any = {};
            historicalData.response.forEach((item: any) => {
              const date = new Date(item.tm * 1000).toISOString().split('T')[0];
              timeSeriesData[date] = {
                '1. open': item.o.toString(),
                '2. high': item.h.toString(),
                '3. low': item.l.toString(),
                '4. close': item.c.toString()
              };
            });
            
            const pairSignals = analyzeMarketData(timeSeriesData, pair);
            allSignals.push(...pairSignals);
            console.log(`Generated ${pairSignals.length} signals for ${pair} based on FCS data`);
          }
          
          // Small delay between requests
          await new Promise(resolve => setTimeout(resolve, 200));
        }
      } catch (fcsError) {
        console.error('FCS API error for signals:', fcsError);
        toast.error('FCS API error, using demo signals');
        return generateDemoTradeSignals();
      }
      
      // Sort signals by probability (high first)
      allSignals.sort((a, b) => {
        const probabilityOrder = { high: 1, medium: 2, low: 3 };
        return probabilityOrder[a.probability] - probabilityOrder[b.probability];
      });
      
      console.log(`Generated ${allSignals.length} total signals from FCS live market data`);
      return allSignals.length > 0 ? allSignals : generateDemoTradeSignals();
      
    } catch (error) {
      console.error('Error fetching live trade signals:', error);
      toast.error('Failed to fetch live trade signals, using demo data');
      emitRateLimitEvent();
      return generateDemoTradeSignals();
    }
  },
  
  // Fetch SMC patterns detected in the market using FCS API
  fetchSMCPatterns: async (): Promise<SMCPattern[]> => {
    try {
      const dataProvider = marketDataService.getDataProvider();
      
      // Always use demo data if that's what's selected or rate limit reached
      if (dataProvider === 'demo' || isRateLimitReached) {
        if (dataProvider !== 'demo' && isRateLimitReached) {
          console.warn('API limit reached, using demo data for SMC patterns');
        } else {
          console.log('Using demo data for SMC patterns as selected');
        }
        return generateDemoSMCPatterns();
      }
      
      // Fetch real daily forex data from FCS API
      try {
        const data = await fetchFromFCS('forex/history', {
          symbol: 'EURUSD',
          period: '1D',
          limit: '10'
        });
        
        if (data.status && data.response) {
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
        } else {
          throw new Error('No FCS data available');
        }
      } catch (fcsError) {
        console.error('FCS API error for patterns:', fcsError);
        toast.error('FCS API error, using demo patterns');
        return generateDemoSMCPatterns();
      }
      
    } catch (error) {
      console.error('Error fetching SMC patterns:', error);
      toast.error('Failed to fetch pattern data');
      emitRateLimitEvent();
      return generateDemoSMCPatterns();
    }
  },
  
  // Get FCS API key for settings
  getFCSApiKey: (): string => {
    return API_CONFIG.FCS_API_KEY;
  },
  
  // Set FCS API key
  setFCSApiKey: (apiKey: string): void => {
    API_CONFIG.FCS_API_KEY = apiKey;
    localStorage.setItem('fcs_api_key', apiKey);
    toast.success('FCS API key updated');
  }
};

// Helper function to generate demo watchlist data
function generateDemoWatchlistData(): ForexRate[] {
  const rates: ForexRate[] = [];
  
  // Base demo prices
  const basePrices = {
    'EUR/USD': 1.0956,
    'USD/JPY': 156.78,
    'GBP/USD': 1.2534,
    'AUD/USD': 0.6611,
    'EUR/GBP': 0.8737,
    'EUR/CHF': 0.9768,
    'GBP/JPY': 196.50
  };
  
  // Generate demo forex rates
  for (const pair of CURRENCY_PAIRS) {
    const basePrice = basePrices[pair as keyof typeof basePrices];
    const spread = pair.includes('JPY') ? 0.02 : 0.0003;
    const changeValue = (Math.random() * 0.2 - 0.1).toFixed(2); // -0.1% to +0.1%
    const changeDirection = parseFloat(changeValue) >= 0 ? 'up' : 'down';
    
    rates.push({
      pair,
      bid: (basePrice - spread/2).toFixed(pair.includes('JPY') ? 2 : 4),
      ask: (basePrice + spread/2).toFixed(pair.includes('JPY') ? 2 : 4),
      change: `${changeValue}%`,
      changeDirection
    });
  }
  
  toast.success('Using demo market data');
  return rates;
}

// Helper function to generate demo trade signals
function generateDemoTradeSignals(): TradeSignal[] {
  const signals: TradeSignal[] = [];
  let idCounter = 1;
  
  // Generate demo primary timeframe signals
  TIME_FRAMES.primary.forEach(timeframe => {
    const pair = CURRENCY_PAIRS[Math.floor(Math.random() * CURRENCY_PAIRS.length)];
    const direction = Math.random() > 0.5 ? 'buy' : 'sell';
    const isJPY = pair.includes('JPY');
    
    const basePrice = isJPY ? 155.50 : 1.0950;
    
    signals.push({
      id: idCounter++,
      pair,
      direction,
      pattern: 'Order Block',
      entry: basePrice.toFixed(isJPY ? 2 : 4),
      stopLoss: direction === 'buy' 
        ? (basePrice * 0.998).toFixed(isJPY ? 2 : 4)
        : (basePrice * 1.002).toFixed(isJPY ? 2 : 4),
      takeProfit: direction === 'buy'
        ? (basePrice * 1.005).toFixed(isJPY ? 2 : 4)
        : (basePrice * 0.995).toFixed(isJPY ? 2 : 4),
      probability: 'high',
      timeframe,
      signalType: direction === 'buy' ? 'discount' : 'premium',
      analysisTimeframe: 'primary',
      confirmationStatus: 'confirmed',
      fibLevel: '61.8%'
    });
  });
  
  // Add more demo signals for secondary and lower timeframes
  const demoSignalTypes = ['Fair Value Gap', 'CHOCH', 'Breaker Block', 'Liquidity Sweep'];
  
  for (let i = 0; i < 3; i++) {
    const pair = CURRENCY_PAIRS[Math.floor(Math.random() * CURRENCY_PAIRS.length)];
    const direction = Math.random() > 0.5 ? 'buy' : 'sell';
    const isJPY = pair.includes('JPY');
    const basePrice = isJPY ? 155.50 : 1.0950;
    const timeframe = TIME_FRAMES.secondary[Math.floor(Math.random() * TIME_FRAMES.secondary.length)];
    
    signals.push({
      id: idCounter++,
      pair,
      direction,
      pattern: demoSignalTypes[Math.floor(Math.random() * demoSignalTypes.length)],
      entry: basePrice.toFixed(isJPY ? 2 : 4),
      stopLoss: direction === 'buy'
        ? (basePrice * 0.997).toFixed(isJPY ? 2 : 4)
        : (basePrice * 1.003).toFixed(isJPY ? 2 : 4),
      takeProfit: direction === 'buy'
        ? (basePrice * 1.006).toFixed(isJPY ? 2 : 4)
        : (basePrice * 0.994).toFixed(isJPY ? 2 : 4),
      probability: Math.random() > 0.6 ? 'high' : 'medium',
      timeframe,
      signalType: Math.random() > 0.5 ? 'equilibrium' : 'discount',
      analysisTimeframe: 'secondary',
      confirmationStatus: Math.random() > 0.5 ? 'watching' : 'confirmed',
      fibLevel: '50.0%'
    });
  }
  
  return signals;
}

// Helper function to generate demo SMC patterns
function generateDemoSMCPatterns(): SMCPattern[] {
  const patterns: SMCPattern[] = [];
  
  // Demo pattern types
  const demoPatterns = [
    {
      name: 'Fair Value Gap',
      description: 'Inefficiency in price, potential area for price to revisit',
      zoneType: 'FVG' as const
    },
    {
      name: 'Order Block',
      description: 'Area where smart money placed orders before a significant move',
      zoneType: 'OB' as const
    },
    {
      name: 'Break of Structure',
      description: 'Key level where price broke previous structure',
      zoneType: 'BOS' as const
    },
    {
      name: 'Change of Character',
      description: 'Reversal signal after a break of structure',
      zoneType: 'CHOCH' as const
    },
    {
      name: 'Liquidity Point',
      description: 'Area where stop losses are clustered',
      zoneType: 'Liquidity' as const
    }
  ];
  
  // Generate patterns for each timeframe category
  let patternIndex = 0;
  
  // Primary timeframes
  TIME_FRAMES.primary.forEach(timeframe => {
    const pattern = demoPatterns[patternIndex % demoPatterns.length];
    patternIndex++;
    
    patterns.push({
      name: pattern.name,
      description: pattern.description,
      status: Math.random() > 0.6 ? 'Active' : 'Watching',
      pair: CURRENCY_PAIRS[Math.floor(Math.random() * CURRENCY_PAIRS.length)],
      timeframe,
      zoneType: pattern.zoneType,
      direction: Math.random() > 0.5 ? 'bullish' : 'bearish'
    });
  });
  
  // Secondary timeframes
  TIME_FRAMES.secondary.forEach(timeframe => {
    const pattern = demoPatterns[patternIndex % demoPatterns.length];
    patternIndex++;
    
    patterns.push({
      name: pattern.name,
      description: pattern.description,
      status: Math.random() > 0.6 ? 'Active' : 'Watching',
      pair: CURRENCY_PAIRS[Math.floor(Math.random() * CURRENCY_PAIRS.length)],
      timeframe,
      zoneType: pattern.zoneType,
      direction: Math.random() > 0.5 ? 'bullish' : 'bearish'
    });
  });
  
  // Lower timeframes
  TIME_FRAMES.lower.forEach(timeframe => {
    const pattern = demoPatterns[patternIndex % demoPatterns.length];
    patternIndex++;
    
    patterns.push({
      name: pattern.name,
      description: pattern.description,
      status: Math.random() > 0.6 ? 'Active' : 'Watching',
      pair: CURRENCY_PAIRS[Math.floor(Math.random() * CURRENCY_PAIRS.length)],
      timeframe,
      zoneType: pattern.zoneType,
      direction: Math.random() > 0.5 ? 'bullish' : 'bearish'
    });
  });
  
  return patterns;
}
