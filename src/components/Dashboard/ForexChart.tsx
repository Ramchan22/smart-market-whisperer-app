
import React, { useState, useEffect, useRef } from 'react';
import { useToast } from '@/hooks/use-toast';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

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

interface TradingViewProps {
  symbol: string;
  interval: string;
  timezone?: string;
  theme?: string;
  style?: string;
  locale?: string;
  toolbar_bg?: string;
  enable_publishing?: boolean;
  allow_symbol_change?: boolean;
  container_id: string;
}

declare global {
  interface Window {
    TradingView: {
      widget: new (config: TradingViewProps) => any;
    };
  }
}

const ForexChart = () => {
  const [currencyPair, setCurrencyPair] = useState('EURUSD');
  const [timeframe, setTimeframe] = useState('60');
  const containerRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  const chartContainerId = 'tradingview_widget';
  const [widgetInstance, setWidgetInstance] = useState<any>(null);
  
  useEffect(() => {
    // Load TradingView script
    const script = document.createElement('script');
    script.src = 'https://s3.tradingview.com/tv.js';
    script.async = true;
    script.onload = initializeWidget;
    document.head.appendChild(script);

    return () => {
      if (document.getElementById('tradingview-widget-script')) {
        document.getElementById('tradingview-widget-script')?.remove();
      }
    };
  }, []);

  useEffect(() => {
    if (window.TradingView && containerRef.current) {
      // If the widget was already initialized and we're changing currency pair or timeframe
      if (widgetInstance) {
        // Remove old widget
        while (containerRef.current.firstChild) {
          containerRef.current.removeChild(containerRef.current.firstChild);
        }
      }
      
      // Create new container
      const container = document.createElement('div');
      container.id = chartContainerId;
      container.style.height = '400px';
      container.style.width = '100%';
      containerRef.current.appendChild(container);
      
      // Create new widget
      const widget = new window.TradingView.widget({
        symbol: `FX:${currencyPair}`,
        interval: timeframe,
        timezone: "Etc/UTC",
        theme: "dark",
        style: "1",
        locale: "en",
        toolbar_bg: "#f1f3f6",
        enable_publishing: false,
        allow_symbol_change: true,
        container_id: chartContainerId
      });
      
      setWidgetInstance(widget);
    }
  }, [currencyPair, timeframe, window.TradingView]);

  const initializeWidget = () => {
    if (window.TradingView && containerRef.current) {
      // Force update to trigger the widget initialization
      setCurrencyPair(prev => prev);
    }
  };
  
  const handlePairChange = (value: string) => {
    setCurrencyPair(value);
    toast({
      title: "Currency Pair Changed",
      description: `Now viewing ${value.slice(0, 3)}/${value.slice(3)}`,
      duration: 2000,
    });
  };
  
  return (
    <div className="bg-card rounded-lg p-4 shadow-md">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-4 space-y-2 md:space-y-0">
        <h2 className="text-xl font-bold">{currencyPair.slice(0, 3)}/{currencyPair.slice(3)}</h2>
        
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
        </div>
      </div>
      
      <div className="chart-container" ref={containerRef}>
        {/* TradingView Chart will be rendered here */}
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
