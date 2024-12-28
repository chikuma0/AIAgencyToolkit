import Parser from 'rss-parser';
import type { NewsItem } from '@/types';
import { NewsScraper } from '../base-scraper';

export abstract class BaseRssScraper extends NewsScraper {
  private parser: Parser;
  private feedUrl: string;

  constructor(source: string, feedUrl: string) {
    super(source);
    this.feedUrl = feedUrl;
    this.parser = new Parser({
      customFields: {
        item: ['description', 'content:encoded']
      }
    });
  }

  async fetchNews(): Promise<NewsItem[]> {
    try {
      const feed = await this.parser.parseURL(this.feedUrl);
      return feed.items
        .slice(0, this.options.limit)
        .map(item => this.mapToNewsItem(item));
    } catch (error) {
      console.error(`Error fetching RSS feed from ${this.feedUrl}:`, error);
      return [];
    }
  }

  protected abstract mapToNewsItem(item: Parser.Item): NewsItem;
}