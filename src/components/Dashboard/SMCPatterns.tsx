
import React from 'react';
import { Separator } from '@/components/ui/separator';
import { ArrowUpRight } from 'lucide-react';

const patterns = [
  { 
    name: 'Order Block', 
    description: 'Areas where smart money placed their positions, causing market movement',
    status: 'Detected',
    pair: 'EUR/USD'
  },
  { 
    name: 'Fair Value Gap', 
    description: 'Imbalances created by quick moves, often filling liquidity',
    status: 'Pending',
    pair: 'GBP/USD'
  },
  { 
    name: 'Liquidity Sweep', 
    description: 'Price moves breaking key levels to collect stops before reversing',
    status: 'Active',
    pair: 'USD/JPY'
  },
  { 
    name: 'Breaker Block', 
    description: 'Area where price previously reversed acting as S/R',
    status: 'Watching',
    pair: 'AUD/USD'
  },
];

const SMCPatterns = () => {
  return (
    <div className="bg-card rounded-lg p-4 shadow-md h-full">
      <h2 className="text-lg font-semibold mb-4">SMC Patterns</h2>
      
      <div className="space-y-4">
        {patterns.map((pattern, index) => (
          <React.Fragment key={pattern.name}>
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
      </div>
    </div>
  );
};

export default SMCPatterns;
