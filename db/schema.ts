import { pgTable, text, serial, timestamp, jsonb, numeric } from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";

export const newsItems = pgTable("news_items", {
  id: text("id").primaryKey(),
  title: text("title").notNull(),
  url: text("url").notNull(),
  source: text("source").notNull(),
  published_at: timestamp("published_at").notNull(),
  priority: text("priority").notNull().default('general'),
  relevance_score: numeric("relevance_score").notNull().default('0'),
  content_category: jsonb("content_category").notNull().default([]),
  summary: text("summary"),
  score: numeric("score"),
  comments: numeric("comments"),
  by: text("by"),
  expires_at: timestamp("expires_at").notNull()
});

export const insertNewsSchema = createInsertSchema(newsItems);
export const selectNewsSchema = createSelectSchema(newsItems);
export type InsertNewsItem = typeof newsItems.$inferInsert;
export type SelectNewsItem = typeof newsItems.$inferSelect;

export const scrapeMetrics = pgTable("scrape_metrics", {
  id: serial("id").primaryKey(),
  source: text("source").notNull(),
  success_count: numeric("success_count").notNull().default('0'),
  error_count: numeric("error_count").notNull().default('0'),
  avg_duration_ms: numeric("avg_duration_ms").notNull().default('0'),
  last_scrape: timestamp("last_scrape").notNull(),
  rate_limit_hits: numeric("rate_limit_hits").notNull().default('0'),
  created_at: timestamp("created_at").notNull().defaultNow()
});
