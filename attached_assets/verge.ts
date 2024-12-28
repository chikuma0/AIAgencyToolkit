import type { NewsItem, ContentPriority } from '@/types';
import { BaseRssScraper } from './base-rss-scraper';

export class VergeScraper extends BaseRssScraper {
  constructor() {
    // Update to include source name
    super('The Verge', 'https://www.theverge.com/rss/ai-artificial-intelligence/index.xml');
  }

  protected mapToNewsItem(item: any): NewsItem {
    const id = `verge-${Buffer.from(item.guid).toString('base64').slice(0, 10)}`;
    const text = `${item.title} ${item.contentSnippet}`;
    
    return {
      id,
      title: item.title,
      url: item.link,
      source: 'The Verge',
      publishedAt: new Date(item.pubDate).toISOString(),
      summary: item.contentSnippet,
      priority: this.determinePriority(text),
      contentCategory: this.categorizeContent(text)
    };
  }

  protected determinePriority(text: string): ContentPriority {
    if (text.includes('ai') && (
      text.includes('business') || 
      text.includes('enterprise') || 
      text.includes('startup')
    )) {
      return 'business';
    }
    
    if (text.includes('launch') || 
        text.includes('announces') || 
        text.includes('releases')) {
      return 'industry';
    }
    
    if (text.includes('how') || 
        text.includes('guide') || 
        text.includes('tutorial')) {
      return 'implementation';
    }
    
    return 'general';
  }

  protected categorizeContent(text: string): string[] {
    const categories: string[] = [];

    const categoryMap = {
      'ai-tools': ['ai tool', 'platform', 'software', 'application'],
      'business-ops': ['business', 'enterprise', 'operations', 'company'],
      'implementation': ['implement', 'deploy', 'integrate', 'tutorial'],
      'industry-news': ['launch', 'announce', 'release', 'update']
    };

    Object.entries(categoryMap).forEach(([category, keywords]) => {
      if (keywords.some(keyword => text.includes(keyword))) {
        categories.push(category);
      }
    });

    return categories;
  }
}