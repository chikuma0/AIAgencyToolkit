import type { Express } from "express";
import { createServer, type Server } from "http";
import { db } from "@db";
import { newsItems } from "@db/schema";
import { NewsService } from "./lib/news/news-service";
import logger from "./lib/logger";

export function registerRoutes(app: Express): Server {
  const newsService = new NewsService();

  // Get news with optional filters
  app.get('/api/news', async (req, res) => {
    try {
      const { category, priority, source } = req.query;

      const filters = {
        ...(category && { category: category as string }),
        ...(priority && { priority: priority as string }),
        ...(source && { source: source as string })
      };

      const news = await newsService.getNews(filters);
      res.json(news);
    } catch (error) {
      logger.error('Error fetching news:', error);
      res.status(500).json({ error: 'Failed to fetch news' });
    }
  });

  // Get all available news categories
  app.get('/api/news/categories', async (_req, res) => {
    try {
      const result = await db.select()
        .from(newsItems)
        .groupBy('content_category');

      const categories = result.reduce((acc: string[], item) => {
        const cats = item.content_category as string[];
        return [...new Set([...acc, ...cats])];
      }, []);

      res.json({ categories });
    } catch (error) {
      logger.error('Error fetching categories:', error);
      res.status(500).json({ error: 'Failed to fetch categories' });
    }
  });

  // Get all news sources
  app.get('/api/news/sources', async (_req, res) => {
    try {
      const result = await db.select()
        .from(newsItems)
        .groupBy('source');

      res.json({ sources: result.map(item => item.source) });
    } catch (error) {
      logger.error('Error fetching sources:', error);
      res.status(500).json({ error: 'Failed to fetch sources' });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}