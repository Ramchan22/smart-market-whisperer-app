
// Enhanced confluence scoring for SMC setups

export interface ScoringFactors {
  patternStrength: number;
  marketAlignment: boolean;
  patternType: 'FVG' | 'OB' | 'CHOCH' | 'BOS';
  probability: 'high' | 'medium' | 'low';
  rewardToRisk: number;
  executionConfirmed: boolean;
  swingLevel: boolean;
}

export const calculateEnhancedConfluence = (factors: ScoringFactors): number => {
  let score = 0;
  
  // Base score from pattern strength (0-30 points)
  score += Math.min(30, factors.patternStrength * 1000);
  
  // Market structure alignment (20 points)
  if (factors.marketAlignment) {
    score += 20;
  }
  
  // Pattern type scoring
  switch (factors.patternType) {
    case 'CHOCH':
      score += 25; // Highest priority - trend change
      break;
    case 'BOS':
      score += 20; // High priority - trend continuation
      break;
    case 'FVG':
      score += 15; // Good reliability
      break;
    case 'OB':
      score += 10; // Moderate reliability
      break;
  }
  
  // Probability bonus
  switch (factors.probability) {
    case 'high':
      score += 15;
      break;
    case 'medium':
      score += 10;
      break;
    case 'low':
      score += 5;
      break;
  }
  
  // Reward-to-risk ratio (0-15 points)
  if (factors.rewardToRisk >= 3) {
    score += 15;
  } else if (factors.rewardToRisk >= 2) {
    score += 10;
  } else if (factors.rewardToRisk >= 1.5) {
    score += 5;
  }
  
  // Execution timeframe confirmation (10 points)
  if (factors.executionConfirmed) {
    score += 10;
  }
  
  // Swing level confluence (5 points)
  if (factors.swingLevel) {
    score += 5;
  }
  
  return Math.min(100, Math.round(score));
};
