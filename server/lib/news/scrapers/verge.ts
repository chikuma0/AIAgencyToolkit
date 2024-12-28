import type { NewsItem } from '../../../../client/src/types';
import { BaseRssScraper } from './base-rss-scraper';
import type Parser from 'rss-parser';

export class VergeScraper extends BaseRssScraper {
  constructor() {
    super('The Verge', 'https://www.theverge.com/rss/ai-artificial-intelligence/index.xml');
  }

  protected mapToNewsItem(item: Parser.Item): NewsItem {
    const id = `verge-${Buffer.from(item.guid || '').toString('base64').slice(0, 10)}`;
    const text = `${item.title} ${item.contentSnippet || ''}`;
    
    return {
      id,
      title: item.title || '',
      url: item.link || '',
      source: 'The Verge',
      publishedAt: item.pubDate ? new Date(item.pubDate).toISOString() : new Date().toISOString(),
      summary: item.contentSnippet || '',
      priority: this.determinePriority(text),
      contentCategory: this.categorizeContent(text)
    };
  }
}
