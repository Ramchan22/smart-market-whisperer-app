
import { toast } from 'sonner';
import { fetchFromFCS, CURRENCY_PAIRS } from '../api/dataFetcher';
import { ForexRate } from '../types/marketTypes';

// Fetch current forex rates for watchlist using FCS API
export const fetchWatchlistData = async (): Promise<ForexRate[]> => {
  try {
    console.log('Fetching watchlist data from FCS API...');
    
    const rates: ForexRate[] = [];
    
    for (let i = 0; i < CURRENCY_PAIRS.length; i++) {
      const pair = CURRENCY_PAIRS[i];
      
      try {
        console.log(`Fetching data for ${pair} (${i + 1}/${CURRENCY_PAIRS.length})...`);
        
        // Use the pair format directly as FCS API expects 'GBP/JPY' format
        const data = await fetchFromFCS('forex/latest', { 
          symbol: pair
        });
        
        if (data.status && data.response && data.response.length > 0) {
          const item = data.response[0];
          const price = parseFloat(item.c);
          const change = parseFloat(item.ch);
          const changePercent = parseFloat(item.cp);
          
          rates.push({
            pair,
            bid: (price - 0.0002).toFixed(pair.includes('JPY') ? 2 : 4),
            ask: price.toFixed(pair.includes('JPY') ? 2 : 4),
            change: `${changePercent.toFixed(2)}%`,
            changeDirection: change >= 0 ? 'up' : 'down'
          });
        }
        
      } catch (error) {
        console.error(`Failed to fetch ${pair}:`, error);
        // Continue with other pairs even if one fails
      }
    }
    
    if (rates.length > 0) {
      toast.success(`Loaded ${rates.length} live forex rates from FCS API`);
    } else {
      toast.error('No live forex data available');
    }
    
    return rates;
    
  } catch (error) {
    console.error('Error fetching forex data:', error);
    toast.error('Failed to fetch live market data');
    return [];
  }
};
