import { ScraperError, NetworkError, ParseError, RateLimitError } from './utils/errors';
import { CATEGORY_KEYWORDS, PRIORITY_KEYWORDS } from './constants';
import type { ContentPriority, NewsItem } from '@/types';
import axios, { AxiosError } from 'axios';

export abstract class NewsScraper {
  protected options: ScraperOptions;
  protected source: string;

  constructor(source: string, options?: ScraperOptions) {
    this.source = source;
    this.options = {
      limit: 30,
      retries: 3,
      retryDelay: 1000,
      ...options
    };
  }

  async fetchNews(): Promise<NewsItem[]> {
    let lastError: Error | undefined;
    
    for (let attempt = 1; attempt <= this.options.retries!; attempt++) {
      try {
        return await this.fetchNewsInternal();
      } catch (error) {
        lastError = this.handleError(error);
        
        if (error instanceof RateLimitError) {
          // Don't retry rate limit errors
          throw error;
        }
        
        if (attempt < this.options.retries!) {
          await this.delay(this.options.retryDelay! * attempt);
          continue;
        }
      }
    }
    
    throw lastError || new ScraperError(`Failed to fetch news from ${this.source}`, this.source);
  }

  protected abstract fetchNewsInternal(): Promise<NewsItem[]>;

  protected handleError(error: unknown): Error {
    if (error instanceof ScraperError) {
      return error;
    }

    if (axios.isAxiosError(error)) {
      const axiosError = error as AxiosError;
      
      if (axiosError.response?.status === 429) {
        return new RateLimitError(this.source, error);
      }
      
      if (axiosError.response?.status === 404) {
        return new ScraperError(`Resource not found at ${this.source}`, this.source, error);
      }
      
      if (!axiosError.response || axiosError.code === 'ECONNABORTED') {
        return new NetworkError(this.source, error);
      }
    }

    if (error instanceof SyntaxError) {
      return new ParseError(this.source, error);
    }

    return new ScraperError(
      `Unexpected error from ${this.source}: ${error instanceof Error ? error.message : String(error)}`,
      this.source,
      error instanceof Error ? error : undefined
    );
  }

  protected async delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  protected determinePriority(text: string): ContentPriority {
    const lowerText = text.toLowerCase();
    
    if (PRIORITY_KEYWORDS.business.some(term => lowerText.includes(term))) {
      return 'business';
    }
    if (PRIORITY_KEYWORDS.industry.some(term => lowerText.includes(term))) {
      return 'industry';
    }
    if (PRIORITY_KEYWORDS.implementation.some(term => lowerText.includes(term))) {
      return 'implementation';
    }
    return 'general';
  }

  protected categorizeContent(text: string): string[] {
    const categories: string[] = [];
    const lowerText = text.toLowerCase();

    Object.entries(CATEGORY_KEYWORDS).forEach(([category, keywords]) => {
      if (keywords.some(keyword => lowerText.includes(keyword))) {
        categories.push(category);
      }
    });

    return categories;
  }
}

export interface ScraperOptions {
  limit?: number;
  retries?: number;
  retryDelay?: number;
}
