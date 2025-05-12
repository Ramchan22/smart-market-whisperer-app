
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

const Index = () => {
  const [dataProvider, setDataProvider] = useState('demo');
  const [rateLimitReached, setRateLimitReached] = useState(false);
  
  // Check data provider on component mount and if it changes
  useEffect(() => {
    const provider = marketDataService.getDataProvider();
    setDataProvider(provider);
    
    // Set up an event listener for API rate limit reached
    const handleRateLimit = () => {
      setRateLimitReached(true);
    };
    
    // Add event listener for custom rate limit event
    window.addEventListener('alphavantage-rate-limit', handleRateLimit);
    
    return () => {
      window.removeEventListener('alphavantage-rate-limit', handleRateLimit);
    };
  }, []);

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      <main className="container mx-auto px-4 py-6 flex-1">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Smart Money Concepts Forex Analysis</h1>
          
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="flex items-center">
                  <Badge 
                    variant={dataProvider === 'alphavantage' ? 'default' : 'outline'}
                    className="gap-1 cursor-help"
                  >
                    <Info className="h-3 w-3" />
                    {dataProvider === 'alphavantage' ? 'Live Data' : 'Demo Data'}
                  </Badge>
                  
                  {rateLimitReached && (
                    <Badge variant="destructive" className="ml-2">
                      API Limit Reached
                    </Badge>
                  )}
                </div>
              </TooltipTrigger>
              <TooltipContent>
                {dataProvider === 'alphavantage' ? (
                  <>
                    {rateLimitReached 
                      ? 'Alpha Vantage API limit reached. Some data is being simulated.' 
                      : 'Using Alpha Vantage live market data.'}
                  </>
                ) : (
                  'Using demo data. Switch to live data in Settings.'
                )}
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          <div className="lg:col-span-2">
            <ForexChart />
          </div>
          <div>
            <TradeSuggestions />
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
