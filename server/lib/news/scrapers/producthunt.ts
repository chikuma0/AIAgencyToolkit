import axios from 'axios';
import type { NewsItem } from '../../../../client/src/types';
import { NewsScraper, type ScraperOptions } from './base-scraper';
import logger from '../../logger';

interface PHProduct {
  id: number;
  name: string;
  tagline: string;
  description: string;
  url: string;
  votes_count: number;
  comments_count: number;
  created_at: string;
  topics: { name: string }[];
}

export class ProductHuntScraper extends NewsScraper {
  private baseUrl = 'https://api.producthunt.com/v2/api/graphql';
  private apiToken: string | undefined;

  constructor(options?: ScraperOptions) {
    super('Product Hunt', { limit: 10, ...options });
    this.apiToken = process.env.PRODUCT_HUNT_TOKEN;

    if (!this.apiToken) {
      logger.warn('ProductHuntScraper: No API token available, this source will be skipped');
    }
  }

  protected async fetchNewsInternal(): Promise<NewsItem[]> {
    if (!this.apiToken) {
      return []; // Skip if no token available
    }

    try {
      const query = `
        query {
          posts(first: ${this.options.limit}, topic: "ARTIFICIAL_INTELLIGENCE") {
            edges {
              node {
                id
                name
                tagline
                description
                url
                votesCount
                commentsCount
                createdAt
                topics {
                  edges {
                    node {
                      name
                    }
                  }
                }
              }
            }
          }
        }
      `;

      const response = await axios.post(
        this.baseUrl,
        { query },
        {
          headers: {
            'Authorization': `Bearer ${this.apiToken}`,
            'Content-Type': 'application/json',
            'Accept': 'application/json',
          }
        }
      );

      const products = response.data.data.posts.edges.map((edge: any) => edge.node);
      return this.parseContent(products);
    } catch (error) {
      if (axios.isAxiosError(error) && error.response?.status === 401) {
        logger.error('ProductHuntScraper: Invalid API token');
        return []; // Skip this source on auth error
      }
      throw this.handleError(error);
    }
  }

  protected parseContent(items: PHProduct[]): NewsItem[] {
    return items.map(product => {
      // Normalize text content for consistency
      const text = `${product.name} ${product.tagline} ${product.description || ''}`;
      const summary = product.description?.length > 200 
        ? `${product.description.substring(0, 197)}...`
        : (product.description || product.tagline);

      return {
        id: `ph-${product.id}`,
        title: `${product.name} - ${product.tagline}`,
        url: product.url,
        source: 'Product Hunt',
        publishedAt: product.created_at,
        score: product.votes_count,
        comments: product.comments_count,
        summary,
        priority: this.determinePriority(text),
        contentCategory: this.categorizeContent(text)
      };
    });
  }
}