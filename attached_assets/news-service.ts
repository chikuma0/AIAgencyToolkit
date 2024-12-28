import { NewsScraper } from './base-scraper';
import type { NewsItem, NewsResponse } from '@/types';
import { HackerNewsScraper } from './scrapers/hackernews';
import { TechCrunchScraper } from './scrapers/techcrunch';
import { TechmemeScraper } from './scrapers/techmeme';
import { VergeScraper } from './scrapers/verge';
import { GitHubScraper } from './scrapers/github';
import { ProductHuntScraper } from './scrapers/producthunt';
import { DevToScraper } from './scrapers/devto';
import { supabase } from '@/lib/supabase/client';
import { calculateWeightedScore } from './utils/scoring';
import { CATEGORY_KEYWORDS } from './constants';
import { filterNewsItems, type FilterOptions } from './utils/filters';
import { ScraperError, RateLimitError } from './utils/errors';

export class NewsService {
  private scrapers: NewsScraper[];

  constructor() {
    console.log('NewsService: Initializing');
    
    try {
      this.scrapers = [
        new HackerNewsScraper(),
        // Comment out other scrapers temporarily for testing
        // new TechCrunchScraper(),
        // new TechmemeScraper(),
        // new VergeScraper(),
      ];
      console.log('NewsService: Scrapers initialized');
    } catch (error) {
      console.error('NewsService: Error initializing scrapers:', error);
      throw error;
    }
  }

  async getNews(filters?: FilterOptions): Promise<NewsResponse> {
    console.log('NewsService: Starting news fetch');
    
    try {
      // First try to get from Supabase
      console.log('NewsService: Checking Supabase');
      const { data: dbNews, error: dbError } = await supabase
        .from('news_items')
        .select('*')
        .order('relevance_score', { ascending: false });

      if (dbError) {
        console.error('NewsService: Database error:', dbError);
        throw new Error('Failed to fetch news from database');
      }

      if (dbNews && dbNews.length > 0) {
        console.log('NewsService: Found news in database');
        const items = this.mapDbNewsToNewsItems(dbNews);
        return { 
          items: filters ? filterNewsItems(items, filters) : items 
        };
      }

      console.log('NewsService: Fetching from scrapers');
      // If no news in DB, fetch from all sources
      const results = await Promise.allSettled(
        this.scrapers.map(scraper => scraper.fetchNews())
      );

      const items: NewsItem[] = [];
      const errors: ScraperError[] = [];

      results.forEach((result, index) => {
        if (result.status === 'fulfilled') {
          items.push(...result.value);
        } else {
          console.error(`NewsService: Scraper ${index} failed:`, result.reason);
          if (result.reason instanceof ScraperError) {
            errors.push(result.reason);
          }
        }
      });

      // Save successful items to database
      if (items.length > 0) {
        console.log('NewsService: Saving to database');
        await this.saveNews(items);
      }

      return {
        items: filters ? filterNewsItems(items, filters) : items,
        errors: errors.length > 0 ? errors : undefined
      };
    } catch (error) {
      console.error('NewsService: Error in getNews:', error);
      return {
        items: [],
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  async saveNews(items: NewsItem[]) {
    const expiryDate = new Date();
    expiryDate.setMonth(expiryDate.getMonth() + 6);

    const { data, error } = await supabase
      .from('news_items')
      .upsert(
        items.map(item => ({
          id: item.id,
          title: item.title,
          url: item.url,
          source: item.source,
          published_at: item.publishedAt,
          priority: item.priority || 'general',
          relevance_score: calculateWeightedScore(item),
          content_category: item.contentCategory || this.categorizeContent(item),
          summary: item.summary,
          score: item.score,
          comments: item.comments,
          by: item.by,
          expires_at: expiryDate.toISOString()
        }))
      )
      .select();

    if (error) throw error;
    return data;
  }

  private categorizeContent(item: NewsItem): string[] {
    const categories: string[] = [];
    const text = `${item.title} ${item.summary || ''}`.toLowerCase();

    Object.entries(CATEGORY_KEYWORDS).forEach(([category, keywords]) => {
      if (keywords.some(keyword => text.includes(keyword))) {
        categories.push(category);
      }
    });

    return categories;
  }

  private mapDbNewsToNewsItems(dbNews: any[]): NewsItem[] {
    return dbNews.map(item => ({
      id: item.id,
      title: item.title,
      url: item.url,
      source: item.source,
      publishedAt: item.published_at,
      summary: item.summary,
      priority: item.priority,
      relevanceScore: item.relevance_score,
      contentCategory: item.content_category
    }));
  }
}