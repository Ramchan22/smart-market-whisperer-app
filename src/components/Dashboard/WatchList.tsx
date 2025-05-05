
import React, { useState, useEffect } from 'react';
import { TrendingUp, TrendingDown, Loader2 } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';

// Interface for watchlist item
interface WatchlistItem {
  pair: string;
  bid: string;
  ask: string;
  daily: { change: string; direction: 'up' | 'down' };
  smc: { pattern: string; strength: 'Strong' | 'Medium' | 'Weak' };
}

// Mock API function - In a real app, this would fetch from a forex data provider
const fetchWatchlistData = async (): Promise<WatchlistItem[]> => {
  // Simulate API call delay
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  // For now, we'll generate dynamic but mock data that simulates real market data
  const pairs = ['EUR/USD', 'GBP/USD', 'USD/JPY', 'AUD/USD', 'USD/CAD', 'NZD/USD', 'USD/CHF'];
  const patterns = ['Order Block', 'Liquidity Zone', 'FVG', 'Breaker Block', 'Imbalance', 'KL Sweep'];
  const strengths = ['Strong', 'Medium', 'Weak'];
  
  const data: WatchlistItem[] = [];
  
  // Generate dynamic data for each pair
  pairs.slice(0, 5 + Math.floor(Math.random() * 2)).forEach(pair => {
    let basePrice = 0;
    if (pair === 'EUR/USD') basePrice = 1.09 + (Math.random() * 0.02);
    else if (pair === 'GBP/USD') basePrice = 1.26 + (Math.random() * 0.02);
    else if (pair === 'USD/JPY') basePrice = 149 + (Math.random() * 2);
    else if (pair === 'AUD/USD') basePrice = 0.65 + (Math.random() * 0.02);
    else if (pair === 'USD/CAD') basePrice = 1.36 + (Math.random() * 0.02);
    else if (pair === 'NZD/USD') basePrice = 0.60 + (Math.random() * 0.01);
    else if (pair === 'USD/CHF') basePrice = 0.90 + (Math.random() * 0.01);
    
    const direction = Math.random() > 0.5 ? 'up' : 'down';
    const changePercent = (Math.random() * 0.5).toFixed(2);
    
    data.push({
      pair,
      bid: basePrice.toFixed(pair.includes('JPY') ? 2 : 4),
      ask: (basePrice + (pair.includes('JPY') ? 0.02 : 0.0003)).toFixed(pair.includes('JPY') ? 2 : 4),
      daily: {
        change: `${direction === 'up' ? '+' : '-'}${changePercent}%`,
        direction
      },
      smc: {
        pattern: patterns[Math.floor(Math.random() * patterns.length)],
        strength: strengths[Math.floor(Math.random() * strengths.length)] as 'Strong' | 'Medium' | 'Weak'
      }
    });
  });
  
  return data;
};

const WatchList = () => {
  const [watchlistData, setWatchlistData] = useState<WatchlistItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const loadWatchlistData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const data = await fetchWatchlistData();
      setWatchlistData(data);
    } catch (err) {
      console.error('Error fetching watchlist data:', err);
      setError('Failed to load market data. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  
  useEffect(() => {
    loadWatchlistData();
    
    // Refresh data every minute
    const intervalId = setInterval(loadWatchlistData, 60 * 1000);
    
    return () => clearInterval(intervalId);
  }, []);
  
  return (
    <div className="bg-card rounded-lg p-4 shadow-md">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-semibold">Forex Watchlist</h2>
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={loadWatchlistData} 
          disabled={loading}
        >
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Refresh"}
        </Button>
      </div>
      
      {error && (
        <div className="p-4 mb-4 text-sm border border-destructive/50 bg-destructive/10 text-destructive rounded-md">
          {error}
        </div>
      )}
      
      {loading && watchlistData.length === 0 ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : (
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
      )}
    </div>
  );
};

export default WatchList;
