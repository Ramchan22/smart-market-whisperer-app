
import React from 'react';
import { marketDataService } from '@/services/marketDataService';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Copy, CheckCircle } from 'lucide-react';
import { useState, useEffect } from 'react';
import { toast } from 'sonner';

const ApiKeyDisplay = () => {
  const [copied, setCopied] = useState(false);
  const [dataProvider, setDataProvider] = useState('alphavantage'); // Default to live
  const apiKey = marketDataService.getApiKey();
  
  // Get the current data provider on component mount
  useEffect(() => {
    setDataProvider(marketDataService.getDataProvider());
  }, []);
  
  const handleCopy = () => {
    navigator.clipboard.writeText(apiKey);
    setCopied(true);
    toast.success('API key copied to clipboard');
    
    setTimeout(() => {
      setCopied(false);
    }, 2000);
  };
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>Alpha Vantage API Key</CardTitle>
        <CardDescription>Your API key for accessing live market data</CardDescription>
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
        <p className="text-sm text-muted-foreground">
          This key is used to access Alpha Vantage's forex data APIs.
          <br/>
          {dataProvider === 'demo' ? (
            "You're currently using demo data. Switch to Alpha Vantage in settings to use this API key."
          ) : (
            "You're now using live market data where available."
          )}
        </p>
      </CardContent>
    </Card>
  );
};

export default ApiKeyDisplay;
