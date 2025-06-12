import React, { useState, useEffect } from 'react';
import Header from '@/components/Layout/Header';
import Footer from '@/components/Layout/Footer';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import ApiKeyDisplay from '@/components/Settings/ApiKeyDisplay';
import { marketDataService } from '@/services/marketDataService';

const Settings = () => {
  const { toast } = useToast();
  const [dataProvider, setDataProvider] = useState('fcs');
  const [realTimeData, setRealTimeData] = useState(true);
  const [fcsApiKey, setFcsApiKey] = useState('hczDhp413qSmqzjLlVNuhRuFdwuJv');
  
  // Load current settings
  useEffect(() => {
    const currentProvider = marketDataService.getDataProvider();
    setDataProvider(currentProvider);
    setRealTimeData(currentProvider !== 'demo');
    
    // Load FCS API key from localStorage or use the configured one
    const savedFcsKey = localStorage.getItem('fcs_api_key');
    if (savedFcsKey) {
      setFcsApiKey(savedFcsKey);
    }
  }, []);

  const handleSave = () => {
    // Save all settings
    marketDataService.setDataProvider(dataProvider);
    
    // Save FCS API key if provided
    if (fcsApiKey && fcsApiKey !== 'YOUR_FCS_API_KEY') {
      marketDataService.setFCSApiKey(fcsApiKey);
    }
    
    toast({
      title: "Settings saved",
      description: "Your preferences have been updated successfully.",
    });
  };
  
  const handleDataProviderChange = (value: string) => {
    setDataProvider(value);
    setRealTimeData(value !== 'demo');
  };

  const handleFcsApiKeyChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFcsApiKey(e.target.value);
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      <main className="container mx-auto px-4 py-6 flex-1">
        <h1 className="text-2xl font-bold mb-6">Settings</h1>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Chart Preferences</CardTitle>
                <CardDescription>Customize how charts are displayed</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="default-pair">Default Currency Pair</Label>
                    <Select defaultValue="EURUSD">
                      <SelectTrigger id="default-pair">
                        <SelectValue placeholder="Select pair" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="EURUSD">EUR/USD</SelectItem>
                        <SelectItem value="GBPUSD">GBP/USD</SelectItem>
                        <SelectItem value="USDJPY">USD/JPY</SelectItem>
                        <SelectItem value="AUDUSD">AUD/USD</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="default-timeframe">Default Timeframe</Label>
                    <Select defaultValue="1h">
                      <SelectTrigger id="default-timeframe">
                        <SelectValue placeholder="Select timeframe" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="5m">5 Minutes</SelectItem>
                        <SelectItem value="15m">15 Minutes</SelectItem>
                        <SelectItem value="1h">1 Hour</SelectItem>
                        <SelectItem value="4h">4 Hours</SelectItem>
                        <SelectItem value="1d">Daily</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="chart-animations">Chart Animations</Label>
                    <Switch id="chart-animations" defaultChecked />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label>Chart Update Frequency</Label>
                  <Slider defaultValue={[3]} max={10} step={1} />
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>Slow (Low CPU)</span>
                    <span>Fast (High CPU)</span>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>SMC Analysis Settings</CardTitle>
                <CardDescription>Configure Smart Money Concepts analysis parameters</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="order-blocks">Order Block Detection</Label>
                    <Switch id="order-blocks" defaultChecked />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="fair-value-gaps">Fair Value Gaps</Label>
                    <Switch id="fair-value-gaps" defaultChecked />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="liquidity-sweeps">Liquidity Sweeps</Label>
                    <Switch id="liquidity-sweeps" defaultChecked />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="breaker-blocks">Breaker Blocks</Label>
                    <Switch id="breaker-blocks" defaultChecked />
                  </div>
                </div>
                
                <Separator className="my-4" />
                
                <div className="space-y-2">
                  <Label>Analysis Sensitivity</Label>
                  <Slider defaultValue={[70]} max={100} step={5} />
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>Less Patterns</span>
                    <span>More Patterns</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
          
          <div className="space-y-6">
            <ApiKeyDisplay />
            
            <Card>
              <CardHeader>
                <CardTitle>Notifications</CardTitle>
                <CardDescription>Configure alerts and notifications</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="pattern-alerts">Pattern Detection Alerts</Label>
                    <Switch id="pattern-alerts" defaultChecked />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="trade-signals">Trade Signals</Label>
                    <Switch id="trade-signals" defaultChecked />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="price-alerts">Price Alerts</Label>
                    <Switch id="price-alerts" />
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>API Settings</CardTitle>
                <CardDescription>Configure data provider settings</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="data-provider">Data Provider</Label>
                  <Select 
                    value={dataProvider} 
                    onValueChange={handleDataProviderChange}
                  >
                    <SelectTrigger id="data-provider">
                      <SelectValue placeholder="Select provider" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="fcs">FCS API (Recommended - Better Rate Limits)</SelectItem>
                      <SelectItem value="alphavantage">Alpha Vantage (5 requests/min limit)</SelectItem>
                      <SelectItem value="demo">Demo (Sample Data)</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">
                    FCS API supports batched requests for all currency pairs in one call, avoiding rate limits.
                  </p>
                </div>

                {dataProvider === 'fcs' && (
                  <div className="space-y-2">
                    <Label htmlFor="fcs-api-key">FCS API Key</Label>
                    <Input 
                      id="fcs-api-key" 
                      type="password" 
                      value={fcsApiKey}
                      onChange={handleFcsApiKeyChange}
                      placeholder="Enter your FCS API key" 
                    />
                    <p className="text-xs text-green-600">
                      ✓ FCS API key is configured and ready to use
                    </p>
                  </div>
                )}

                {dataProvider === 'alphavantage' && (
                  <div className="space-y-2">
                    <Label htmlFor="alpha-api-key">Alpha Vantage API Key</Label>
                    <Input id="alpha-api-key" type="password" value={marketDataService.getApiKey()} readOnly placeholder="Enter your API key" />
                    <p className="text-xs text-muted-foreground">
                      Note: Alpha Vantage has a 5 requests/minute limit on free tier
                    </p>
                  </div>
                )}
                
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="real-time-data">Real-time Data</Label>
                    <Switch 
                      id="real-time-data" 
                      checked={realTimeData}
                      onCheckedChange={(checked) => {
                        setRealTimeData(checked);
                        setDataProvider(checked ? 'fcs' : 'demo');
                      }}
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {realTimeData 
                      ? `Live trading data is enabled with ${dataProvider === 'fcs' ? 'FCS API' : 'Alpha Vantage API'}` 
                      : "Using demo data mode (no API calls)"}
                  </p>
                </div>

                {dataProvider !== 'demo' && (
                  <div className="p-3 bg-blue-50 rounded-md">
                    <p className="text-sm text-blue-800">
                      <strong>Rate Limit Info:</strong><br/>
                      • FCS API: Up to 500 requests/month (free tier)<br/>
                      • Alpha Vantage: 5 requests/minute, 25/day (free tier)
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
        
        <div className="flex justify-end mt-6 space-x-2">
          <Button variant="outline">Cancel</Button>
          <Button onClick={handleSave}>Save Settings</Button>
        </div>
      </main>
      
      <Footer />
    </div>
  );
};

export default Settings;
