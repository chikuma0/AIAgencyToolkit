import axios from 'axios';
import type { NewsItem } from '../../../../client/src/types';
import { NewsScraper, type ScraperOptions } from './base-scraper';

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
  private aiKeywords = [
    'ai-business',
    'business-automation',
    'enterprise-ai',
    'ai-saas',
    'llm-business',
    'ai-workflow',
    'machine-learning-business',
    'ai-enterprise',
    'business-intelligence-ai'
  ];

  constructor(options?: ScraperOptions) {
    super('GitHub', { limit: 10, ...options });
  }

  protected async fetchNewsInternal(): Promise<NewsItem[]> {
    try {
      const date = this.getLastWeekDate();
      const queries = this.aiKeywords.map(keyword =>
        axios.get(`${this.baseUrl}/search/repositories`, {
          params: {
            q: `${keyword} in:topics created:>=${date} stars:>100`,
            sort: 'stars',
            order: 'desc',
            per_page: Math.floor(this.options.limit! / this.aiKeywords.length)
          },
          headers: {
            'Accept': 'application/vnd.github.v3+json',
            ...(process.env.GITHUB_TOKEN && {
              'Authorization': `token ${process.env.GITHUB_TOKEN}`
            })
          }
        })
      );

      const responses = await Promise.allSettled(queries);
      const items: GitHubRepo[] = [];

      responses.forEach(response => {
        if (response.status === 'fulfilled') {
          const newItems = response.value.data.items;
          items.push(...newItems.filter(repo => this.isAIBusinessRelated(repo)));
        }
      });

      return this.parseContent(items);
    } catch (error) {
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

  private isAIBusinessRelated(repo: GitHubRepo): boolean {
    const text = `${repo.name} ${repo.description || ''} ${repo.topics.join(' ')}`.toLowerCase();
    const aiTerms = ['ai', 'artificial intelligence', 'machine learning', 'llm', 'gpt'];
    const businessTerms = ['business', 'enterprise', 'saas', 'workflow', 'automation'];

    const hasAITerm = aiTerms.some(term => text.includes(term));
    const hasBusinessTerm = businessTerms.some(term => text.includes(term));
    const isPopular = repo.stargazers_count > 50;

    return (hasAITerm && hasBusinessTerm) || (hasAITerm && isPopular);
  }

  private getLastWeekDate(): string {
    const date = new Date();
    date.setDate(date.getDate() - 7);
    return date.toISOString().split('T')[0];
  }
}