import type { NewsItem } from '../../../../client/src/types';
import { BaseRssScraper } from './base-rss-scraper';
import type Parser from 'rss-parser';

export class TechCrunchScraper extends BaseRssScraper {
  constructor() {
    super('TechCrunch', 'https://techcrunch.com/tag/artificial-intelligence/feed/');
  }

  protected mapToNewsItem(item: Parser.Item): NewsItem {
    const id = `tc-${Buffer.from(item.guid || '').toString('base64').slice(0, 10)}`;
    const text = `${item.title} ${item.contentSnippet || ''}`;
    
    return {
      id,
      title: item.title || '',
      url: item.link || '',
      source: 'TechCrunch',
      publishedAt: item.pubDate ? new Date(item.pubDate).toISOString() : new Date().toISOString(),
      summary: item.contentSnippet || '',
      priority: this.determinePriority(text),
      contentCategory: this.categorizeContent(text)
    };
  }
}
