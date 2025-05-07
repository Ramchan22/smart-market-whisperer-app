
import React, { useState, useEffect } from 'react';
import { TrendingUp, TrendingDown, Loader2 } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { marketDataService, ForexRate } from '@/services/marketDataService';

const WatchList = () => {
  const [watchlistData, setWatchlistData] = useState<ForexRate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const loadWatchlistData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const data = await marketDataService.fetchWatchlistData();
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
                <TableHead>Signal Strength</TableHead>
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
                      {item.changeDirection === 'up' ? (
                        <TrendingUp className="h-4 w-4 text-primary mr-1" />
                      ) : (
                        <TrendingDown className="h-4 w-4 text-destructive mr-1" />
                      )}
                      <span className={item.changeDirection === 'up' ? 'text-primary' : 'text-destructive'}>
                        {item.change}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center justify-between">
                      <span>
                        {Math.abs(parseFloat(item.change)) > 0.15 ? 'Strong' : 
                         Math.abs(parseFloat(item.change)) > 0.05 ? 'Medium' : 'Weak'}
                      </span>
                      <span className={`text-xs px-2 py-1 rounded ${
                        Math.abs(parseFloat(item.change)) > 0.15 ? 'bg-primary/20 text-primary' :
                        Math.abs(parseFloat(item.change)) > 0.05 ? 'bg-yellow-500/20 text-yellow-500' :
                        'bg-destructive/20 text-destructive'
                      }`}>
                        {Math.abs(parseFloat(item.change)) > 0.15 ? 'Strong' : 
                         Math.abs(parseFloat(item.change)) > 0.05 ? 'Medium' : 'Weak'}
                      </span>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              
              {watchlistData.length === 0 && !loading && (
                <TableRow>
                  <TableCell colSpan={5} className="h-24 text-center">
                    No market data available at the moment.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
};

export default WatchList;
