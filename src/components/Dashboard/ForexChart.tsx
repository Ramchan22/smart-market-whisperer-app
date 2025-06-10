
import React, { useState, useEffect, useRef } from 'react';
import { useToast } from '@/hooks/use-toast';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
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
  { value: '1', label: '1 Minute' },
  { value: '5', label: '5 Minutes' },
  { value: '15', label: '15 Minutes' },
  { value: '60', label: '1 Hour' },
  { value: '240', label: '4 Hours' },
  { value: 'D', label: 'Daily' },
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
  const [timeframe, setTimeframe] = useState('D');
  const [chartData, setChartData] = useState<ChartDataPoint[]>([]);
  const [loading, setLoading] = useState(false);
  const [currentPrice, setCurrentPrice] = useState<number | null>(null);
  const [priceChange, setPriceChange] = useState<number | null>(null);
  const [dataProvider, setDataProvider] = useState('demo');
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  // Initialize TradingView widget
  useEffect(() => {
    if (chartContainerRef.current) {
      // Clear previous widget
      chartContainerRef.current.innerHTML = '';
      
      // Create TradingView widget script
      const script = document.createElement('script');
      script.src = 'https://s3.tradingview.com/external-embedding/embed-widget-advanced-chart.js';
      script.type = 'text/javascript';
      script.async = true;
      script.innerHTML = JSON.stringify({
        "autosize": true,
        "symbol": `FX:${currencyPair}`,
        "interval": timeframe,
        "timezone": "Etc/UTC",
        "theme": "dark",
        "style": "1",
        "locale": "en",
        "enable_publishing": false,
        "backgroundColor": "rgba(0, 0, 0, 0)",
        "gridColor": "rgba(240, 243, 250, 0.06)",
        "hide_top_toolbar": false,
        "hide_legend": false,
        "save_image": false,
        "container_id": "tradingview_chart",
        "studies": [
          "STD;SMA",
          "STD;EMA"
        ],
        "toolbar_bg": "#f1f3f6",
        "withdateranges": true,
        "hide_side_toolbar": false,
        "allow_symbol_change": false,
        "details": true,
        "hotlist": true,
        "calendar": true,
        "show_popup_button": true,
        "popup_width": "1000",
        "popup_height": "650",
        "studies_overrides": {}
      });

      // Create container for TradingView widget
      const widgetContainer = document.createElement('div');
      widgetContainer.className = 'tradingview-widget-container';
      widgetContainer.style.height = '100%';
      widgetContainer.style.width = '100%';
      
      const widgetDiv = document.createElement('div');
      widgetDiv.id = 'tradingview_chart';
      widgetDiv.style.height = '100%';
      widgetDiv.style.width = '100%';
      
      widgetContainer.appendChild(widgetDiv);
      widgetContainer.appendChild(script);
      
      chartContainerRef.current.appendChild(widgetContainer);
    }
  }, [currencyPair, timeframe]);

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

      // Fetch live data from Alpha Vantage for trade signals
      const baseCurrency = currencyPair.slice(0, 3);
      const quoteCurrency = currencyPair.slice(3);
      
      let apiFunction = 'FX_DAILY';
      if (timeframe === '1') apiFunction = 'FX_INTRADAY&interval=1min';
      else if (timeframe === '5') apiFunction = 'FX_INTRADAY&interval=5min';
      else if (timeframe === '15') apiFunction = 'FX_INTRADAY&interval=15min';
      else if (timeframe === '60') apiFunction = 'FX_INTRADAY&interval=60min';

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
          description: "Chart displaying live data, but using demo data for signals",
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
      if (timeframe !== 'D') {
        const intervalMap: { [key: string]: string } = {
          '1': '1min',
          '5': '5min', 
          '15': '15min',
          '60': '60min'
        };
        timeSeriesKey = `Time Series FX (${intervalMap[timeframe]})`;
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
        description: `Chart and signals updated with live data for ${currencyPair}`,
      });

    } catch (error) {
      console.error('Error fetching chart data:', error);
      toast({
        title: "Error Loading Data",
        description: "Chart showing live data, using demo data for signals",
        variant: "destructive"
      });
      
      // Fallback to demo data for signals
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

  const handleTimeframeChange = (value: string) => {
    setTimeframe(value);
    toast({
      title: "Timeframe Changed",
      description: `Chart updated to ${timeframes.find(tf => tf.value === value)?.label}`,
      duration: 2000,
    });
  };

  return (
    <div className="bg-card rounded-lg p-4 shadow-md">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-4 space-y-2 md:space-y-0">
        <div className="flex items-center gap-2">
          <h2 className="text-xl font-bold">{currencyPair.slice(0, 3)}/{currencyPair.slice(3)}</h2>
          <Badge variant={dataProvider === 'alphavantage' ? 'default' : 'outline'}>
            Live Chart
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
          
          <Select value={timeframe} onValueChange={handleTimeframeChange}>
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
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Refresh Data'}
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
      
      <div className="h-[400px] w-full" ref={chartContainerRef}>
        {/* TradingView widget will be inserted here */}
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
