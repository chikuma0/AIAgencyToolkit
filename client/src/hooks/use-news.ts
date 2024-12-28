import { useQuery } from '@tanstack/react-query';
import type { NewsItem, NewsResponse } from '@/types';

interface UseNewsOptions {
  category?: string;
  priority?: string;
  source?: string;
}

export function useNews(options: UseNewsOptions = {}) {
  const { category, priority, source } = options;
  
  const queryParams = new URLSearchParams();
  if (category) queryParams.append('category', category);
  if (priority) queryParams.append('priority', priority);
  if (source) queryParams.append('source', source);
  
  return useQuery<NewsResponse>({
    queryKey: ['/api/news', queryParams.toString()],
    queryFn: async () => {
      const url = `/api/news${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
      const res = await fetch(url);
      if (!res.ok) {
        throw new Error('Failed to fetch news');
      }
      return res.json();
    }
  });
}

export function useNewsCategories() {
  return useQuery({
    queryKey: ['/api/news/categories'],
    queryFn: async () => {
      const res = await fetch('/api/news/categories');
      if (!res.ok) {
        throw new Error('Failed to fetch categories');
      }
      return res.json();
    }
  });
}

export function useNewsSources() {
  return useQuery({
    queryKey: ['/api/news/sources'],
    queryFn: async () => {
      const res = await fetch('/api/news/sources');
      if (!res.ok) {
        throw new Error('Failed to fetch sources');
      }
      return res.json();
    }
  });
}
