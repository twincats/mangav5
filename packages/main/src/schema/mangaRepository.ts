import { eq, like } from "drizzle-orm";
import { initializeDatabase, schema } from "./index.js";

// Types for our repository functions
export interface ConfigData {
  key: string;
  value: string;
}

export interface MangaData {
  mainTitle: string;
  description?: string;
  year?: number;
  statusId?: number;
  alternativeTitles?: string[];
}

export interface ChapterData {
  mangaId: number;
  chapterNumber: number;
  chapterTitle?: string;
  volume?: number;
  translatorGroup?: string;
  releaseTime?: string;
  language?: string;
}

export interface ScrapingRuleData {
  websiteUrl: string;
  rulesJson: string;
}

// MangaRepository class to handle database operations
export class MangaRepository {
  private db;
  private sqlite;

  constructor() {
    const dbConnection = initializeDatabase();
    this.db = dbConnection.db;
    this.sqlite = dbConnection.sqlite;
  }

  // Manga operations
  async getAllManga() {
    return this.db.select().from(schema.manga);
  }

  async getMangaById(id: number) {
    return this.db
      .select()
      .from(schema.manga)
      .where(eq(schema.manga.mangaId, id));
  }

  async searchMangaByTitle(title: string) {
    return this.db
      .select()
      .from(schema.manga)
      .where(like(schema.manga.mainTitle, `%${title}%`));
  }

  async createManga(mangaData: MangaData) {
    // Start a transaction
    const mangaId = this.sqlite.transaction((tx) => {
      // Insert manga
      const mangaResult = this.db
        .insert(schema.manga)
        .values({
          mainTitle: mangaData.mainTitle,
          description: mangaData.description,
          year: mangaData.year,
          statusId: mangaData.statusId,
        })
        .run();

      const mangaId = mangaResult.lastInsertRowid as number;

      // Insert alternative titles if provided
      if (
        mangaData.alternativeTitles &&
        mangaData.alternativeTitles.length > 0
      ) {
        for (const title of mangaData.alternativeTitles) {
          this.db
            .insert(schema.alternativeTitles)
            .values({
              mangaId,
              alternativeTitle: title,
            })
            .run();
        }
      }

      return mangaId;
    });

    return mangaId as unknown as number;
  }

  async updateManga(id: number, mangaData: Partial<MangaData>) {
    return this.db
      .update(schema.manga)
      .set({
        ...mangaData,
        updatedAt: "CURRENT_TIMESTAMP",
      })
      .where(eq(schema.manga.mangaId, id))
      .run();
  }

  async deleteManga(id: number) {
    // Start a transaction to delete manga and related data
    this.sqlite.transaction((tx) => {
      // Delete alternative titles
      this.db
        .delete(schema.alternativeTitles)
        .where(eq(schema.alternativeTitles.mangaId, id))
        .run();

      // Delete chapters
      this.db
        .delete(schema.chapters)
        .where(eq(schema.chapters.mangaId, id))
        .run();

      // Delete manga
      return this.db
        .delete(schema.manga)
        .where(eq(schema.manga.mangaId, id))
        .run();
    });

    // Return void as expected by the API type
    return;
  }

  // Alternative titles operations
  async getAlternativeTitles(mangaId: number) {
    return this.db
      .select()
      .from(schema.alternativeTitles)
      .where(eq(schema.alternativeTitles.mangaId, mangaId));
  }

  async addAlternativeTitle(mangaId: number, title: string) {
    return this.db
      .insert(schema.alternativeTitles)
      .values({
        mangaId,
        alternativeTitle: title,
      })
      .run();
  }

  async removeAlternativeTitle(altId: number) {
    return this.db
      .delete(schema.alternativeTitles)
      .where(eq(schema.alternativeTitles.altId, altId))
      .run();
  }

  // Chapter operations
  async getChapters(mangaId: number) {
    return this.db
      .select()
      .from(schema.chapters)
      .where(eq(schema.chapters.mangaId, mangaId));
  }

  async getChapterById(chapterId: number) {
    return this.db
      .select()
      .from(schema.chapters)
      .where(eq(schema.chapters.chapterId, chapterId));
  }

  async createChapter(chapterData: ChapterData) {
    return this.db.insert(schema.chapters).values(chapterData).run();
  }

  async updateChapter(chapterId: number, chapterData: Partial<ChapterData>) {
    return this.db
      .update(schema.chapters)
      .set(chapterData)
      .where(eq(schema.chapters.chapterId, chapterId))
      .run();
  }

  async deleteChapter(chapterId: number) {
    return this.db
      .delete(schema.chapters)
      .where(eq(schema.chapters.chapterId, chapterId))
      .run();
  }

  // Manga status operations
  async getAllStatuses() {
    return this.db.select().from(schema.mangaStatus);
  }

  // Scraping rules operations
  async getAllScrapingRules() {
    return this.db.select().from(schema.scrapingRules);
  }

  async getScrapingRuleById(ruleId: number) {
    return this.db
      .select()
      .from(schema.scrapingRules)
      .where(eq(schema.scrapingRules.ruleId, ruleId));
  }

  async createScrapingRule(ruleData: ScrapingRuleData) {
    return this.db.insert(schema.scrapingRules).values(ruleData).run();
  }

  async updateScrapingRule(
    ruleId: number,
    ruleData: Partial<ScrapingRuleData>
  ) {
    return this.db
      .update(schema.scrapingRules)
      .set(ruleData)
      .where(eq(schema.scrapingRules.ruleId, ruleId))
      .run();
  }

  async deleteScrapingRule(ruleId: number) {
    return this.db
      .delete(schema.scrapingRules)
      .where(eq(schema.scrapingRules.ruleId, ruleId))
      .run();
  }

  // Config operations
  async getConfig(key: string) {
    return this.db
      .select()
      .from(schema.config)
      .where(eq(schema.config.key, key));
  }

  async getAllConfig() {
    return this.db.select().from(schema.config);
  }

  async setConfig(configData: ConfigData) {
    // Check if the config key already exists
    const existingConfig = await this.getConfig(configData.key);
    
    if (existingConfig.length > 0) {
      // Update existing config
      return this.db
        .update(schema.config)
        .set({
          value: configData.value,
          updatedAt: "CURRENT_TIMESTAMP",
        })
        .where(eq(schema.config.key, configData.key))
        .run();
    } else {
      // Insert new config
      return this.db
        .insert(schema.config)
        .values({
          key: configData.key,
          value: configData.value,
        })
        .run();
    }
  }

  async deleteConfig(key: string) {
    return this.db
      .delete(schema.config)
      .where(eq(schema.config.key, key))
      .run();
  }

  // Close the database connection
  close() {
    this.sqlite.close();
  }
}
