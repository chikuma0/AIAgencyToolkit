import type { NewsItem, NewsResponse, FilterOptions } from '../../../client/src/types';
import { HackerNewsScraper } from './scrapers/hackernews';
import { TechCrunchScraper } from './scrapers/techcrunch';
import { GitHubScraper } from './scrapers/github';
import { DevToScraper } from './scrapers/devto';
import { ProductHuntScraper } from './scrapers/producthunt';
import { VergeScraper } from './scrapers/verge';
import { TechmemeScraper } from './scrapers/techmeme';
import { db } from '@db';
import { newsItems } from '@db/schema';
import { calculateRelevanceScore } from './scoring';
import logger from '../logger';
import { sql } from 'drizzle-orm';

export class NewsService {
  private scrapers: Array<HackerNewsScraper | TechCrunchScraper | GitHubScraper | DevToScraper | ProductHuntScraper | VergeScraper | TechmemeScraper>;
  private readonly MAX_ARTICLES_PER_SOURCE = 3;
  private readonly MIN_RELEVANCE_SCORE = 0.15; // Lowered threshold

  constructor() {
    logger.info('NewsService: Initializing');
    try {
      // Order sources by likelihood of relevant content
      this.scrapers = [
        new ProductHuntScraper({ limit: 10 }), // Products and tools
        new GitHubScraper({ limit: 10 }),      // AI tools and implementations
        new DevToScraper({ limit: 10 }),       // Practical tutorials and guides
        new TechCrunchScraper(),               // SMB/startup focused
        new VergeScraper(),                    // General tech with business angle
        new HackerNewsScraper({ limit: 10 }),  // Mixed content
        new TechmemeScraper({ limit: 10 })     // Industry news
      ];
      logger.info('NewsService: All scrapers initialized');
    } catch (error) {
      logger.error('NewsService: Error initializing scrapers:', error);
      throw error;
    }
  }

  async getNews(filters?: FilterOptions): Promise<NewsResponse> {
    logger.info('NewsService: Starting news fetch');

    try {
      // Fetch from all scrapers in parallel
      logger.info('NewsService: Fetching from scrapers');
      const scrapePromises = this.scrapers.map(async scraper => {
        try {
          const items = await scraper.fetchNews();
          logger.info(`NewsService: Fetched ${items.length} items from ${scraper.constructor.name}`);
          return items;
        } catch (error) {
          logger.error(`NewsService: Scraper ${scraper.constructor.name} failed:`, error);
          return [];
        }
      });

      const allResults = await Promise.all(scrapePromises);
      let allItems: NewsItem[] = allResults.flat();

      // Score all items
      logger.info(`NewsService: Scoring ${allItems.length} total items`);
      const scoredItems = allItems.map(item => ({
        item,
        relevanceScore: calculateRelevanceScore(item)
      }));

      // Log all scored items for debugging
      scoredItems.forEach(({ item, relevanceScore }) => {
        logger.debug('Article Score:', {
          title: item.title,
          source: item.source,
          score: relevanceScore,
          summary: item.summary?.substring(0, 100)
        });
      });

      // Filter by minimum score
      const relevantItems = scoredItems
        .filter(({ relevanceScore }) => relevanceScore >= this.MIN_RELEVANCE_SCORE)
        .sort((a, b) => b.relevanceScore - a.relevanceScore)
        .map(({ item }) => item);

      logger.info(`NewsService: Found ${relevantItems.length} relevant items after filtering`);

      // Get diverse set of articles
      const finalItems = this.diversifyResults(relevantItems);
      logger.info(`NewsService: Selected ${finalItems.length} diverse items`);

      // Save to database
      if (finalItems.length > 0) {
        try {
          await this.saveNews(finalItems);
        } catch (error) {
          logger.error('NewsService: Error saving to database:', error);
        }
      }

      if (finalItems.length === 0) {
        // Fallback to database if no fresh items
        logger.info('NewsService: No fresh items, checking database');
        const dbItems = await this.getFromDatabase();
        if (dbItems.length > 0) {
          return { items: filters ? this.filterNewsItems(dbItems, filters) : dbItems };
        }
      }

      return {
        items: filters ? this.filterNewsItems(finalItems, filters) : finalItems
      };
    } catch (error) {
      logger.error('NewsService: Error in getNews:', error);
      return {
        items: [],
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  private async getFromDatabase(): Promise<NewsItem[]> {
    const dbNews = await db.select()
      .from(newsItems)
      .where(sql`relevance_score >= ${this.MIN_RELEVANCE_SCORE}`)
      .orderBy(sql`relevance_score DESC, published_at DESC`)
      .limit(10);

    return this.mapDbNewsToNewsItems(dbNews);
  }

  private diversifyResults(items: NewsItem[]): NewsItem[] {
    // Group items by source
    const itemsBySource = new Map<string, NewsItem[]>();
    items.forEach(item => {
      if (!itemsBySource.has(item.source)) {
        itemsBySource.set(item.source, []);
      }
      itemsBySource.get(item.source)!.push(item);
    });

    // Get top items from each source
    const diversifiedItems: NewsItem[] = [];
    itemsBySource.forEach((sourceItems, source) => {
      const topItems = sourceItems
        .slice(0, this.MAX_ARTICLES_PER_SOURCE);

      logger.info(`Source ${source}: selected ${topItems.length} items`);
      diversifiedItems.push(...topItems);
    });

    return diversifiedItems;
  }

  private async saveNews(items: NewsItem[]) {
    const expiryDate = new Date();
    expiryDate.setDate(expiryDate.getDate() + 1);

    await db.insert(newsItems).values(
      items.map(item => ({
        id: item.id,
        title: item.title,
        url: item.url,
        source: item.source,
        published_at: new Date(item.publishedAt),
        priority: item.priority || 'general',
        relevance_score: calculateRelevanceScore(item).toString(),
        content_category: item.contentCategory || [],
        summary: item.summary || null,
        score: item.score?.toString() || null,
        comments: item.comments?.toString() || null,
        by: item.by || null,
        expires_at: expiryDate
      }))
    ).onConflictDoUpdate({
      target: newsItems.id,
      set: {
        relevance_score: sql`EXCLUDED.relevance_score`,
        score: sql`EXCLUDED.score`,
        comments: sql`EXCLUDED.comments`,
        summary: sql`EXCLUDED.summary`
      }
    });
  }

  private filterNewsItems(items: NewsItem[], filters: FilterOptions): NewsItem[] {
    return items.filter(item => {
      if (filters.category && (!item.contentCategory || !item.contentCategory.includes(filters.category))) {
        return false;
      }
      if (filters.priority && item.priority !== filters.priority) {
        return false;
      }
      if (filters.source && item.source !== filters.source) {
        return false;
      }
      return true;
    });
  }

  private mapDbNewsToNewsItems(dbNews: any[]): NewsItem[] {
    return dbNews.map(item => ({
      id: item.id,
      title: item.title,
      url: item.url,
      source: item.source,
      publishedAt: item.published_at.toISOString(),
      priority: item.priority,
      relevanceScore: parseFloat(item.relevance_score),
      contentCategory: item.content_category as string[],
      summary: item.summary,
      score: item.score ? parseFloat(item.score) : undefined,
      comments: item.comments ? parseFloat(item.comments) : undefined,
      by: item.by
    }));
  }
}