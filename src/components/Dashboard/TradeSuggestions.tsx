
import React, { useState, useEffect } from 'react';
import { TrendingUp, TrendingDown, ChartBar, ArrowRight, Loader2, Filter, Check, AlertCircle } from 'lucide-react';
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
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { TradeSignal } from '@/services/marketDataService';
import { toast } from 'sonner';

interface ChartDataPoint {
  time: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume?: number;
}

interface TradeSuggestionsProps {
  chartData: ChartDataPoint[];
  currentPair: string;
  isLoading: boolean;
  dataProvider: string;
}

const TradeSuggestions: React.FC<TradeSuggestionsProps> = ({ 
  chartData, 
  currentPair, 
  isLoading, 
  dataProvider 
}) => {
  const [tradeSuggestions, setTradeSuggestions] = useState<TradeSignal[]>([]);
  const [filteredSuggestions, setFilteredSuggestions] = useState<TradeSignal[]>([]);
  const [currencyPairFilter, setCurrencyPairFilter] = useState<string | null>(null);
  const [isUsingDemoData, setIsUsingDemoData] = useState(false);
  const [probabilityFilter, setProbabilityFilter] = useState<{
    high: boolean;
    medium: boolean;
    low: boolean;
  }>({
    high: true,
    medium: true,
    low: true,
  });
  
  const [tempProbabilityFilter, setTempProbabilityFilter] = useState<{
    high: boolean;
    medium: boolean;
    low: boolean;
  }>({
    high: true,
    medium: true,
    low: true,
  });
  
  const [probabilityPopoverOpen, setProbabilityPopoverOpen] = useState(false);
  const { toast: useToastHook } = useToast();
  
  // Analyze chart data for SMC patterns and generate trade signals
  const analyzeChartData = (data: ChartDataPoint[], pair: string): TradeSignal[] => {
    if (!data || data.length < 3) return [];
    
    const signals: TradeSignal[] = [];
    let idCounter = Math.floor(Math.random() * 1000);
    
    // Get recent price data (last 5 candles)
    const recentData = data.slice(-5);
    const latest = recentData[recentData.length - 1];
    const previous = recentData[recentData.length - 2];
    
    if (!latest || !previous) return [];
    
    // Determine trend based on recent price action
    const priceChange = latest.close - previous.close;
    const isUptrend = priceChange > 0;
    const volatility = Math.abs(priceChange / previous.close);
    
    // Look for Fair Value Gaps (price gaps)
    for (let i = 0; i < recentData.length - 2; i++) {
      const candle1 = recentData[i];
      const candle2 = recentData[i + 1];
      const candle3 = recentData[i + 2];
      
      // Bullish FVG: candle1.low > candle3.high
      if (candle1.low > candle3.high && isUptrend) {
        const gapMidpoint = (candle1.low + candle3.high) / 2;
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
      
      // Bearish FVG: candle1.high < candle3.low
      if (candle1.high < candle3.low && !isUptrend) {
        const gapMidpoint = (candle1.high + candle3.low) / 2;
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
      const candle = recentData[i];
      const bodySize = Math.abs(candle.close - candle.open);
      const shadowSize = candle.high - candle.low;
      
      // Strong bullish candle with small shadows
      if (candle.close > candle.open && bodySize > shadowSize * 0.7 && isUptrend) {
        signals.push({
          id: idCounter++,
          pair,
          direction: 'buy',
          pattern: 'Order Block',
          entry: candle.open.toFixed(pair.includes('JPY') ? 2 : 4),
          stopLoss: (candle.low * 0.999).toFixed(pair.includes('JPY') ? 2 : 4),
          takeProfit: (candle.high * 1.002).toFixed(pair.includes('JPY') ? 2 : 4),
          probability: volatility > 0.008 ? 'high' : 'medium',
          timeframe: '4H',
          signalType: 'discount',
          analysisTimeframe: 'primary',
          confirmationStatus: 'watching'
        });
      }
      
      // Strong bearish candle
      if (candle.close < candle.open && bodySize > shadowSize * 0.7 && !isUptrend) {
        signals.push({
          id: idCounter++,
          pair,
          direction: 'sell',
          pattern: 'Order Block',
          entry: candle.open.toFixed(pair.includes('JPY') ? 2 : 4),
          stopLoss: (candle.high * 1.001).toFixed(pair.includes('JPY') ? 2 : 4),
          takeProfit: (candle.low * 0.998).toFixed(pair.includes('JPY') ? 2 : 4),
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
  
  // Helper function to get numerical priority for probability (for sorting)
  const getProbabilityPriority = (probability: string): number => {
    switch (probability) {
      case 'high': return 1;
      case 'medium': return 2;
      case 'low': return 3;
      default: return 4;
    }
  };
  
  // Update trade signals when chart data changes
  useEffect(() => {
    if (chartData && chartData.length > 0) {
      const signals = analyzeChartData(chartData, currentPair);
      setTradeSuggestions(signals);
      setIsUsingDemoData(dataProvider === 'demo');
      
      if (signals.length > 0) {
        toast.success(`Found ${signals.length} SMC signals for ${currentPair}`);
      }
    }
  }, [chartData, currentPair, dataProvider]);
  
  useEffect(() => {
    // Apply filters whenever they change
    applyFilters(tradeSuggestions, currencyPairFilter, probabilityFilter);
  }, [currencyPairFilter, probabilityFilter, tradeSuggestions]);
  
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
    filtered = filtered.filter(signal => {
      return probFilter[signal.probability];
    });
    
    // Sort by probability: high, then medium, then low
    filtered.sort((a, b) => {
      return getProbabilityPriority(a.probability) - getProbabilityPriority(b.probability);
    });
    
    setFilteredSuggestions(filtered);
  };
  
  // Handle temporary probability filter change
  const toggleTempProbabilityFilter = (value: 'high' | 'medium' | 'low') => {
    setTempProbabilityFilter(prev => ({
      ...prev,
      [value]: !prev[value]
    }));
  };
  
  // Apply the temporary probability filter
  const applyProbabilityFilter = () => {
    setProbabilityFilter({...tempProbabilityFilter});
    setProbabilityPopoverOpen(false);
  };
  
  // Clear all filters
  const clearFilters = () => {
    const defaultFilters = { high: true, medium: true, low: true };
    setCurrencyPairFilter(null);
    setProbabilityFilter(defaultFilters);
    setTempProbabilityFilter(defaultFilters);
    toast.success("Filters have been reset");
  };
  
  // Initialize temp filter when popover opens
  const handlePopoverOpen = (open: boolean) => {
    if (open) {
      setTempProbabilityFilter({...probabilityFilter});
    }
    setProbabilityPopoverOpen(open);
  };
  
  // Check if at least one probability filter is active
  const hasProbabilityFilter = probabilityFilter.high || probabilityFilter.medium || probabilityFilter.low;
  
  return (
    <div className="bg-card rounded-lg p-4 shadow-md h-full">
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center gap-2">
          <h2 className="text-lg font-semibold">SMC Trade Signals</h2>
          <Badge variant={dataProvider === 'alphavantage' ? 'default' : 'outline'}>
            {dataProvider === 'alphavantage' ? 'Live Analysis' : 'Demo Analysis'}
          </Badge>
        </div>
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
                  value={currencyPairFilter || 'all-pairs'} 
                  onValueChange={(value) => setCurrencyPairFilter(value === 'all-pairs' ? null : value)}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="All Pairs" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all-pairs">All Pairs</SelectItem>
                    {uniquePairs.map(pair => (
                      <SelectItem key={pair} value={pair}>{pair}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <DropdownMenuLabel>Probability</DropdownMenuLabel>
              <DropdownMenuSeparator />
              
              <div className="p-2">
                <Popover open={probabilityPopoverOpen} onOpenChange={handlePopoverOpen}>
                  <PopoverTrigger asChild>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="w-full flex justify-between"
                    >
                      Probability Options
                      <Filter className="h-3.5 w-3.5 ml-2" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-56 p-2" align="start">
                    <div className="space-y-2">
                      <div className="font-medium text-sm mb-2">Select Probability</div>
                      
                      <div className="flex items-center space-x-2">
                        <div 
                          className={`border rounded-md p-1.5 cursor-pointer ${
                            tempProbabilityFilter.high 
                              ? 'bg-primary text-primary-foreground border-primary' 
                              : 'border-input'
                          }`}
                          onClick={() => toggleTempProbabilityFilter('high')}
                        >
                          {tempProbabilityFilter.high && <Check className="h-3.5 w-3.5" />}
                        </div>
                        <span>High</span>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <div 
                          className={`border rounded-md p-1.5 cursor-pointer ${
                            tempProbabilityFilter.medium 
                              ? 'bg-primary text-primary-foreground border-primary' 
                              : 'border-input'
                          }`}
                          onClick={() => toggleTempProbabilityFilter('medium')}
                        >
                          {tempProbabilityFilter.medium && <Check className="h-3.5 w-3.5" />}
                        </div>
                        <span>Medium</span>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <div 
                          className={`border rounded-md p-1.5 cursor-pointer ${
                            tempProbabilityFilter.low 
                              ? 'bg-primary text-primary-foreground border-primary' 
                              : 'border-input'
                          }`}
                          onClick={() => toggleTempProbabilityFilter('low')}
                        >
                          {tempProbabilityFilter.low && <Check className="h-3.5 w-3.5" />}
                        </div>
                        <span>Low</span>
                      </div>
                      
                      <div className="pt-2">
                        <Button 
                          className="w-full" 
                          size="sm"
                          onClick={applyProbabilityFilter}
                        >
                          Apply Filters
                        </Button>
                      </div>
                    </div>
                  </PopoverContent>
                </Popover>
              </div>
              
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
        </div>
      </div>
      
      {/* Show active filters if any */}
      {(currencyPairFilter || !hasProbabilityFilter || (hasProbabilityFilter && (!probabilityFilter.high || !probabilityFilter.medium || !probabilityFilter.low))) && (
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
          {!hasProbabilityFilter && (
            <Badge variant="outline" className="bg-destructive/10 text-destructive">
              No probability filters selected
            </Badge>
          )}
          {hasProbabilityFilter && (
            <>
              {probabilityFilter.high && !probabilityFilter.medium && !probabilityFilter.low && (
                <Badge variant="outline">High probability only</Badge>
              )}
              {!probabilityFilter.high && probabilityFilter.medium && !probabilityFilter.low && (
                <Badge variant="outline">Medium probability only</Badge>
              )}
              {!probabilityFilter.high && !probabilityFilter.medium && probabilityFilter.low && (
                <Badge variant="outline">Low probability only</Badge>
              )}
              {probabilityFilter.high && probabilityFilter.medium && !probabilityFilter.low && (
                <Badge variant="outline">High & Medium probability</Badge>
              )}
              {probabilityFilter.high && !probabilityFilter.medium && probabilityFilter.low && (
                <Badge variant="outline">High & Low probability</Badge>
              )}
              {!probabilityFilter.high && probabilityFilter.medium && probabilityFilter.low && (
                <Badge variant="outline">Medium & Low probability</Badge>
              )}
            </>
          )}
        </div>
      )}
      
      {isLoading ? (
        <div className="flex flex-col items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary mb-2" />
          <p className="text-muted-foreground">Analyzing chart patterns...</p>
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
              <p className="text-muted-foreground">
                {chartData && chartData.length > 0 
                  ? "No SMC patterns detected in current chart data."
                  : "Waiting for chart data to analyze..."}
              </p>
              {chartData && chartData.length > 0 && (
                <Button variant="outline" size="sm" className="mt-2" onClick={clearFilters}>
                  Clear Filters
                </Button>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default TradeSuggestions;
