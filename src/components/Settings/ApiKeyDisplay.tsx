
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
  const [dataProvider, setDataProvider] = useState('fcs');
  const [rateLimitReached, setRateLimitReached] = useState(false);
  const apiKey = marketDataService.getFCSApiKey();
  
  // Get the current data provider and rate limit status on component mount
  useEffect(() => {
    setDataProvider(marketDataService.getDataProvider());
    setRateLimitReached(marketDataService.isRateLimitReached());
    
    // Listen for rate limit events
    const handleRateLimit = () => {
      setRateLimitReached(true);
    };
    
    window.addEventListener('fcs-rate-limit', handleRateLimit);
    
    return () => {
      window.removeEventListener('fcs-rate-limit', handleRateLimit);
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
  
  const openFCSWebsite = () => {
    window.open('https://fcsapi.com/', '_blank');
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
            <CardTitle>FCS API Key</CardTitle>
            <CardDescription>Your API key for accessing live forex market data</CardDescription>
          </div>
          
          <div className="flex items-center gap-2">
            <Badge variant={dataProvider === 'fcs' ? 'default' : 'outline'}>
              {dataProvider === 'fcs' ? 'Live' : 'Demo'}
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
            This key is used to access FCS API's forex data endpoints.
            <br/>
            {dataProvider === 'demo' ? (
              "You're currently using demo data. Switch to FCS API in settings to use this API key."
            ) : (
              "You're now using live market data from FCS API."
            )}
          </p>
          
          {rateLimitReached && (
            <div className="bg-destructive/10 text-destructive rounded p-3 text-sm">
              <div className="flex items-start gap-2">
                <AlertCircle className="h-4 w-4 mt-0.5" />
                <div>
                  <strong>API Rate Limit Reached:</strong> FCS API free accounts are limited to 500 requests per month.
                  <div className="flex items-center gap-3 mt-2">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="text-destructive border-destructive/30 flex items-center gap-1"
                      onClick={openFCSWebsite}
                    >
                      Visit FCS API <ExternalLink className="h-3 w-3 ml-1" />
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
