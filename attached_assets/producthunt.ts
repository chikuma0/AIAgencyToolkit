import axios from 'axios';
import type { NewsItem, ContentPriority } from '@/types';
import { NewsScraper, type ScraperOptions } from '../base-scraper';

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
  private apiToken = process.env.PRODUCT_HUNT_TOKEN;

  constructor(options?: ScraperOptions) {
    super('Product Hunt', { limit: 10, ...options });
  }

  protected async fetchNewsInternal(): Promise<NewsItem[]> {
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
      throw this.handleError(error);
    }
  }

  protected parseContent(items: PHProduct[]): NewsItem[] {
    return items.map(product => {
      const text = `${product.name} ${product.tagline} ${product.description}`;
      
      return {
        id: `ph-${product.id}`,
        title: `${product.name} - ${product.tagline}`,
        url: product.url,
        source: 'Product Hunt',
        publishedAt: product.created_at,
        score: product.votes_count,
        comments: product.comments_count,
        summary: product.description,
        priority: this.determinePriority(text),
        contentCategory: this.categorizeContent(text)
      };
    });
  }

  protected determinePriority(text: string): ContentPriority {
    const lowerText = text.toLowerCase();
    if (lowerText.includes('business') || lowerText.includes('enterprise')) return 'business';
    if (lowerText.includes('launch') || lowerText.includes('startup')) return 'industry';
    if (lowerText.includes('tutorial') || lowerText.includes('guide')) return 'implementation';
    return 'general';
  }

  protected categorizeContent(text: string): string[] {
    const categories: string[] = [];
    const lowerText = text.toLowerCase();

    const categoryMap = {
      'ai-tools': ['ai tool', 'platform', 'automation', 'bot'],
      'business-ops': ['business', 'enterprise', 'workflow', 'productivity'],
      'implementation': ['integration', 'api', 'sdk', 'tutorial'],
      'industry-news': ['launch', 'new', 'release', 'update']
    };

    Object.entries(categoryMap).forEach(([category, keywords]) => {
      if (keywords.some(keyword => lowerText.includes(keyword))) {
        categories.push(category);
      }
    });

    return categories;
  }
} 