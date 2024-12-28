import { ScraperError, NetworkError, ParseError, RateLimitError } from '../utils/errors';
import { SCORING_CATEGORIES, QUALITY_INDICATORS } from '../constants';
import type { ContentPriority, NewsItem } from '../../../../client/src/types';
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

    // Use SMB/AI focus and implementation categories to determine priority
    const aiTerms = SCORING_CATEGORIES['smb-ai-focus'];
    const impTerms = SCORING_CATEGORIES['implementation'];
    const costTerms = SCORING_CATEGORIES['cost-accessibility'];

    if (aiTerms.some(term => lowerText.includes(term)) && costTerms.some(term => lowerText.includes(term))) {
      return 'business';
    }

    if (impTerms.some(term => lowerText.includes(term))) {
      return 'implementation';
    }

    if (aiTerms.some(term => lowerText.includes(term))) {
      return 'industry';
    }

    return 'general';
  }

  protected categorizeContent(text: string): string[] {
    const categories: string[] = [];
    const lowerText = text.toLowerCase();

    // Map scoring categories to content categories
    const categoryMap = {
      'ai-tools': SCORING_CATEGORIES['smb-ai-focus'],
      'business-ops': SCORING_CATEGORIES['cost-accessibility'],
      'implementation': SCORING_CATEGORIES['implementation'],
      'industry-news': SCORING_CATEGORIES['industry-context']
    };

    Object.entries(categoryMap).forEach(([category, keywords]) => {
      if (keywords.some((keyword: string) => lowerText.includes(keyword))) {
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