import axios from 'axios';
import * as cheerio from 'cheerio';
import type { NewsItem, ContentPriority } from '@/types';
import { NewsScraper, type ScraperOptions } from '../base-scraper';

export class TechmemeScraper extends NewsScraper {
  constructor(options?: ScraperOptions) {
    super('Techmeme', options);
  }

  protected async fetchNewsInternal(): Promise<NewsItem[]> {
    try {
      const response = await axios.get(this.baseUrl);
      const $ = cheerio.load(response.data);
      const newsItems: NewsItem[] = [];

      $('.item').slice(0, this.options.limit).each((_, element) => {
        const $item = $(element);
        const title = $item.find('.itemtitle').text().trim();
        const url = $item.find('a').first().attr('href') || '';
        const timestamp = $item.find('.timestamp').text().trim();
        const source = $item.find('.source').text().trim();
        const summary = $item.find('.itemtext').text().trim();

        if (title && url) {
          newsItems.push(this.createNewsItem({
            title,
            url,
            timestamp,
            source,
            summary
          }));
        }
      });

      return newsItems;
    } catch (error) {
      console.error('Error fetching from Techmeme:', error);
      return [];
    }
  }

  protected createNewsItem(data: {
    title: string;
    url: string;
    timestamp: string;
    source: string;
    summary: string;
  }): NewsItem {
    const id = `tm-${Buffer.from(data.url).toString('base64').slice(0, 10)}`;
    const text = `${data.title} ${data.summary}`;
    
    return {
      id,
      title: data.title,
      url: data.url,
      source: 'Techmeme',
      publishedAt: data.timestamp 
        ? new Date(data.timestamp).toISOString()
        : new Date().toISOString(),
      summary: data.summary,
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