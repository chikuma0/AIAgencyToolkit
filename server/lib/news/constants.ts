import type { ScoringCategory, ContentQualityFactors } from './types';

export const SCORING_CATEGORIES: Record<ScoringCategory, string[]> = {
  'smb-ai-focus': [
    'small business',
    'smb',
    'solopreneur',
    'freelancer',
    'startup',
    'entrepreneur',
    'business owner',
    'self-employed',
    'independent',
    'consulting',
    'agency',
    'automation',
    'productivity',
    'efficiency',
    'workflow'
  ],
  'implementation': [
    'how to',
    'guide',
    'tutorial',
    'case study',
    'example',
    'implementation',
    'setup',
    'getting started',
    'best practice',
    'step by step',
    'walkthrough',
    'integrate',
    'deploy',
    'use case',
    'solution'
  ],
  'cost-accessibility': [
    'free',
    'pricing',
    'affordable',
    'cost-effective',
    'budget',
    'subscription',
    'plan',
    'trial',
    'roi',
    'investment',
    'value',
    'save money',
    'reduce costs',
    'price comparison',
    'cost-benefit'
  ],
  'industry-context': [
    'ai tool',
    'platform update',
    'new feature',
    'improvement',
    'integration',
    'api',
    'compatibility',
    'security update',
    'performance',
    'optimization'
  ]
};

export const QUALITY_INDICATORS: Record<ContentQualityFactors, string[]> = {
  'actionable': [
    'step by step',
    'how to',
    'implement',
    'setup guide',
    'tutorial',
    'walkthrough',
    'quick start',
    'get started',
    'example code',
    'sample project'
  ],
  'practical': [
    'real world',
    'use case',
    'case study',
    'success story',
    'problem solved',
    'solution',
    'improvement',
    'results',
    'benefit',
    'outcome'
  ],
  'cost-effective': [
    'cost reduction',
    'save money',
    'affordable',
    'roi',
    'investment',
    'budget friendly',
    'pricing plan',
    'free tier',
    'cost comparison',
    'value for money'
  ],
  'clear-explanation': [
    'simple',
    'straightforward',
    'easy to follow',
    'beginner friendly',
    'explained',
    'breakdown',
    'overview',
    'introduction',
    'basics',
    'fundamentals'
  ]
};

// Category weights for final score calculation
export const CATEGORY_WEIGHTS = {
  'smb-ai-focus': 0.4,      // 40% weight - highest priority
  'implementation': 0.3,     // 30% weight - second priority
  'cost-accessibility': 0.2, // 20% weight - third priority
  'industry-context': 0.1    // 10% weight - lowest priority
};

// Quality factor weights
export const QUALITY_WEIGHTS = {
  'actionable': 0.3,         // Prioritize actionable content
  'practical': 0.3,          // Equal weight for practical value
  'cost-effective': 0.2,     // Cost considerations
  'clear-explanation': 0.2   // Clear communication
};

// Minimum thresholds for article inclusion
export const THRESHOLDS = {
  minimumPrimaryScore: 0.2,    // Must have some SMB/implementation relevance
  minimumQualityScore: 0.15,   // Must have some practical value
  primaryCategoryBonus: 0.2    // Bonus for highly relevant content
};