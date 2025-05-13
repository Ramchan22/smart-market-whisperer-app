
import React from 'react';
import { marketDataService } from '@/services/marketDataService';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Copy, CheckCircle, ExternalLink, RefreshCw, AlertCircle } from 'lucide-react';
import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';

const ApiKeyDisplay = () => {
  const [copied, setCopied] = useState(false);
  const [dataProvider, setDataProvider] = useState('alphavantage'); // Default to live
  const [rateLimitReached, setRateLimitReached] = useState(false);
  const apiKey = marketDataService.getApiKey();
  
  // Get the current data provider and rate limit status on component mount
  useEffect(() => {
    setDataProvider(marketDataService.getDataProvider());
    setRateLimitReached(marketDataService.isRateLimitReached());
    
    // Listen for rate limit events
    const handleRateLimit = () => {
      setRateLimitReached(true);
    };
    
    window.addEventListener('alphavantage-rate-limit', handleRateLimit);
    
    return () => {
      window.removeEventListener('alphavantage-rate-limit', handleRateLimit);
    };
  }, []);
  
  const handleCopy = () => {
    navigator.clipboard.writeText(apiKey);
    setCopied(true);
    toast.success('API key copied to clipboard');
    
    setTimeout(() => {
      setCopied(false);
    }, 2000);
  };
  
  const openAlphaVantageWebsite = () => {
    window.open('https://www.alphavantage.co/premium/', '_blank');
  };
  
  const resetRateLimit = () => {
    marketDataService.resetRateLimitStatus();
    setRateLimitReached(false);
    toast.success('API rate limit status has been reset. You can now try live data again.');
  };
  
  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <div>
            <CardTitle>Alpha Vantage API Key</CardTitle>
            <CardDescription>Your API key for accessing live market data</CardDescription>
          </div>
          
          <div className="flex items-center gap-2">
            <Badge variant={dataProvider === 'alphavantage' ? 'default' : 'outline'}>
              {dataProvider === 'alphavantage' ? 'Live' : 'Demo'}
            </Badge>
            
            {rateLimitReached && (
              <Badge variant="destructive">Rate Limited</Badge>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2">
          <Input 
            value={apiKey} 
            readOnly 
            className="font-mono" 
          />
          <Button variant="outline" size="icon" onClick={handleCopy}>
            {copied ? <CheckCircle className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
          </Button>
        </div>
        
        <div className="space-y-2">
          <p className="text-sm text-muted-foreground">
            This key is used to access Alpha Vantage's forex data APIs.
            <br/>
            {dataProvider === 'demo' ? (
              "You're currently using demo data. Switch to Alpha Vantage in settings to use this API key."
            ) : (
              "You're now using live market data where available."
            )}
          </p>
          
          {rateLimitReached && (
            <div className="bg-destructive/10 text-destructive rounded p-3 text-sm">
              <div className="flex items-start gap-2">
                <AlertCircle className="h-4 w-4 mt-0.5" />
                <div>
                  <strong>API Rate Limit Reached:</strong> Standard free accounts are limited to 25 requests per day.
                  <div className="flex items-center gap-3 mt-2">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="text-destructive border-destructive/30 flex items-center gap-1"
                      onClick={openAlphaVantageWebsite}
                    >
                      Upgrade to Premium <ExternalLink className="h-3 w-3 ml-1" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex items-center gap-1"
                      onClick={resetRateLimit}
                    >
                      <RefreshCw className="h-3 w-3 mr-1" />
                      Reset Rate Limit
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </CardContent>
      
      {rateLimitReached && (
        <CardFooter className="bg-muted/50 pt-3">
          <p className="text-xs text-muted-foreground">
            Note: Resetting the rate limit tracker will let you attempt to use live data again, but 
            if the actual API limit is reached, you'll be automatically switched back to demo data.
          </p>
        </CardFooter>
      )}
    </Card>
  );
};

export default ApiKeyDisplay;
