
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
import { TradeSignal, marketDataService } from '@/services/marketDataService';
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
  const [isLoadingSignals, setIsLoadingSignals] = useState(false);
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

  // Fetch trade signals for all currency pairs
  const fetchAllTradeSignals = async () => {
    setIsLoadingSignals(true);
    try {
      // Use the market data service to get signals for all pairs
      const signals = await marketDataService.fetchTradeSignals();
      setTradeSuggestions(signals);
      
      if (signals.length > 0) {
        toast.success(`Found ${signals.length} SMC signals across all currency pairs`);
      }
    } catch (error) {
      console.error('Error fetching trade signals:', error);
      toast.error('Failed to fetch trade signals');
    } finally {
      setIsLoadingSignals(false);
    }
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
  
  // Fetch signals on component mount and when data provider changes
  useEffect(() => {
    fetchAllTradeSignals();
  }, [dataProvider]);
  
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
          <Badge variant="default" className="bg-blue-500">
            Live Analysis
          </Badge>
        </div>
        <div className="flex items-center space-x-2">
          <Button 
            onClick={fetchAllTradeSignals} 
            disabled={isLoadingSignals}
            variant="outline" 
            size="sm"
          >
            {isLoadingSignals ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Refresh'}
          </Button>
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
      
      {isLoadingSignals ? (
        <div className="flex flex-col items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary mb-2" />
          <p className="text-muted-foreground">Fetching live trade signals...</p>
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
                {tradeSuggestions.length > 0 
                  ? "No signals match your current filters."
                  : "No SMC signals available at the moment."}
              </p>
              {tradeSuggestions.length > 0 && (
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
