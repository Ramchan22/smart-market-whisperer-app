
import React, { useState, useEffect } from 'react';
import { TrendingUp, TrendingDown, ChartBar, ArrowRight, Loader2, Filter } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

// Interface for trade signals
interface TradeSignal {
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

// Mock API function - In a real app, this would connect to a backend API
// that processes TradingView data and generates SMC-based trade signals
const fetchTradeSignals = async (): Promise<TradeSignal[]> => {
  // Simulate API call delay
  await new Promise(resolve => setTimeout(resolve, 1500));
  
  // For now, we'll generate dynamic but mock data that simulates real trades
  // In a real implementation, this would come from your backend API processing TradingView data
  const pairs = ['EUR/USD', 'GBP/USD', 'USD/JPY', 'AUD/USD', 'USD/CAD'];
  const patterns = ['Order Block', 'Fair Value Gap', 'Liquidity Grab', 'Breaker Block', 'Imbalance'];
  const timeframes = ['15m', '1H', '4H', '1D'];
  
  const signals: TradeSignal[] = [];
  
  // Generate 3-5 random signals
  const signalCount = Math.floor(Math.random() * 3) + 3;
  
  for (let i = 1; i <= signalCount; i++) {
    const pair = pairs[Math.floor(Math.random() * pairs.length)];
    const direction = Math.random() > 0.5 ? 'buy' : 'sell';
    
    // Generate realistic prices
    let basePrice = 0;
    if (pair === 'EUR/USD') basePrice = 1.09 + (Math.random() * 0.02);
    else if (pair === 'GBP/USD') basePrice = 1.26 + (Math.random() * 0.02);
    else if (pair === 'USD/JPY') basePrice = 149 + (Math.random() * 2);
    else if (pair === 'AUD/USD') basePrice = 0.65 + (Math.random() * 0.02);
    else if (pair === 'USD/CAD') basePrice = 1.36 + (Math.random() * 0.02);
    
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
};

const TradeSuggestions = () => {
  const [tradeSuggestions, setTradeSuggestions] = useState<TradeSignal[]>([]);
  const [filteredSuggestions, setFilteredSuggestions] = useState<TradeSignal[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currencyPairFilter, setCurrencyPairFilter] = useState<string | null>(null);
  const [probabilityFilter, setProbabilityFilter] = useState<{
    high: boolean;
    medium: boolean;
    low: boolean;
  }>({
    high: true,
    medium: true,
    low: true,
  });
  const { toast } = useToast();
  
  const loadTradeSignals = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const signals = await fetchTradeSignals();
      setTradeSuggestions(signals);
      applyFilters(signals, currencyPairFilter, probabilityFilter);
      toast({
        title: "Trade Signals Updated",
        description: `Found ${signals.length} potential trading opportunities.`,
        duration: 3000,
      });
    } catch (err) {
      console.error('Error fetching trade signals:', err);
      setError('Failed to load trade signals. Please try again.');
      toast({
        title: "Error",
        description: "Failed to load trade signals. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };
  
  useEffect(() => {
    loadTradeSignals();
    
    // Refresh signals every 5 minutes
    const intervalId = setInterval(loadTradeSignals, 5 * 60 * 1000);
    
    return () => clearInterval(intervalId);
  }, []);
  
  useEffect(() => {
    // Apply filters whenever they change
    applyFilters(tradeSuggestions, currencyPairFilter, probabilityFilter);
  }, [currencyPairFilter, probabilityFilter]);
  
  // Extract unique currency pairs from trade suggestions
  const uniquePairs = Array.from(new Set(tradeSuggestions.map(signal => signal.pair)));
  
  // Function to apply both filters
  const applyFilters = (
    signals: TradeSignal[], 
    pairFilter: string | null, 
    probFilter: {high: boolean; medium: boolean; low: boolean;}
  ) => {
    let filtered = [...signals];
    
    // Apply currency pair filter if selected
    if (pairFilter) {
      filtered = filtered.filter(signal => signal.pair === pairFilter);
    }
    
    // Apply probability filters
    filtered = filtered.filter(signal => probFilter[signal.probability]);
    
    setFilteredSuggestions(filtered);
  };
  
  // Handle probability filter change
  const toggleProbabilityFilter = (value: 'high' | 'medium' | 'low') => {
    const updatedFilter = {
      ...probabilityFilter,
      [value]: !probabilityFilter[value]
    };
    setProbabilityFilter(updatedFilter);
  };
  
  // Clear all filters
  const clearFilters = () => {
    setCurrencyPairFilter(null);
    setProbabilityFilter({ high: true, medium: true, low: true });
  };
  
  return (
    <div className="bg-card rounded-lg p-4 shadow-md h-full">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-semibold">SMC Trade Signals</h2>
        <div className="flex items-center space-x-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="flex items-center gap-1">
                <Filter className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Filters</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>Currency Pair</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <div className="p-2">
                <Select 
                  value={currencyPairFilter || ''} 
                  onValueChange={(value) => setCurrencyPairFilter(value || null)}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="All Pairs" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All Pairs</SelectItem>
                    {uniquePairs.map(pair => (
                      <SelectItem key={pair} value={pair}>{pair}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <DropdownMenuLabel>Probability</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuCheckboxItem
                checked={probabilityFilter.high}
                onCheckedChange={() => toggleProbabilityFilter('high')}
              >
                High
              </DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem
                checked={probabilityFilter.medium}
                onCheckedChange={() => toggleProbabilityFilter('medium')}
              >
                Medium
              </DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem
                checked={probabilityFilter.low}
                onCheckedChange={() => toggleProbabilityFilter('low')}
              >
                Low
              </DropdownMenuCheckboxItem>
              <DropdownMenuSeparator />
              <div className="p-2">
                <Button 
                  variant="secondary" 
                  size="sm" 
                  className="w-full" 
                  onClick={clearFilters}
                >
                  Reset Filters
                </Button>
              </div>
            </DropdownMenuContent>
          </DropdownMenu>
          
          <Button 
            variant="ghost" 
            size="sm" 
            className="text-xs"
            onClick={loadTradeSignals}
            disabled={loading}
          >
            {loading ? (
              <>
                <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                Loading...
              </>
            ) : (
              <>
                Refresh <ArrowRight className="ml-1 h-3 w-3" />
              </>
            )}
          </Button>
        </div>
      </div>
      
      {error && (
        <div className="p-4 mb-4 text-sm border border-destructive/50 bg-destructive/10 text-destructive rounded-md">
          {error}
        </div>
      )}
      
      {/* Show active filters if any */}
      {(currencyPairFilter || !Object.values(probabilityFilter).every(v => v)) && (
        <div className="flex flex-wrap gap-1 mb-3">
          {currencyPairFilter && (
            <Badge variant="outline" className="flex items-center gap-1">
              {currencyPairFilter}
              <button 
                className="ml-1 hover:text-destructive" 
                onClick={() => setCurrencyPairFilter(null)}
              >
                ×
              </button>
            </Badge>
          )}
          {!probabilityFilter.high && !probabilityFilter.medium && !probabilityFilter.low && (
            <Badge variant="outline" className="bg-destructive/10 text-destructive">
              No probability filters selected
            </Badge>
          )}
          {probabilityFilter.high && !probabilityFilter.medium && !probabilityFilter.low && (
            <Badge variant="outline">High probability only</Badge>
          )}
          {!probabilityFilter.high && probabilityFilter.medium && !probabilityFilter.low && (
            <Badge variant="outline">Medium probability only</Badge>
          )}
          {!probabilityFilter.high && !probabilityFilter.medium && probabilityFilter.low && (
            <Badge variant="outline">Low probability only</Badge>
          )}
        </div>
      )}
      
      {loading && filteredSuggestions.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary mb-2" />
          <p className="text-muted-foreground">Analyzing market patterns...</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredSuggestions.length > 0 ? (
            filteredSuggestions.map((trade) => (
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
            ))
          ) : (
            <div className="text-center py-8">
              <p className="text-muted-foreground">No trade signals match your current filters.</p>
              <Button variant="outline" size="sm" className="mt-2" onClick={clearFilters}>
                Clear Filters
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default TradeSuggestions;
