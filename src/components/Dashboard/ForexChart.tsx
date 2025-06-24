import React, { useState, useEffect, useRef } from 'react';
import { useToast } from '@/hooks/use-toast';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { marketDataService } from '@/services/marketDataService';
import { Loader2, TrendingUp, TrendingDown } from 'lucide-react';

const currencyPairs = [
  { value: 'EUR/USD', label: 'EUR/USD' },
  { value: 'USD/JPY', label: 'USD/JPY' },
  { value: 'GBP/USD', label: 'GBP/USD' },
  { value: 'AUD/USD', label: 'AUD/USD' },
  { value: 'EUR/GBP', label: 'EUR/GBP' },
  { value: 'EUR/CHF', label: 'EUR/CHF' },
  { value: 'GBP/JPY', label: 'GBP/JPY' },
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

interface SMCMarker {
  type: 'FVG' | 'BOS' | 'CHOCH';
  direction: 'bullish' | 'bearish';
  price: number;
  time: string;
  description: string;
}

interface ForexChartProps {
  onDataUpdate?: (data: ChartDataPoint[], pair: string, loading: boolean) => void;
}

const ForexChart: React.FC<ForexChartProps> = ({ onDataUpdate }) => {
  const [currencyPair, setCurrencyPair] = useState('GBP/USD');
  const [timeframe, setTimeframe] = useState('D');
  const [chartData, setChartData] = useState<ChartDataPoint[]>([]);
  const [loading, setLoading] = useState(false);
  const [currentPrice, setCurrentPrice] = useState<number | null>(null);
  const [priceChange, setPriceChange] = useState<number | null>(null);
  const [smcMarkers, setSMCMarkers] = useState<SMCMarker[]>([]);
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const tradingViewWidgetRef = useRef<any>(null);
  const { toast } = useToast();

  // Function to detect SMC patterns from live data
  const detectSMCPatterns = (data: ChartDataPoint[]): SMCMarker[] => {
    const markers: SMCMarker[] = [];
    
    if (data.length < 5) return markers;

    // Sort data by time to ensure chronological order
    const sortedData = [...data].sort((a, b) => new Date(a.time).getTime() - new Date(b.time).getTime());

    // Detect Fair Value Gaps (FVG) - limit to prevent overcrowding
    let fvgCount = 0;
    for (let i = 2; i < sortedData.length && fvgCount < 3; i++) {
      const candle1 = sortedData[i - 2];
      const candle2 = sortedData[i - 1];
      const candle3 = sortedData[i];

      // Bullish FVG: candle1.low > candle3.high
      if (candle1.low > candle3.high) {
        const gapSize = candle1.low - candle3.high;
        const gapPercent = (gapSize / candle2.close) * 100;
        
        if (gapPercent > 0.03) { // Minimum 0.03% gap to reduce noise
          markers.push({
            type: 'FVG',
            direction: 'bullish',
            price: (candle1.low + candle3.high) / 2,
            time: candle2.time,
            description: `Bullish FVG (${gapPercent.toFixed(2)}% gap)`
          });
          fvgCount++;
        }
      }

      // Bearish FVG: candle1.high < candle3.low
      if (candle1.high < candle3.low && fvgCount < 3) {
        const gapSize = candle3.low - candle1.high;
        const gapPercent = (gapSize / candle2.close) * 100;
        
        if (gapPercent > 0.03) {
          markers.push({
            type: 'FVG',
            direction: 'bearish',
            price: (candle1.high + candle3.low) / 2,
            time: candle2.time,
            description: `Bearish FVG (${gapPercent.toFixed(2)}% gap)`
          });
          fvgCount++;
        }
      }
    }

    // Detect Break of Structure (BOS) and Change of Character (CHOCH) - limit to prevent overcrowding
    let bosCount = 0;
    let chochCount = 0;
    for (let i = 3; i < sortedData.length && (bosCount < 2 || chochCount < 2); i++) {
      const current = sortedData[i];
      const prev1 = sortedData[i - 1];
      const prev2 = sortedData[i - 2];
      const prev3 = sortedData[i - 3];

      // Find recent highs and lows
      const recentHigh = Math.max(prev1.high, prev2.high, prev3.high);
      const recentLow = Math.min(prev1.low, prev2.low, prev3.low);

      // Bullish BOS: Current high breaks above recent high
      if (current.high > recentHigh && current.close > current.open) {
        const isStrong = (current.close - current.open) / (current.high - current.low) > 0.6;
        
        if (isStrong && bosCount < 2) {
          markers.push({
            type: 'BOS',
            direction: 'bullish',
            price: current.high,
            time: current.time,
            description: `Strong Bullish BOS`
          });
          bosCount++;
        } else if (!isStrong && chochCount < 2) {
          markers.push({
            type: 'CHOCH',
            direction: 'bullish',
            price: current.high,
            time: current.time,
            description: `Weak Bullish CHoCH`
          });
          chochCount++;
        }
      }

      // Bearish BOS: Current low breaks below recent low
      if (current.low < recentLow && current.close < current.open) {
        const isStrong = (current.open - current.close) / (current.high - current.low) > 0.6;
        
        if (isStrong && bosCount < 2) {
          markers.push({
            type: 'BOS',
            direction: 'bearish',
            price: current.low,
            time: current.time,
            description: `Strong Bearish BOS`
          });
          bosCount++;
        } else if (!isStrong && chochCount < 2) {
          markers.push({
            type: 'CHOCH',
            direction: 'bearish',
            price: current.low,
            time: current.time,
            description: `Weak Bearish CHoCH`
          });
          chochCount++;
        }
      }
    }

    return markers;
  };

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
      
      // Enhanced widget configuration
      const widgetConfig = {
        "autosize": true,
        "symbol": `FX:${currencyPair.replace('/', '')}`,
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
        "toolbar_bg": "#f1f3f6",
        "withdateranges": true,
        "hide_side_toolbar": false,
        "allow_symbol_change": false,
        "details": false,
        "hotlist": false,
        "calendar": false,
        "show_popup_button": false,
        "popup_width": "1000",
        "popup_height": "650",
        "studies": [
          "STD;Pivot_Points_Standard",
          "STD;VWAP"
        ],
        "drawings_access": {
          "type": "black",
          "tools": [
            { "name": "Regression Trend" },
            { "name": "Trend Line" },
            { "name": "Horizontal Line" },
            { "name": "Rectangle" }
          ]
        }
      };

      try {
        script.innerHTML = JSON.stringify(widgetConfig);
      } catch (error) {
        console.error('Error creating TradingView widget config:', error);
        return;
      }

      // Create container for TradingView widget
      const widgetContainer = document.createElement('div');
      widgetContainer.className = 'tradingview-widget-container';
      (widgetContainer as HTMLElement).style.height = '100%';
      (widgetContainer as HTMLElement).style.width = '100%';
      
      const widgetDiv = document.createElement('div');
      widgetDiv.id = 'tradingview_chart';
      (widgetDiv as HTMLElement).style.height = '100%';
      (widgetDiv as HTMLElement).style.width = '100%';
      
      widgetContainer.appendChild(widgetDiv);
      widgetContainer.appendChild(script);
      
      chartContainerRef.current.appendChild(widgetContainer);

      // Store reference for later use
      tradingViewWidgetRef.current = widgetContainer;
    }
  }, [currencyPair, timeframe]);

  // Add improved SMC marker overlay after chart loads
  useEffect(() => {
    if (smcMarkers.length > 0 && chartContainerRef.current) {
      // Remove existing overlay
      const existingOverlay = chartContainerRef.current.querySelector('.smc-overlay');
      if (existingOverlay) {
        existingOverlay.remove();
      }

      // Create SMC overlay with better positioning
      const overlay = document.createElement('div');
      overlay.className = 'smc-overlay';
      (overlay as HTMLElement).style.position = 'absolute';
      (overlay as HTMLElement).style.top = '60px'; // Start below toolbar
      (overlay as HTMLElement).style.right = '20px'; // Position on right side
      (overlay as HTMLElement).style.pointerEvents = 'none';
      (overlay as HTMLElement).style.zIndex = '10';
      (overlay as HTMLElement).style.display = 'flex';
      (overlay as HTMLElement).style.flexDirection = 'column';
      (overlay as HTMLElement).style.gap = '8px';
      (overlay as HTMLElement).style.maxWidth = '200px';

      // Group markers by type for better organization
      const groupedMarkers = {
        FVG: smcMarkers.filter(m => m.type === 'FVG'),
        BOS: smcMarkers.filter(m => m.type === 'BOS'),
        CHOCH: smcMarkers.filter(m => m.type === 'CHOCH')
      };

      // Add markers to overlay with organized layout
      Object.entries(groupedMarkers).forEach(([type, markers]) => {
        if (markers.length > 0) {
          // Create type header
          const typeHeader = document.createElement('div');
          (typeHeader as HTMLElement).style.fontSize = '11px';
          (typeHeader as HTMLElement).style.fontWeight = 'bold';
          (typeHeader as HTMLElement).style.color = '#8B5CF6';
          (typeHeader as HTMLElement).style.marginBottom = '4px';
          typeHeader.textContent = type;
          overlay.appendChild(typeHeader);

          // Add markers for this type
          markers.forEach((marker, index) => {
            const markerElement = document.createElement('div');
            markerElement.className = `smc-marker smc-${marker.type.toLowerCase()}`;
            (markerElement as HTMLElement).style.padding = '4px 8px';
            (markerElement as HTMLElement).style.borderRadius = '12px';
            (markerElement as HTMLElement).style.fontSize = '10px';
            (markerElement as HTMLElement).style.fontWeight = '600';
            (markerElement as HTMLElement).style.color = 'white';
            (markerElement as HTMLElement).style.pointerEvents = 'auto';
            (markerElement as HTMLElement).style.cursor = 'pointer';
            (markerElement as HTMLElement).style.marginBottom = '4px';
            (markerElement as HTMLElement).style.textAlign = 'center';
            (markerElement as HTMLElement).style.minWidth = '60px';
            (markerElement as HTMLElement).style.boxShadow = '0 2px 4px rgba(0,0,0,0.2)';
            markerElement.title = marker.description;

            // Color coding for different SMC patterns
            if (marker.type === 'FVG') {
              (markerElement as HTMLElement).style.backgroundColor = marker.direction === 'bullish' ? '#10B981' : '#EF4444';
              markerElement.textContent = `FVG ${marker.direction === 'bullish' ? '↑' : '↓'}`;
            } else if (marker.type === 'BOS') {
              (markerElement as HTMLElement).style.backgroundColor = marker.direction === 'bullish' ? '#3B82F6' : '#F59E0B';
              markerElement.textContent = `BOS ${marker.direction === 'bullish' ? '↑' : '↓'}`;
            } else if (marker.type === 'CHOCH') {
              (markerElement as HTMLElement).style.backgroundColor = marker.direction === 'bullish' ? '#8B5CF6' : '#EC4899';
              markerElement.textContent = `CHoCH ${marker.direction === 'bullish' ? '↑' : '↓'}`;
            }

            overlay.appendChild(markerElement);
          });
        }
      });

      // Find chart container and add overlay
      const chartDiv = chartContainerRef.current.querySelector('#tradingview_chart');
      if (chartDiv) {
        (chartDiv as HTMLElement).style.position = 'relative';
        chartDiv.appendChild(overlay);
      }

      // Cleanup function
      return () => {
        if (overlay && overlay.parentNode) {
          overlay.parentNode.removeChild(overlay);
        }
      };
    }
  }, [smcMarkers]);

  const fetchChartData = async () => {
    setLoading(true);
    
    // Notify parent component about loading state
    if (onDataUpdate) {
      onDataUpdate(chartData, currencyPair, true);
    }
    
    try {
      console.log(`Fetching chart data for ${currencyPair} from FCS API...`);
      
      // Use FCS API for historical data
      const data = await marketDataService.fetchFromFCS('forex/history', {
        symbol: currencyPair,
        period: timeframe === 'D' ? '1D' : '1H',
        limit: '30'
      });

      console.log('Chart API response:', data);

      if (data.status && data.response) {
        // Handle both object and array response formats
        let timeSeriesArray = [];
        
        if (Array.isArray(data.response)) {
          timeSeriesArray = data.response;
        } else if (typeof data.response === 'object') {
          timeSeriesArray = Object.values(data.response);
        }

        // Convert to chart format
        const processedData: ChartDataPoint[] = timeSeriesArray
          .slice(0, 30)
          .map((item: any) => ({
            time: new Date(item.tm).toLocaleDateString(),
            open: parseFloat(item.o),
            high: parseFloat(item.h),
            low: parseFloat(item.l),
            close: parseFloat(item.c),
          }))
          .reverse();

        setChartData(processedData);
        
        // Detect SMC patterns from live data
        const detectedMarkers = detectSMCPatterns(processedData);
        setSMCMarkers(detectedMarkers);
        
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
          description: `Chart updated with live data and ${detectedMarkers.length} SMC patterns detected`,
        });

      } else {
        throw new Error('No data available from FCS API');
      }

    } catch (error) {
      console.error('Error fetching chart data:', error);
      toast({
        title: "Error Loading Data",
        description: "Using demo data for chart",
        variant: "destructive"
      });
      
      // Fallback to demo data
      const demoData = generateDemoChartData();
      setChartData(demoData);
      setCurrentPrice(demoData[demoData.length - 1]?.close || 0);
      setPriceChange(Math.random() * 0.002 - 0.001);
      
      // Generate demo SMC markers
      const demoMarkers = detectSMCPatterns(demoData);
      setSMCMarkers(demoMarkers);
      
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
      description: `Now viewing ${value}`,
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
    <div className="bg-card rounded-lg p-4 shadow-md h-full">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-4 space-y-2 md:space-y-0">
        <div className="flex items-center gap-2">
          <h2 className="text-xl font-bold">{currencyPair}</h2>
          <Badge variant="default" className="bg-blue-500">
            Live Chart
          </Badge>
          {smcMarkers.length > 0 && (
            <Badge variant="secondary" className="bg-green-500">
              {smcMarkers.length} SMC Patterns
            </Badge>
          )}
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

      {/* SMC Pattern Summary - Improved layout */}
      {smcMarkers.length > 0 && (
        <div className="mb-4 p-3 bg-muted rounded-md">
          <h3 className="text-sm font-semibold mb-2">Detected SMC Patterns:</h3>
          <div className="grid grid-cols-3 gap-2">
            <div className="text-center">
              <div className="text-xs text-muted-foreground">FVG</div>
              <div className="font-semibold text-green-600">
                {smcMarkers.filter(m => m.type === 'FVG').length}
              </div>
            </div>
            <div className="text-center">
              <div className="text-xs text-muted-foreground">BOS</div>
              <div className="font-semibold text-blue-600">
                {smcMarkers.filter(m => m.type === 'BOS').length}
              </div>
            </div>
            <div className="text-center">
              <div className="text-xs text-muted-foreground">CHoCH</div>
              <div className="font-semibold text-purple-600">
                {smcMarkers.filter(m => m.type === 'CHOCH').length}
              </div>
            </div>
          </div>
        </div>
      )}

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
      
      <div className="h-[400px] w-full relative" ref={chartContainerRef}>
        {/* TradingView widget will be inserted here with improved SMC overlays */}
      </div>
      
      <div className="mt-4 grid grid-cols-3 gap-2">
        <Button variant="outline" size="sm" className="bg-green-50 text-green-700 border-green-200">
          FVG: {smcMarkers.filter(m => m.type === 'FVG').length}
        </Button>
        <Button variant="outline" size="sm" className="bg-blue-50 text-blue-700 border-blue-200">
          BOS: {smcMarkers.filter(m => m.type === 'BOS').length}
        </Button>
        <Button variant="outline" size="sm" className="bg-purple-50 text-purple-700 border-purple-200">
          CHoCH: {smcMarkers.filter(m => m.type === 'CHOCH').length}
        </Button>
      </div>
    </div>
  );
};

export default ForexChart;
