export type ScoringCategory = 
  | 'smb-ai-focus'
  | 'implementation'
  | 'cost-accessibility'
  | 'industry-context';

export type ContentQualityFactors = 
  | 'actionable'
  | 'practical'
  | 'cost-effective'
  | 'clear-explanation';

export interface CategoryScore {
  category: ScoringCategory;
  score: number;
  matches: string[];
}

export interface QualityScore {
  factor: ContentQualityFactors;
  score: number;
  indicators: string[];
}

export interface ArticleScore {
  categoryScores: CategoryScore[];
  qualityScores: QualityScore[];
  totalScore: number;
  debugInfo: {
    title: string;
    categoryBreakdown: Record<ScoringCategory, number>;
    qualityBreakdown: Record<ContentQualityFactors, number>;
    bonusApplied: boolean;
  };
}
