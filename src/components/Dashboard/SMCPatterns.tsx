
import React, { useState, useEffect } from 'react';
import { Separator } from '@/components/ui/separator';
import { ArrowUpRight, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface PatternData {
  name: string; 
  description: string;
  status: 'Detected' | 'Pending' | 'Active' | 'Watching';
  pair: string;
}

// Mock API function - In a real app, this would connect to a backend API
// that analyzes TradingView charts for SMC patterns
const fetchPatternData = async (): Promise<PatternData[]> => {
  // Simulate API call delay
  await new Promise(resolve => setTimeout(resolve, 1200));
  
  // Dynamic pattern descriptions
  const patternDescriptions = {
    'Order Block': 'Areas where smart money placed their positions, causing market movement',
    'Fair Value Gap': 'Imbalances created by quick moves, often filling liquidity',
    'Liquidity Sweep': 'Price moves breaking key levels to collect stops before reversing',
    'Breaker Block': 'Area where price previously reversed acting as S/R',
    'Equal Highs/Lows': 'Areas where price creates equal peaks before reversing',
    'Market Structure Break': 'Key level where market structure shifts direction',
    'Discount Block': 'Premium zones where smart money accumulates positions'
  };
  
  const patternNames = Object.keys(patternDescriptions);
  const pairs = ['EUR/USD', 'GBP/USD', 'USD/JPY', 'AUD/USD', 'USD/CAD', 'NZD/USD'];
  const statuses = ['Detected', 'Pending', 'Active', 'Watching'];
  
  // Select 4-6 random patterns
  const patternCount = Math.floor(Math.random() * 3) + 4;
  const selectedPatterns = [];
  
  // Randomly shuffle pattern names
  const shuffledPatterns = [...patternNames].sort(() => Math.random() - 0.5);
  
  for (let i = 0; i < patternCount; i++) {
    const patternName = shuffledPatterns[i % shuffledPatterns.length];
    const pair = pairs[Math.floor(Math.random() * pairs.length)];
    const status = statuses[Math.floor(Math.random() * statuses.length)];
    
    selectedPatterns.push({
      name: patternName,
      description: patternDescriptions[patternName as keyof typeof patternDescriptions],
      status: status as 'Detected' | 'Pending' | 'Active' | 'Watching',
      pair
    });
  }
  
  return selectedPatterns;
};

const SMCPatterns = () => {
  const [patterns, setPatterns] = useState<PatternData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const loadPatternData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const data = await fetchPatternData();
      setPatterns(data);
    } catch (err) {
      console.error('Error fetching pattern data:', err);
      setError('Failed to load pattern data. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  
  useEffect(() => {
    loadPatternData();
    
    // Refresh data every 3 minutes
    const intervalId = setInterval(loadPatternData, 3 * 60 * 1000);
    
    return () => clearInterval(intervalId);
  }, []);
  
  return (
    <div className="bg-card rounded-lg p-4 shadow-md h-full">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-semibold">SMC Patterns</h2>
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={loadPatternData} 
          disabled={loading}
        >
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Refresh"}
        </Button>
      </div>
      
      {error && (
        <div className="p-4 mb-4 text-sm border border-destructive/50 bg-destructive/10 text-destructive rounded-md">
          {error}
        </div>
      )}
      
      {loading && patterns.length === 0 ? (
        <div className="flex items-center justify-center h-56">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2 text-primary" />
            <p className="text-muted-foreground">Analyzing market patterns...</p>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {patterns.map((pattern, index) => (
            <React.Fragment key={pattern.name + pattern.pair}>
              {index > 0 && <Separator className="my-3" />}
              <div>
                <div className="flex justify-between">
                  <h3 className="font-medium">{pattern.name}</h3>
                  <div className="flex items-center text-xs">
                    <span className={`px-2 py-0.5 rounded ${
                      pattern.status === 'Detected' ? 'bg-primary/20 text-primary' :
                      pattern.status === 'Active' ? 'bg-green-500/20 text-green-500' :
                      pattern.status === 'Pending' ? 'bg-yellow-500/20 text-yellow-500' :
                      'bg-muted/20 text-muted-foreground'
                    }`}>
                      {pattern.status}
                    </span>
                    <span className="ml-2 text-muted-foreground">{pattern.pair}</span>
                  </div>
                </div>
                <p className="text-sm text-muted-foreground mt-1">{pattern.description}</p>
                <div className="mt-2">
                  <a href="#" className="text-xs flex items-center text-primary hover:underline">
                    Learn more <ArrowUpRight className="ml-1 h-3 w-3" />
                  </a>
                </div>
              </div>
            </React.Fragment>
          ))}
          
          {patterns.length === 0 && !loading && (
            <div className="text-center py-8">
              <p className="text-muted-foreground">No SMC patterns detected at the moment.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default SMCPatterns;
