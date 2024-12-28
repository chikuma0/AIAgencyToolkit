import type { NewsItem, ContentPriority } from '@/types';

export interface NewsScraping {
  fetchNews(): Promise<NewsItem[]>;
  determinePriority(text: string): ContentPriority;
  categorizeContent(text: string): string[];
}

export interface RssScraping extends NewsScraping {
  mapToNewsItem(item: any): NewsItem;
} 