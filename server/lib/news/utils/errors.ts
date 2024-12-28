export class ScraperError extends Error {
  source: string;
  cause?: Error;

  constructor(message: string, source: string, cause?: Error) {
    super(message);
    this.name = 'ScraperError';
    this.source = source;
    this.cause = cause;
  }
}

export class NetworkError extends ScraperError {
  constructor(source: string, cause?: Error) {
    super('Network error occurred', source, cause);
    this.name = 'NetworkError';
  }
}

export class ParseError extends ScraperError {
  constructor(source: string, cause?: Error) {
    super('Failed to parse response', source, cause);
    this.name = 'ParseError';
  }
}

export class RateLimitError extends ScraperError {
  constructor(source: string, cause?: Error) {
    super('Rate limit exceeded', source, cause);
    this.name = 'RateLimitError';
  }
}
