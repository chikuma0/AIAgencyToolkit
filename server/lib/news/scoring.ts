import type { NewsItem } from '../../../client/src/types';
import { SCORING_CATEGORIES, QUALITY_INDICATORS } from './constants';
import logger from '../logger';

// Initial screening criteria - must pass these to be considered
const INITIAL_SCREENING = {
  smbRelevance: [
    'small business', 'smb', 'solopreneur', 'freelancer', 'startup',
    'business owner', 'entrepreneur', 'self-employed'
  ],
  practicalAI: [
    'automation', 'workflow', 'productivity', 'tool', 'solution',
    'platform', 'integration', 'implement'
  ],
  costFocus: [
    'pricing', 'cost', 'free', 'affordable', 'budget', 
    'subscription', 'plan', 'roi', 'save'
  ]
};

export function calculateRelevanceScore(item: NewsItem): number {
  const text = `${item.title} ${item.summary || ''}`.toLowerCase();

  // Stage 1: Initial Screening - Must pass at least one criteria from each category
  const screeningResults = {
    smbRelevance: INITIAL_SCREENING.smbRelevance.some(term => text.includes(term)),
    practicalAI: INITIAL_SCREENING.practicalAI.some(term => text.includes(term)),
    costFocus: INITIAL_SCREENING.costFocus.some(term => text.includes(term))
  };

  // Log screening results for debugging
  logger.debug('Initial Screening Results:', {
    title: item.title,
    screening: screeningResults
  });

  // If content doesn't pass initial screening, score it very low
  const screeningScore = Object.values(screeningResults).filter(Boolean).length / 3;
  if (screeningScore < 0.33) { // Must pass at least one category
    return 0.1; // Very low score for content that doesn't meet basic criteria
  }

  // Stage 2: Detailed Scoring
  const categoryMatches = {
    smbFocus: countMatches(text, SCORING_CATEGORIES['smb-ai-focus']),
    implementation: countMatches(text, SCORING_CATEGORIES['implementation']),
    costValue: countMatches(text, SCORING_CATEGORIES['cost-accessibility']),
    industryContext: countMatches(text, SCORING_CATEGORIES['industry-context'])
  };

  // Calculate weighted scores based on priority
  const weightedScores = {
    smbFocus: categoryMatches.smbFocus * 0.4,      // 40% weight for SMB focus
    implementation: categoryMatches.implementation * 0.3, // 30% for implementation
    costValue: categoryMatches.costValue * 0.2,     // 20% for cost/value
    industryContext: categoryMatches.industryContext * 0.1 // 10% for context
  };

  // Quality multiplier based on practical value indicators
  const qualityIndicators = Object.values(QUALITY_INDICATORS)
    .flat()
    .filter(indicator => text.includes(indicator));

  const qualityMultiplier = Math.min(1 + (qualityIndicators.length * 0.1), 1.5);

  // Calculate base score
  const baseScore = Object.values(weightedScores).reduce((sum, score) => sum + score, 0);

  // Apply quality multiplier
  let finalScore = baseScore * qualityMultiplier;

  // Apply recency boost
  const ageInHours = (Date.now() - new Date(item.publishedAt).getTime()) / (1000 * 60 * 60);
  const recencyBoost = Math.max(0, 0.2 * (1 - ageInHours / 48)); // 48-hour decay
  finalScore += recencyBoost;

  // Normalize final score
  finalScore = Math.min(Math.max(finalScore, 0), 1);

  // Detailed logging
  logger.debug('Detailed Scoring:', {
    title: item.title,
    categoryMatches,
    weightedScores,
    qualityIndicators: qualityIndicators.length,
    qualityMultiplier,
    baseScore,
    recencyBoost,
    finalScore
  });

  return finalScore;
}

function countMatches(text: string, terms: string[]): number {
  return terms.filter(term => text.includes(term)).length / terms.length;
}