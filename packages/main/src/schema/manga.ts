import { integer, sqliteTable, text } from 'drizzle-orm/sqlite-core';
import { sql } from 'drizzle-orm';

// Config table
export const config = sqliteTable('Config', {
  configId: integer('config_id', { mode: 'number' }).primaryKey({ autoIncrement: true }),
  key: text('key').notNull(),
  value: text('value').notNull(),
  createdAt: text('created_at').default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text('updated_at').default(sql`CURRENT_TIMESTAMP`),
});

// MangaStatus table
export const mangaStatus = sqliteTable('MangaStatus', {
  statusId: integer('status_id', { mode: 'number' }).primaryKey({ autoIncrement: true }),
  statusName: text('status_name').notNull(),
});

// Manga table
export const manga = sqliteTable('Manga', {
  mangaId: integer('manga_id', { mode: 'number' }).primaryKey({ autoIncrement: true }),
  mainTitle: text('main_title').notNull(),
  description: text('description'),
  year: integer('year', { mode: 'number' }),
  statusId: integer('status_id', { mode: 'number' }).references(() => mangaStatus.statusId),
  createdAt: text('created_at').default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text('updated_at').default(sql`CURRENT_TIMESTAMP`),
});

// AlternativeTitles table
export const alternativeTitles = sqliteTable('AlternativeTitles', {
  altId: integer('alt_id', { mode: 'number' }).primaryKey({ autoIncrement: true }),
  mangaId: integer('manga_id', { mode: 'number' }).references(() => manga.mangaId),
  alternativeTitle: text('alternative_title').notNull(),
  createdAt: text('created_at').default(sql`CURRENT_TIMESTAMP`),
});

// Chapters table
export const chapters = sqliteTable('Chapters', {
  chapterId: integer('chapter_id', { mode: 'number' }).primaryKey({ autoIncrement: true }),
  mangaId: integer('manga_id', { mode: 'number' }).references(() => manga.mangaId),
  chapterNumber: integer('chapter_number', { mode: 'number' }).notNull(),
  chapterTitle: text('chapter_title'),
  volume: integer('volume', { mode: 'number' }),
  translatorGroup: text('translator_group'),
  releaseTime: text('release_time'),
  language: text('language'),
  statusRead: integer('status_read', { mode: 'boolean' }).default(false),
  createdAt: text('created_at').default(sql`CURRENT_TIMESTAMP`),
});

// ScrapingRules table
export const scrapingRules = sqliteTable('ScrapingRules', {
  ruleId: integer('rule_id', { mode: 'number' }).primaryKey({ autoIncrement: true }),
  websiteUrl: text('website_url').notNull(),
  rulesJson: text('rules_json').notNull(),
  createdAt: text('created_at').default(sql`CURRENT_TIMESTAMP`),
});