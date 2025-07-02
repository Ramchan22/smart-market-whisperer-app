
import { toast } from 'sonner';
import { analyzeSMCStrategy } from './smcAnalysisService';
import { fetchFromFCS } from './api/dataFetcher';
import { rateLimitService, apiKeyService } from './api/apiConfig';
import { fetchWatchlistData } from './data/watchlistService';
import { fetchSMCPatterns } from './analysis/patternAnalysis';
import { TradeSignal, ForexRate, SMCPattern } from './types/marketTypes';
import { SMCTradeSetup } from './smcAnalysisService';

// Main API service for fetching market data
export const marketDataService = {
  // Get the current data provider (always FCS)
  getDataProvider: (): string => {
    return 'fcs';
  },
  
  // Check if rate limit has been reached
  isRateLimitReached: (): boolean => {
    return rateLimitService.isRateLimitReached();
  },

  // Reset rate limit status
  resetRateLimitStatus: (): void => {
    rateLimitService.resetRateLimitStatus();
  },

  // Expose FCS API helper for external use
  fetchFromFCS: async (endpoint: string, params: Record<string, string> = {}) => {
    return await fetchFromFCS(endpoint, params);
  },

  // Fetch current forex rates for watchlist using FCS API
  fetchWatchlistData: async (): Promise<ForexRate[]> => {
    return await fetchWatchlistData();
  },
  
  // Updated fetchTradeSignals to use new multi-timeframe SMC strategy
  fetchTradeSignals: async (): Promise<TradeSignal[]> => {
    try {
      console.log('Fetching SMC trade signals using multi-timeframe analysis...');
      
      // Use the new SMC analysis service
      const smcSetups = await analyzeSMCStrategy();
      
      // Convert SMC setups to TradeSignal format
      const signals: TradeSignal[] = smcSetups.map((setup: SMCTradeSetup) => ({
        id: setup.id,
        pair: setup.pair,
        direction: setup.direction,
        pattern: setup.pattern,
        entry: setup.entry,
        stopLoss: setup.stopLoss,
        takeProfit: setup.takeProfit,
        probability: setup.probability,
        timeframe: setup.executionTimeframe,
        signalType: setup.patternType === 'FVG' ? (setup.direction === 'buy' ? 'discount' : 'premium') : 'equilibrium',
        analysisTimeframe: setup.strategy === 'primary' ? 'primary' : 'secondary',
        confirmationStatus: setup.confirmationStatus,
        strategy: setup.strategy,
        confluenceScore: setup.confluenceScore
      }));
      
      if (signals.length > 0) {
        toast.success(`Generated ${signals.length} multi-timeframe SMC signals`);
        console.log('SMC Strategy Summary:');
        console.log(`- Primary strategy signals: ${signals.filter(s => s.strategy === 'primary').length}`);
        console.log(`- Fallback strategy signals: ${signals.filter(s => s.strategy === 'fallback').length}`);
        console.log(`- High probability signals: ${signals.filter(s => s.probability === 'high').length}`);
      } else {
        toast.error('No SMC trade signals generated - market conditions may not be favorable');
      }
      
      return signals;
      
    } catch (error) {
      console.error('Error fetching SMC trade signals:', error);
      toast.error('Failed to fetch SMC trade signals');
      return [];
    }
  },
  
  // Fetch SMC patterns detected in the market using FCS API
  fetchSMCPatterns: async (): Promise<SMCPattern[]> => {
    return await fetchSMCPatterns();
  },
  
  // Get FCS API key for settings
  getFCSApiKey: (): string => {
    return apiKeyService.getFCSApiKey();
  },
  
  // Set FCS API key
  setFCSApiKey: (apiKey: string): void => {
    apiKeyService.setFCSApiKey(apiKey);
  }
};

// Re-export types for backward compatibility
export type { ForexRate, TradeSignal, SMCPattern };
