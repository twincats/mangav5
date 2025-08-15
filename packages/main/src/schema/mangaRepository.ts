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

// Batch insert interfaces
export interface BatchMangaData {
  mainTitle: string;
  description?: string;
  year?: number;
  statusId?: number;
  alternativeTitles?: string[];
  chapters?: Omit<ChapterData, 'mangaId'>[];
}

export interface BatchInsertResult {
  success: boolean;
  insertedManga: number;
  insertedChapters: number;
  errors?: string[];
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

  // Batch insert manga with chapters
  async batchInsertManga(mangaList: BatchMangaData[]): Promise<BatchInsertResult> {
    const result: BatchInsertResult = {
      success: true,
      insertedManga: 0,
      insertedChapters: 0,
      errors: []
    };

    try {
      console.log(`🚀 Starting batch insert for ${mangaList.length} manga...`);
      
      // Process each manga individually to avoid transaction issues
      for (const mangaData of mangaList) {
        try {
          console.log(`📚 Inserting manga: "${mangaData.mainTitle}"`);
          
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
          result.insertedManga++;
          console.log(`✅ Manga inserted with ID: ${mangaId}`);

          // Insert alternative titles if provided
          if (mangaData.alternativeTitles && mangaData.alternativeTitles.length > 0) {
            console.log(`📝 Inserting ${mangaData.alternativeTitles.length} alternative titles`);
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

          // Insert chapters if provided
          if (mangaData.chapters && mangaData.chapters.length > 0) {
            console.log(`📖 Inserting ${mangaData.chapters.length} chapters for manga: ${mangaData.mainTitle}`);
            for (const chapterData of mangaData.chapters) {
              console.log(`  📖 Inserting chapter ${chapterData.chapterNumber}: ${chapterData.chapterTitle}`);
              this.db
                .insert(schema.chapters)
                .values({
                  mangaId,
                  chapterNumber: chapterData.chapterNumber,
                  chapterTitle: chapterData.chapterTitle,
                  volume: chapterData.volume,
                  translatorGroup: chapterData.translatorGroup,
                  releaseTime: chapterData.releaseTime,
                  language: chapterData.language,
                })
                .run();
              result.insertedChapters++;
            }
          } else {
            console.log(`⚠️ No chapters found for manga: ${mangaData.mainTitle}`);
          }
        } catch (error) {
          const errorMsg = `Error inserting manga "${mangaData.mainTitle}": ${error}`;
          result.errors?.push(errorMsg);
          console.error(errorMsg);
        }
      }

      console.log(`🎉 Batch insert completed: ${result.insertedManga} manga, ${result.insertedChapters} chapters`);
      return result;
    } catch (error) {
      result.success = false;
      result.errors?.push(`Batch insert failed: ${error}`);
      console.error('Batch insert failed:', error);
      return result;
    }
  }

  // Batch insert chapters for existing manga
  async batchInsertChapters(mangaId: number, chapters: Omit<ChapterData, 'mangaId'>[]): Promise<BatchInsertResult> {
    const result: BatchInsertResult = {
      success: true,
      insertedManga: 0,
      insertedChapters: 0,
      errors: []
    };

    try {
      // Use transaction for batch operations
      this.sqlite.transaction(() => {
        for (const chapterData of chapters) {
          try {
            this.db
              .insert(schema.chapters)
              .values({
                mangaId,
                chapterNumber: chapterData.chapterNumber,
                chapterTitle: chapterData.chapterTitle,
                volume: chapterData.volume,
                translatorGroup: chapterData.translatorGroup,
                releaseTime: chapterData.releaseTime,
                language: chapterData.language,
              })
              .run();
            result.insertedChapters++;
          } catch (error) {
            const errorMsg = `Error inserting chapter ${chapterData.chapterNumber}: ${error}`;
            result.errors?.push(errorMsg);
            console.error(errorMsg);
          }
        }
      });

      return result;
    } catch (error) {
      result.success = false;
      result.errors?.push(`Transaction failed: ${error}`);
      console.error('Batch chapter insert transaction failed:', error);
      return result;
    }
  }

  // Close the database connection
  close() {
    this.sqlite.close();
  }
}
