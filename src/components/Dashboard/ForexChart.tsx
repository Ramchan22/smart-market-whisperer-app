
import React, { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer } from 'recharts';
import { marketDataService } from '@/services/marketDataService';
import { Loader2, TrendingUp, TrendingDown } from 'lucide-react';

const currencyPairs = [
  { value: 'EURUSD', label: 'EUR/USD' },
  { value: 'USDJPY', label: 'USD/JPY' },
  { value: 'GBPUSD', label: 'GBP/USD' },
  { value: 'AUDUSD', label: 'AUD/USD' },
  { value: 'EURGBP', label: 'EUR/GBP' },
  { value: 'EURCHF', label: 'EUR/CHF' },
  { value: 'GBPJPY', label: 'GBP/JPY' },
];

const timeframes = [
  { value: '1min', label: '1 Minute' },
  { value: '5min', label: '5 Minutes' },
  { value: '15min', label: '15 Minutes' },
  { value: '60min', label: '1 Hour' },
  { value: 'daily', label: 'Daily' },
];

interface ChartDataPoint {
  time: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume?: number;
}

interface ForexChartProps {
  onDataUpdate?: (data: ChartDataPoint[], pair: string, loading: boolean) => void;
}

const ForexChart: React.FC<ForexChartProps> = ({ onDataUpdate }) => {
  const [currencyPair, setCurrencyPair] = useState('EURUSD');
  const [timeframe, setTimeframe] = useState('daily');
  const [chartData, setChartData] = useState<ChartDataPoint[]>([]);
  const [loading, setLoading] = useState(false);
  const [currentPrice, setCurrentPrice] = useState<number | null>(null);
  const [priceChange, setPriceChange] = useState<number | null>(null);
  const [dataProvider, setDataProvider] = useState('demo');
  const { toast } = useToast();

  const fetchChartData = async () => {
    setLoading(true);
    
    // Notify parent component about loading state
    if (onDataUpdate) {
      onDataUpdate(chartData, currencyPair, true);
    }
    
    try {
      const provider = marketDataService.getDataProvider();
      setDataProvider(provider);

      if (provider === 'demo' || marketDataService.isRateLimitReached()) {
        // Generate demo chart data
        const demoData = generateDemoChartData();
        setChartData(demoData);
        setCurrentPrice(demoData[demoData.length - 1]?.close || 0);
        setPriceChange(Math.random() * 0.002 - 0.001); // Random change
        
        // Notify parent component
        if (onDataUpdate) {
          onDataUpdate(demoData, currencyPair, false);
        }
        return;
      }

      // Fetch live data from Alpha Vantage
      const baseCurrency = currencyPair.slice(0, 3);
      const quoteCurrency = currencyPair.slice(3);
      
      let apiFunction = 'FX_DAILY';
      if (timeframe === '1min') apiFunction = 'FX_INTRADAY&interval=1min';
      else if (timeframe === '5min') apiFunction = 'FX_INTRADAY&interval=5min';
      else if (timeframe === '15min') apiFunction = 'FX_INTRADAY&interval=15min';
      else if (timeframe === '60min') apiFunction = 'FX_INTRADAY&interval=60min';

      const response = await fetch(
        `https://www.alphavantage.co/query?function=${apiFunction}&from_symbol=${baseCurrency}&to_symbol=${quoteCurrency}&apikey=AP4TB68V97NKRA53`
      );
      const data = await response.json();

      console.log('Chart API response:', data);

      // Check for rate limit
      if (data['Information'] && data['Information'].includes('API rate limit')) {
        console.warn('API rate limit reached for chart data');
        toast({
          title: "API Limit Reached",
          description: "Using demo chart data instead",
          variant: "destructive"
        });
        const demoData = generateDemoChartData();
        setChartData(demoData);
        setCurrentPrice(demoData[demoData.length - 1]?.close || 0);
        setPriceChange(Math.random() * 0.002 - 0.001);
        
        // Notify parent component
        if (onDataUpdate) {
          onDataUpdate(demoData, currencyPair, false);
        }
        return;
      }

      // Parse the time series data
      let timeSeriesKey = 'Time Series FX (Daily)';
      if (timeframe.includes('min')) {
        timeSeriesKey = `Time Series FX (${timeframe === '1min' ? '1min' : timeframe === '5min' ? '5min' : timeframe === '15min' ? '15min' : '60min'})`;
      }

      const timeSeries = data[timeSeriesKey];
      if (!timeSeries) {
        throw new Error('No time series data available');
      }

      // Convert to chart format
      const processedData: ChartDataPoint[] = Object.entries(timeSeries)
        .slice(0, 30) // Last 30 data points
        .map(([time, values]: [string, any]) => ({
          time: new Date(time).toLocaleDateString(),
          open: parseFloat(values['1. open']),
          high: parseFloat(values['2. high']),
          low: parseFloat(values['3. low']),
          close: parseFloat(values['4. close']),
        }))
        .reverse(); // Show chronological order

      setChartData(processedData);
      
      if (processedData.length > 0) {
        const latest = processedData[processedData.length - 1];
        const previous = processedData[processedData.length - 2];
        setCurrentPrice(latest.close);
        setPriceChange(previous ? latest.close - previous.close : 0);
      }

      // Notify parent component with live data
      if (onDataUpdate) {
        onDataUpdate(processedData, currencyPair, false);
      }

      toast({
        title: "Live Data Loaded",
        description: `Chart updated with Alpha Vantage data for ${currencyPair}`,
      });

    } catch (error) {
      console.error('Error fetching chart data:', error);
      toast({
        title: "Error Loading Chart",
        description: "Using demo data instead",
        variant: "destructive"
      });
      
      // Fallback to demo data
      const demoData = generateDemoChartData();
      setChartData(demoData);
      setCurrentPrice(demoData[demoData.length - 1]?.close || 0);
      setPriceChange(Math.random() * 0.002 - 0.001);
      
      // Notify parent component
      if (onDataUpdate) {
        onDataUpdate(demoData, currencyPair, false);
      }
    } finally {
      setLoading(false);
    }
  };

  const generateDemoChartData = (): ChartDataPoint[] => {
    const data: ChartDataPoint[] = [];
    const basePrice = currencyPair.includes('JPY') ? 144.5 : 1.095;
    let currentPrice = basePrice;

    for (let i = 0; i < 30; i++) {
      const change = (Math.random() - 0.5) * 0.01;
      const open = currentPrice;
      const close = currentPrice + change;
      const high = Math.max(open, close) + Math.random() * 0.005;
      const low = Math.min(open, close) - Math.random() * 0.005;

      data.push({
        time: new Date(Date.now() - (29 - i) * 24 * 60 * 60 * 1000).toLocaleDateString(),
        open,
        high,
        low,
        close,
      });

      currentPrice = close;
    }

    return data;
  };

  useEffect(() => {
    fetchChartData();
  }, [currencyPair, timeframe]);

  const handlePairChange = (value: string) => {
    setCurrencyPair(value);
    toast({
      title: "Currency Pair Changed",
      description: `Now viewing ${value.slice(0, 3)}/${value.slice(3)}`,
      duration: 2000,
    });
  };

  const chartConfig = {
    close: {
      label: "Close Price",
      color: "hsl(var(--chart-1))",
    },
  };

  return (
    <div className="bg-card rounded-lg p-4 shadow-md">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-4 space-y-2 md:space-y-0">
        <div className="flex items-center gap-2">
          <h2 className="text-xl font-bold">{currencyPair.slice(0, 3)}/{currencyPair.slice(3)}</h2>
          <Badge variant={dataProvider === 'alphavantage' ? 'default' : 'outline'}>
            {dataProvider === 'alphavantage' ? 'Live' : 'Demo'}
          </Badge>
        </div>
        
        <div className="flex flex-wrap gap-2 items-center">
          <Select value={currencyPair} onValueChange={handlePairChange}>
            <SelectTrigger className="w-[140px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {currencyPairs.map((pair) => (
                <SelectItem key={pair.value} value={pair.value}>
                  {pair.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          <Select value={timeframe} onValueChange={setTimeframe}>
            <SelectTrigger className="w-[140px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {timeframes.map((tf) => (
                <SelectItem key={tf.value} value={tf.value}>
                  {tf.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          <Button 
            onClick={fetchChartData} 
            disabled={loading}
            variant="outline" 
            size="sm"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Refresh'}
          </Button>
        </div>
      </div>

      {currentPrice && (
        <div className="flex items-center gap-4 mb-4">
          <span className="text-2xl font-mono">
            {currentPrice.toFixed(currencyPair.includes('JPY') ? 2 : 4)}
          </span>
          {priceChange !== null && (
            <div className={`flex items-center gap-1 ${priceChange >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {priceChange >= 0 ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
              <span className="text-sm">
                {priceChange >= 0 ? '+' : ''}{priceChange.toFixed(currencyPair.includes('JPY') ? 2 : 4)}
              </span>
            </div>
          )}
        </div>
      )}
      
      <div className="h-[400px] w-full">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        ) : (
          <ChartContainer config={chartConfig}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="time" />
              <YAxis 
                domain={['dataMin - 0.001', 'dataMax + 0.001']}
                tickFormatter={(value) => value.toFixed(currencyPair.includes('JPY') ? 2 : 4)}
              />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Line 
                type="monotone" 
                dataKey="close" 
                stroke="var(--color-close)" 
                strokeWidth={2}
                dot={false}
              />
            </LineChart>
          </ChartContainer>
        )}
      </div>
      
      <div className="mt-4 flex flex-wrap gap-2">
        <Button variant="outline" size="sm">SMC Levels</Button>
        <Button variant="outline" size="sm">Order Blocks</Button>
        <Button variant="outline" size="sm">Supply/Demand</Button>
        <Button variant="outline" size="sm">Liquidity Sweeps</Button>
      </div>
    </div>
  );
};

export default ForexChart;
