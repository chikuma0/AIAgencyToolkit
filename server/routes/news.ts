import { Router } from 'express';
import { NewsService } from '../lib/news/news-service';
import logger from '../lib/logger';
import { db } from '@db';
import { newsItems } from '@db/schema';
import { eq } from 'drizzle-orm';

const router = Router();
const newsService = new NewsService();

router.get('/api/news', async (req, res) => {
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

router.get('/api/news/categories', async (_req, res) => {
  try {
    const { data, error } = await db.select()
      .from(newsItems)
      .groupBy('content_category');
      
    if (error) throw error;
    
    const categories = data.reduce((acc: string[], item) => {
      const cats = item.content_category as string[];
      return [...new Set([...acc, ...cats])];
    }, []);
    
    res.json({ categories });
  } catch (error) {
    logger.error('Error fetching categories:', error);
    res.status(500).json({ error: 'Failed to fetch categories' });
  }
});

router.get('/api/news/sources', async (_req, res) => {
  try {
    const { data, error } = await db.select()
      .from(newsItems)
      .groupBy('source');
      
    if (error) throw error;
    
    res.json({ sources: data.map(item => item.source) });
  } catch (error) {
    logger.error('Error fetching sources:', error);
    res.status(500).json({ error: 'Failed to fetch sources' });
  }
});

router.delete('/api/news/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    await db.delete(newsItems)
      .where(eq(newsItems.id, id));
      
    res.json({ success: true });
  } catch (error) {
    logger.error('Error deleting news item:', error);
    res.status(500).json({ error: 'Failed to delete news item' });
  }
});

export default router;
