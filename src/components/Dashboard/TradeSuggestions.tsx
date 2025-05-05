
import React from 'react';
import { TrendingUp, TrendingDown, ChartBar, ArrowRight } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

// Mock trade suggestions based on SMC patterns
const tradeSuggestions = [
  {
    id: 1,
    pair: 'EUR/USD',
    direction: 'buy',
    pattern: 'Order Block',
    entry: '1.0921',
    stopLoss: '1.0890',
    takeProfit: '1.0970',
    probability: 'high',
    timeframe: '1H',
  },
  {
    id: 2,
    pair: 'GBP/USD',
    direction: 'sell',
    pattern: 'Liquidity Grab',
    entry: '1.2650',
    stopLoss: '1.2685',
    takeProfit: '1.2590',
    probability: 'medium',
    timeframe: '4H',
  },
  {
    id: 3,
    pair: 'USD/JPY',
    direction: 'buy',
    pattern: 'Fair Value Gap',
    entry: '149.50',
    stopLoss: '149.20',
    takeProfit: '150.20',
    probability: 'medium',
    timeframe: '1D',
  }
];

const TradeSuggestions = () => {
  return (
    <div className="bg-card rounded-lg p-4 shadow-md h-full">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-semibold">SMC Trade Signals</h2>
        <Button variant="ghost" size="sm" className="text-xs">
          Refresh <ArrowRight className="ml-1 h-3 w-3" />
        </Button>
      </div>
      
      <div className="space-y-4">
        {tradeSuggestions.map((trade) => (
          <div key={trade.id} className="border border-border rounded-md p-3 card-hover">
            <div className="flex justify-between items-start mb-2">
              <div className="flex items-center">
                <span className="font-medium">{trade.pair}</span>
                <Badge 
                  variant={trade.direction === 'buy' ? 'default' : 'destructive'}
                  className="ml-2"
                >
                  {trade.direction === 'buy' ? (
                    <TrendingUp className="h-3 w-3 mr-1" />
                  ) : (
                    <TrendingDown className="h-3 w-3 mr-1" />
                  )}
                  {trade.direction.toUpperCase()}
                </Badge>
              </div>
              <Badge variant="outline">{trade.timeframe}</Badge>
            </div>
            
            <div className="text-sm">
              <div className="flex items-center mb-1">
                <span className="text-muted-foreground w-24">Pattern:</span>
                <span>{trade.pattern}</span>
              </div>
              <div className="flex items-center mb-1">
                <span className="text-muted-foreground w-24">Entry:</span>
                <span className="font-mono">{trade.entry}</span>
              </div>
              <div className="flex items-center mb-1">
                <span className="text-muted-foreground w-24">Stop Loss:</span>
                <span className="font-mono text-destructive">{trade.stopLoss}</span>
              </div>
              <div className="flex items-center mb-1">
                <span className="text-muted-foreground w-24">Take Profit:</span>
                <span className="font-mono text-primary">{trade.takeProfit}</span>
              </div>
              <div className="flex items-center">
                <span className="text-muted-foreground w-24">Probability:</span>
                <Badge variant="secondary" className="capitalize">
                  {trade.probability}
                </Badge>
              </div>
            </div>
            
            <Button className="w-full mt-3" size="sm" variant={trade.direction === 'buy' ? 'default' : 'destructive'}>
              <ChartBar className="h-4 w-4 mr-2" />
              View Analysis
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default TradeSuggestions;
