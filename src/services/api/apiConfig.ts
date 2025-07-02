
import { toast } from 'sonner';

// API configuration
export const API_CONFIG = {
  FCS_API_KEY: 'hczDhp413qSmqzjLlVNuhRuFdwuJv', // FCS API key
  FCS_BASE_URL: 'https://fcsapi.com/api-v3',
  DATA_PROVIDER: 'fcs' // Only FCS for live data
};

// Track API rate limit status
let isRateLimitReached = false;

// Helper to dispatch rate limit event
export const emitRateLimitEvent = () => {
  if (!isRateLimitReached) {
    isRateLimitReached = true;
    // Dispatch a custom event that components can listen for
    window.dispatchEvent(new CustomEvent('fcs-rate-limit'));
    console.warn('FCS API rate limit reached');
    toast.error('FCS API rate limit reached');
  }
};

// Helper to check response for rate limit messages
export const checkForRateLimit = (data: any): boolean => {
  if (data && !data.status && (data.code === 213 || data.msg?.includes('limit'))) {
    emitRateLimitEvent();
    return true;
  }
  return false;
};

// Rate limit management
export const rateLimitService = {
  isRateLimitReached: (): boolean => isRateLimitReached,
  
  resetRateLimitStatus: (): void => {
    isRateLimitReached = false;
    toast.success('API rate limit status has been reset');
  }
};

// API key management
export const apiKeyService = {
  getFCSApiKey: (): string => API_CONFIG.FCS_API_KEY,
  
  setFCSApiKey: (apiKey: string): void => {
    API_CONFIG.FCS_API_KEY = apiKey;
    localStorage.setItem('fcs_api_key', apiKey);
    toast.success('FCS API key updated');
  }
};
