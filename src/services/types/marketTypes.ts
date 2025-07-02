
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
  signalType: 'premium' | 'discount' | 'equilibrium' | 'liquidity-grab' | 'choch' | 'bos';
  analysisTimeframe: 'primary' | 'secondary' | 'lower';
  confirmationStatus: 'confirmed' | 'pending' | 'watching';
  fibLevel?: string;
  strategy?: 'primary' | 'fallback';
  confluenceScore?: number;
}

export interface SMCPattern {
  name: string;
  description: string;
  status: 'Detected' | 'Pending' | 'Active' | 'Watching';
  pair: string;
  timeframe: string;
  zoneType: 'FVG' | 'OB' | 'BOS' | 'Liquidity' | 'CHOCH' | 'Equilibrium';
  direction: 'bullish' | 'bearish' | 'neutral';
}
