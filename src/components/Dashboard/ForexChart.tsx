
import React, { useState, useEffect } from 'react';
import { 
  ResponsiveContainer, 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend,
  AreaChart,
  Area
} from 'recharts';
import { useToast } from '@/hooks/use-toast';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

// Mock data - in a real app this would come from a forex API
const generateMockData = (count: number) => {
  const data = [];
  let basePrice = 1.2000; // Starting price for EUR/USD
  
  for (let i = 0; i < count; i++) {
    const price = basePrice + (Math.random() * 0.01 - 0.005);
    basePrice = price;
    
    data.push({
      time: new Date(Date.now() - (count - i) * 30000).toLocaleTimeString(),
      price: price.toFixed(5),
      volume: Math.floor(Math.random() * 100) + 50,
      ma: (price + (Math.random() * 0.001 - 0.0005)).toFixed(5)
    });
  }
  
  return data;
};

const currencyPairs = [
  { value: 'EURUSD', label: 'EUR/USD' },
  { value: 'GBPUSD', label: 'GBP/USD' },
  { value: 'USDJPY', label: 'USD/JPY' },
  { value: 'AUDUSD', label: 'AUD/USD' },
];

const timeframes = [
  { value: '1m', label: '1 Minute' },
  { value: '5m', label: '5 Minutes' },
  { value: '15m', label: '15 Minutes' },
  { value: '1h', label: '1 Hour' },
  { value: '4h', label: '4 Hours' },
  { value: '1d', label: 'Daily' },
];

const ForexChart = () => {
  const [chartData, setChartData] = useState<any[]>([]);
  const [currencyPair, setCurrencyPair] = useState('EURUSD');
  const [timeframe, setTimeframe] = useState('5m');
  const [chartType, setChartType] = useState('candlestick');
  const { toast } = useToast();
  
  useEffect(() => {
    // In a real app, this would fetch data from a forex API
    setChartData(generateMockData(50));
    
    const interval = setInterval(() => {
      setChartData(prevData => {
        const newData = [...prevData];
        const lastPrice = parseFloat(newData[newData.length - 1].price);
        const newPrice = lastPrice + (Math.random() * 0.002 - 0.001);
        
        newData.shift();
        newData.push({
          time: new Date().toLocaleTimeString(),
          price: newPrice.toFixed(5),
          volume: Math.floor(Math.random() * 100) + 50,
          ma: (newPrice + (Math.random() * 0.001 - 0.0005)).toFixed(5)
        });
        
        return newData;
      });
    }, 3000);
    
    return () => clearInterval(interval);
  }, [currencyPair, timeframe]);
  
  const handlePairChange = (value: string) => {
    setCurrencyPair(value);
    toast({
      title: "Currency Pair Changed",
      description: `Now viewing ${value.slice(0, 3)}/${value.slice(3)}`,
      duration: 2000,
    });
    setChartData(generateMockData(50));
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
      
      <Tabs defaultValue="line" className="mb-4" onValueChange={(value) => setChartType(value)}>
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="line">Line</TabsTrigger>
          <TabsTrigger value="area">Area</TabsTrigger>
        </TabsList>
      </Tabs>
      
      <div className="chart-container">
        <ResponsiveContainer width="100%" height={400}>
          {chartType === 'line' ? (
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
              <XAxis dataKey="time" stroke="#888" />
              <YAxis 
                domain={['auto', 'auto']} 
                stroke="#888" 
                tickFormatter={(value) => value.toFixed(4)}
              />
              <Tooltip 
                contentStyle={{ backgroundColor: 'rgba(15, 23, 42, 0.9)', borderColor: '#334155' }} 
                labelStyle={{ color: '#e2e8f0' }}
                formatter={(value) => [`${value}`, 'Price']}
              />
              <Legend />
              <Line 
                type="monotone" 
                dataKey="price" 
                stroke="hsl(var(--primary))" 
                activeDot={{ r: 8 }} 
                strokeWidth={2} 
                dot={false}
              />
              <Line 
                type="monotone" 
                dataKey="ma" 
                stroke="hsl(var(--destructive))" 
                strokeWidth={1.5} 
                dot={false} 
                strokeDasharray="5 5"
              />
            </LineChart>
          ) : (
            <AreaChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
              <XAxis dataKey="time" stroke="#888" />
              <YAxis 
                domain={['auto', 'auto']} 
                stroke="#888" 
                tickFormatter={(value) => value.toFixed(4)}
              />
              <Tooltip 
                contentStyle={{ backgroundColor: 'rgba(15, 23, 42, 0.9)', borderColor: '#334155' }} 
                labelStyle={{ color: '#e2e8f0' }}
              />
              <Area 
                type="monotone" 
                dataKey="price" 
                stroke="hsl(var(--primary))" 
                fill="hsla(var(--primary), 0.2)" 
                activeDot={{ r: 6 }} 
              />
            </AreaChart>
          )}
        </ResponsiveContainer>
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
