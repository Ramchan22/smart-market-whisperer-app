
import React, { useState, useEffect } from 'react';
import Header from '@/components/Layout/Header';
import Footer from '@/components/Layout/Footer';
import ForexChart from '@/components/Dashboard/ForexChart';
import TradeSuggestions from '@/components/Dashboard/TradeSuggestions';
import WatchList from '@/components/Dashboard/WatchList';
import SMCPatterns from '@/components/Dashboard/SMCPatterns';
import { Badge } from '@/components/ui/badge';
import { Info } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { marketDataService } from '@/services/marketDataService';

interface ChartDataPoint {
  time: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume?: number;
}

const Index = () => {
  const [rateLimitReached, setRateLimitReached] = useState(false);
  const [chartData, setChartData] = useState<ChartDataPoint[]>([]);
  const [currentPair, setCurrentPair] = useState('GBPUSD');
  const [isChartLoading, setIsChartLoading] = useState(false);
  
  // Check rate limit status on component mount
  useEffect(() => {
    setRateLimitReached(marketDataService.isRateLimitReached());
    
    // Set up an event listener for API rate limit reached
    const handleRateLimit = () => {
      setRateLimitReached(true);
    };
    
    // Add event listener for FCS rate limit event
    window.addEventListener('fcs-rate-limit', handleRateLimit);
    
    return () => {
      window.removeEventListener('fcs-rate-limit', handleRateLimit);
    };
  }, []);

  // Handle chart data updates from ForexChart component
  const handleChartDataUpdate = (data: ChartDataPoint[], pair: string, loading: boolean) => {
    setChartData(data);
    setCurrentPair(pair);
    setIsChartLoading(loading);
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      <main className="container mx-auto px-4 py-6 flex-1">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Smart Money Concepts Forex Analysis</h1>
          
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="flex items-center gap-2">
                  <Badge 
                    variant="default"
                    className="gap-1 cursor-help bg-blue-500"
                  >
                    <Info className="h-3 w-3" />
                    FCS API Live Data
                  </Badge>
                  
                  {rateLimitReached && (
                    <Badge variant="destructive" className="bg-orange-500">
                      API Limit Reached
                    </Badge>
                  )}
                </div>
              </TooltipTrigger>
              <TooltipContent>
                {rateLimitReached 
                  ? 'FCS API rate limit reached. Live data temporarily unavailable.' 
                  : 'Using FCS API for live forex market data and analysis.'}
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          <div className="lg:col-span-2">
            <ForexChart onDataUpdate={handleChartDataUpdate} />
          </div>
          <div>
            <TradeSuggestions 
              chartData={chartData}
              currentPair={currentPair}
              isLoading={isChartLoading}
              dataProvider="fcs"
            />
          </div>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <WatchList />
          </div>
          <div>
            <SMCPatterns />
          </div>
        </div>
      </main>
      
      <Footer />
    </div>
  );
};

export default Index;
