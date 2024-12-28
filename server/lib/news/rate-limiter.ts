import { RateLimiter } from 'limiter';

interface RateLimiterConfig {
  tokensPerInterval: number;
  interval: number; // in milliseconds
  source: string;
}

const DEFAULT_CONFIGS: Record<string, RateLimiterConfig> = {
  'Hacker News': { tokensPerInterval: 10, interval: 1000, source: 'HackerNews' },
  'GitHub': { tokensPerInterval: 5, interval: 1000, source: 'GitHub' },
  'Dev.to': { tokensPerInterval: 3, interval: 1000, source: 'Dev.to' },
  'Product Hunt': { tokensPerInterval: 2, interval: 1000, source: 'ProductHunt' }
};

class RateLimiterManager {
  private limiters: Map<string, RateLimiter>;

  constructor() {
    this.limiters = new Map();
    
    // Initialize limiters for each source
    Object.entries(DEFAULT_CONFIGS).forEach(([source, config]) => {
      this.limiters.set(source, new RateLimiter({
        tokensPerInterval: config.tokensPerInterval,
        interval: config.interval
      }));
    });
  }

  async waitForToken(source: string): Promise<void> {
    const limiter = this.limiters.get(source);
    if (!limiter) {
      throw new Error(`No rate limiter configured for source: ${source}`);
    }

    const remainingTokens = await limiter.removeTokens(1);
    if (remainingTokens < 0) {
      throw new Error(`Rate limit exceeded for ${source}`);
    }
  }

  getLimiterConfig(source: string): RateLimiterConfig | undefined {
    return DEFAULT_CONFIGS[source];
  }

  getRemainingTokens(source: string): number {
    const limiter = this.limiters.get(source);
    return limiter ? limiter.getTokensRemaining() : 0;
  }
}

export const rateLimiterManager = new RateLimiterManager();
