
import React, { useState, useEffect } from 'react';
import { Separator } from '@/components/ui/separator';
import { ArrowUpRight, Loader2, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { marketDataService, SMCPattern } from '@/services/marketDataService';
import { toast } from 'sonner';

const SMCPatterns = () => {
  const [patterns, setPatterns] = useState<SMCPattern[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [rateLimitReached, setRateLimitReached] = useState(false);
  
  // Check for rate limit status
  useEffect(() => {
    setRateLimitReached(marketDataService.isRateLimitReached());
    
    const handleRateLimit = () => {
      setRateLimitReached(true);
    };
    
    window.addEventListener('fcs-rate-limit', handleRateLimit);
    
    return () => {
      window.removeEventListener('fcs-rate-limit', handleRateLimit);
    };
  }, []);
  
  const loadPatternData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const data = await marketDataService.fetchSMCPatterns();
      setPatterns(data);
      
      if (data.length === 0) {
        setError('No live SMC patterns available from FCS API');
      }
    } catch (err) {
      console.error('Error fetching pattern data:', err);
      setError('Failed to load live pattern data. Please try again.');
      toast.error('Failed to load SMC pattern data from FCS API');
      setPatterns([]);
    } finally {
      setLoading(false);
    }
  };
  
  useEffect(() => {
    loadPatternData();
    
    // Refresh data every 5 minutes
    const intervalId = setInterval(loadPatternData, 5 * 60 * 1000);
    
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
          disabled={loading || rateLimitReached}
        >
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Refresh"}
        </Button>
      </div>
      
      {rateLimitReached && (
        <div className="p-4 mb-4 text-sm border border-destructive/50 bg-destructive/10 text-destructive rounded-md">
          <div className="flex items-start gap-2">
            <AlertCircle className="h-4 w-4 mt-0.5" />
            <div>
              FCS API rate limit reached. No live pattern data available.
            </div>
          </div>
        </div>
      )}
      
      {error && !rateLimitReached && (
        <div className="p-4 mb-4 text-sm border border-destructive/50 bg-destructive/10 text-destructive rounded-md">
          <div className="flex items-start gap-2">
            <AlertCircle className="h-4 w-4 mt-0.5" />
            <div>{error}</div>
          </div>
        </div>
      )}
      
      {loading && patterns.length === 0 ? (
        <div className="flex items-center justify-center h-56">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2 text-primary" />
            <p className="text-muted-foreground">Analyzing live market patterns from FCS API...</p>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {patterns.length > 0 ? (
            patterns.map((pattern, index) => (
              <React.Fragment key={pattern.name + pattern.pair + pattern.timeframe}>
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
                  <div className="mt-2 flex items-center justify-between">
                    <div className="text-xs text-muted-foreground">
                      {pattern.timeframe} • {pattern.direction}
                    </div>
                    <a href="#" className="text-xs flex items-center text-primary hover:underline">
                      Learn more <ArrowUpRight className="ml-1 h-3 w-3" />
                    </a>
                  </div>
                </div>
              </React.Fragment>
            ))
          ) : (
            <div className="text-center py-8">
              <AlertCircle className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-muted-foreground mb-2">
                {rateLimitReached 
                  ? "API rate limit reached. No live patterns available."
                  : "No live SMC patterns detected at the moment."}
              </p>
              <p className="text-sm text-muted-foreground">
                {!rateLimitReached && "Live pattern analysis requires FCS API access."}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default SMCPatterns;
