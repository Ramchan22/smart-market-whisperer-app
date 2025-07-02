
import { API_CONFIG, checkForRateLimit } from './apiConfig';

// Define the standard currency pairs to use across all functions
export const CURRENCY_PAIRS = [
  'EUR/USD', 'USD/JPY', 'GBP/USD', 'AUD/USD', 'EUR/GBP', 'EUR/CHF', 'GBP/JPY'
];

// Helper function to add delay between API requests
export const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Helper function to fetch data from FCS API
export const fetchFromFCS = async (endpoint: string, params: Record<string, string> = {}) => {
  const url = new URL(`${API_CONFIG.FCS_BASE_URL}/${endpoint}`);
  url.searchParams.append('access_key', API_CONFIG.FCS_API_KEY);
  
  Object.entries(params).forEach(([key, value]) => {
    url.searchParams.append(key, value);
  });

  console.log('FCS API Request:', url.toString());
  
  const response = await fetch(url.toString());
  const data = await response.json();
  
  console.log('FCS API Response:', data);
  
  // Check for rate limit
  if (checkForRateLimit(data)) {
    throw new Error('Rate limit reached');
  }
  
  if (!data.status) {
    throw new Error(data.msg || 'API request failed');
  }
  
  return data;
};
