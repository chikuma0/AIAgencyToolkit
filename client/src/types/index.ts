export type ContentPriority = 'business' | 'industry' | 'implementation' | 'general';

export interface NewsItem {
  id: string;
  title: string;
  url: string;
  source: string;
  publishedAt: string;
  priority?: ContentPriority;
  contentCategory?: string[];
  summary?: string;
  score?: number;
  comments?: number;
  by?: string;
  relevanceScore?: number;
}

export interface NewsResponse {
  items: NewsItem[];
  errors?: Error[];
  error?: string;
}

export interface FilterOptions {
  category?: string;
  priority?: string;
  source?: string;
}
