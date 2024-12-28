import type { NewsItem, ContentPriority } from '@/types';
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

  protected determinePriority(text: string): ContentPriority {
    const lowerText = text.toLowerCase();
    if (lowerText.includes('business') || lowerText.includes('enterprise')) return 'business';
    if (lowerText.includes('launch') || lowerText.includes('startup')) return 'industry';
    if (lowerText.includes('tutorial') || lowerText.includes('guide')) return 'implementation';
    return 'general';
  }

  protected categorizeContent(text: string): string[] {
    const lowerText = text.toLowerCase();
    const categories: string[] = [];

    const categoryMap = {
      'ai-tools': ['ai tool', 'platform', 'software', 'application'],
      'business-ops': ['business', 'enterprise', 'operations', 'company'],
      'implementation': ['implement', 'deploy', 'integrate', 'tutorial'],
      'industry-news': ['launch', 'announce', 'release', 'update']
    };

    Object.entries(categoryMap).forEach(([category, keywords]) => {
      if (keywords.some(keyword => lowerText.includes(keyword))) {
        categories.push(category);
      }
    });

    return categories;
  }
}