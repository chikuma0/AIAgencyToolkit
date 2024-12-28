import type { ScraperOptions } from './base-scraper';
import type { NewsScraping } from './types';

export class ScraperFactory {
  static create(type: string, options?: ScraperOptions): NewsScraping {
    switch (type.toLowerCase()) {
      case 'techcrunch':
        return new TechCrunchScraper(options);
      case 'verge':
        return new VergeScraper(options);
      // ... other scrapers
      default:
        throw new Error(`Unknown scraper type: ${type}`);
    }
  }
} 