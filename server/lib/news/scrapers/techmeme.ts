import axios from 'axios';
import * as cheerio from 'cheerio';
import type { NewsItem } from '../../../../client/src/types';
import { NewsScraper, type ScraperOptions } from './base-scraper';

export class TechmemeScraper extends NewsScraper {
  private baseUrl = 'https://techmeme.com/';

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
        const title = $item.find('.ourh').text().trim();
        const url = $item.find('.ourh a').first().attr('href') || '';
        const timestamp = $item.find('.timestamp').text().trim();
        const source = $item.find('.source').text().trim();
        const summary = $item.find('.ii').text().trim();

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
      throw this.handleError(error);
    }
  }

  private createNewsItem(data: {
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
}