
// Setup deduplication utilities

import { SMCTradeSetup } from '../smcAnalysisService';

// Generate unique hash for trade setup
export const generateSetupHash = (setup: SMCTradeSetup): string => {
  const entryRounded = Math.round(parseFloat(setup.entry) * 10000) / 10000;
  return `${setup.pair}_${entryRounded}_${setup.patternType}_${setup.executionTimeframe}`;
};

// Remove duplicate setups based on similarity
export const deduplicateSetups = (setups: SMCTradeSetup[]): SMCTradeSetup[] => {
  const seenHashes = new Set<string>();
  const uniqueSetups: SMCTradeSetup[] = [];
  
  // Sort by confluence score first (highest first)
  const sortedSetups = [...setups].sort((a, b) => b.confluenceScore - a.confluenceScore);
  
  for (const setup of sortedSetups) {
    const hash = generateSetupHash(setup);
    
    if (!seenHashes.has(hash)) {
      seenHashes.add(hash);
      uniqueSetups.push(setup);
    }
  }
  
  console.log(`Deduplication: ${setups.length} -> ${uniqueSetups.length} unique setups`);
  return uniqueSetups;
};

// Check if two setups are similar (within 5 pips)
export const areSetupsSimilar = (setup1: SMCTradeSetup, setup2: SMCTradeSetup): boolean => {
  if (setup1.pair !== setup2.pair) return false;
  
  const entry1 = parseFloat(setup1.entry);
  const entry2 = parseFloat(setup2.entry);
  const pipDifference = Math.abs(entry1 - entry2);
  
  // Consider similar if within 5 pips (0.0005 for most pairs, 0.05 for JPY pairs)
  const threshold = setup1.pair.includes('JPY') ? 0.05 : 0.0005;
  
  return pipDifference <= threshold;
};
