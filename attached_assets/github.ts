import axios from 'axios';
import type { NewsItem, ContentPriority } from '@/types';
import { NewsScraper, type ScraperOptions } from '../base-scraper';

interface GitHubRepo {
  name: string;
  owner: {
    login: string;
  };
  html_url: string;
  description: string;
  stargazers_count: number;
  created_at: string;
  topics: string[];
}

export class GitHubScraper extends NewsScraper {
  private baseUrl = 'https://api.github.com';
  private aiKeywords = ['ai', 'artificial-intelligence', 'machine-learning', 'deep-learning', 'llm', 'gpt'];
  
  constructor(options?: ScraperOptions) {
    super('GitHub', { limit: 10, ...options }); // Add source name
  }

  // Change from fetchNews to fetchNewsInternal
  protected async fetchNewsInternal(): Promise<NewsItem[]> {
    try {
      // Search for AI-related repositories created in the last week
      const query = this.aiKeywords.map(k => `topic:${k}`).join(' OR ');
      const response = await axios.get(
        `${this.baseUrl}/search/repositories`, {
          params: {
            q: `${query} created:>=${this.getLastWeekDate()}`,
            sort: 'stars',
            order: 'desc',
            per_page: this.options.limit
          },
          headers: {
            'Accept': 'application/vnd.github.v3+json',
            ...(process.env.GITHUB_TOKEN && {
              'Authorization': `token ${process.env.GITHUB_TOKEN}`
            })
          }
        }
      );

      return this.parseContent(response.data.items);
    } catch (error) {
      // Let base class handle errors
      throw this.handleError(error);
    }
  }

  protected parseContent(items: GitHubRepo[]): NewsItem[] {
    return items.map(repo => {
      const text = `${repo.name} ${repo.description || ''} ${repo.topics.join(' ')}`;
      return {
        id: `gh-${repo.owner.login}-${repo.name}`,
        title: `${repo.name} - ${repo.description || 'New AI Repository'}`,
        url: repo.html_url,
        source: 'GitHub',
        publishedAt: repo.created_at,
        score: repo.stargazers_count,
        by: repo.owner.login,
        summary: this.generateSummary(repo),
        priority: this.determinePriority(text),
        contentCategory: this.categorizeContent(text)
      };
    });
  }

  private generateSummary(repo: GitHubRepo): string {
    return `${repo.description || ''} | ${repo.stargazers_count} stars | Topics: ${repo.topics.join(', ')}`;
  }

  // Change from private to protected to match base class
  protected determinePriority(text: string): ContentPriority {
    const lowerText = text.toLowerCase();
    
    if (lowerText.includes('business') || lowerText.includes('enterprise')) {
      return 'business';
    }
    if (lowerText.includes('framework') || lowerText.includes('platform')) {
      return 'industry';
    }
    if (lowerText.includes('tutorial') || lowerText.includes('example')) {
      return 'implementation';
    }
    return 'general';
  }

  // Change from private to protected to match base class
  protected categorizeContent(text: string): string[] {
    const categories: string[] = [];
    const lowerText = text.toLowerCase();

    const categoryMap = {
      'ai-tools': ['model', 'framework', 'library', 'sdk'],
      'business-ops': ['business', 'enterprise', 'production'],
      'implementation': ['example', 'tutorial', 'demo', 'template'],
      'industry-news': ['release', 'launch', 'new']
    };

    Object.entries(categoryMap).forEach(([category, keywords]) => {
      if (keywords.some(keyword => lowerText.includes(keyword))) {
        categories.push(category);
      }
    });

    return categories;
  }

  private getLastWeekDate(): string {
    const date = new Date();
    date.setDate(date.getDate() - 7);
    return date.toISOString().split('T')[0];
  }
}