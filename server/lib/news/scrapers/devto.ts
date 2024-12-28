import axios from 'axios';
import type { NewsItem } from '../../../../client/src/types';
import { NewsScraper, type ScraperOptions } from './base-scraper';

interface DevToArticle {
  id: number;
  title: string;
  description: string;
  url: string;
  published_at: string;
  positive_reactions_count: number;
  comments_count: number;
  user: {
    name: string;
  };
  tag_list: string[]; // Changed from tags to tag_list to match Dev.to API
}

export class DevToScraper extends NewsScraper {
  private baseUrl = 'https://dev.to/api/articles';

  constructor(options?: ScraperOptions) {
    super('Dev.to', { limit: 10, ...options });
  }

  protected async fetchNewsInternal(): Promise<NewsItem[]> {
    try {
      const response = await axios.get(this.baseUrl, {
        params: {
          tag: 'artificial-intelligence',
          state: 'rising',
          per_page: this.options.limit
        }
      });

      return this.parseContent(response.data);
    } catch (error) {
      throw this.handleError(error);
    }
  }

  protected parseContent(items: DevToArticle[]): NewsItem[] {
    return items.map(article => {
      // Normalize the text content to make it more concise
      const text = `${article.title} ${article.description} ${article.tag_list.join(' ')}`;
      const summary = article.description?.length > 200 
        ? `${article.description.substring(0, 197)}...`
        : article.description;

      return {
        id: `devto-${article.id}`,
        title: article.title,
        url: article.url,
        source: 'Dev.to',
        publishedAt: article.published_at,
        score: article.positive_reactions_count,
        comments: article.comments_count,
        by: article.user.name,
        summary,
        priority: this.determinePriority(text),
        contentCategory: this.categorizeContent(text)
      };
    });
  }
}