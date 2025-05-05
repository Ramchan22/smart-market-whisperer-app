
import React from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

// Mock watchlist data
const watchlistData = [
  { 
    pair: 'EUR/USD', 
    bid: '1.0921', 
    ask: '1.0924', 
    daily: { change: '+0.12%', direction: 'up' },
    smc: { pattern: 'Order Block', strength: 'Strong' }
  },
  { 
    pair: 'GBP/USD', 
    bid: '1.2645', 
    ask: '1.2648', 
    daily: { change: '-0.21%', direction: 'down' },
    smc: { pattern: 'Liquidity Zone', strength: 'Medium' }
  },
  { 
    pair: 'USD/JPY', 
    bid: '149.48', 
    ask: '149.52', 
    daily: { change: '+0.35%', direction: 'up' },
    smc: { pattern: 'FVG', strength: 'Strong' }
  },
  { 
    pair: 'AUD/USD', 
    bid: '0.6572', 
    ask: '0.6575', 
    daily: { change: '-0.15%', direction: 'down' },
    smc: { pattern: 'Breaker Block', strength: 'Weak' }
  },
  { 
    pair: 'USD/CAD', 
    bid: '1.3645', 
    ask: '1.3649', 
    daily: { change: '+0.08%', direction: 'up' },
    smc: { pattern: 'Imbalance', strength: 'Medium' }
  },
];

const WatchList = () => {
  return (
    <div className="bg-card rounded-lg p-4 shadow-md">
      <h2 className="text-lg font-semibold mb-4">Forex Watchlist</h2>
      
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Pair</TableHead>
              <TableHead>Bid</TableHead>
              <TableHead>Ask</TableHead>
              <TableHead>Daily</TableHead>
              <TableHead>SMC Pattern</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {watchlistData.map((item) => (
              <TableRow key={item.pair} className="cursor-pointer hover:bg-secondary/30">
                <TableCell className="font-medium">{item.pair}</TableCell>
                <TableCell>{item.bid}</TableCell>
                <TableCell>{item.ask}</TableCell>
                <TableCell>
                  <div className="flex items-center">
                    {item.daily.direction === 'up' ? (
                      <TrendingUp className="h-4 w-4 text-primary mr-1" />
                    ) : (
                      <TrendingDown className="h-4 w-4 text-destructive mr-1" />
                    )}
                    <span className={item.daily.direction === 'up' ? 'text-primary' : 'text-destructive'}>
                      {item.daily.change}
                    </span>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center justify-between">
                    <span>{item.smc.pattern}</span>
                    <span className={`text-xs px-2 py-1 rounded ${
                      item.smc.strength === 'Strong' ? 'bg-primary/20 text-primary' :
                      item.smc.strength === 'Medium' ? 'bg-yellow-500/20 text-yellow-500' :
                      'bg-destructive/20 text-destructive'
                    }`}>
                      {item.smc.strength}
                    </span>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default WatchList;
