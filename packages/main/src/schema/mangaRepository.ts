import { eq, like, and } from "drizzle-orm";
import { schema } from "./database.js";
import { BaseRepository } from "./repositories/BaseRepository.js";
import { sql } from "drizzle-orm";

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
  statusRead?: boolean;
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
export class MangaRepository extends BaseRepository {
  constructor() {
    super();
  }

  // Manga operations
  async getAllManga() {
    this.logOperation('getAllManga');
    return this.safeExecute(
      () => this.db.select().from(schema.manga),
      'getAllManga'
    );
  }

  async getMangaById(id: number) {
    this.logOperation('getMangaById', `ID: ${id}`);
    this.validateRequired({ id }, ['id']);
    
    return this.safeExecute(
      () => this.db
        .select()
        .from(schema.manga)
        .where(eq(schema.manga.mangaId, id)),
      'getMangaById'
    );
  }

  async searchMangaByTitle(title: string) {
    this.logOperation('searchMangaByTitle', `Title: ${title}`);
    this.validateRequired({ title }, ['title']);
    
    return this.safeExecute(
      () => this.db
        .select()
        .from(schema.manga)
        .where(like(schema.manga.mainTitle, `%${title}%`))
        .limit(50), // Prevent excessive results
      'searchMangaByTitle'
    );
  }

  async createManga(mangaData: MangaData) {
    this.logOperation('createManga', `Title: ${mangaData.mainTitle}`);
    this.validateRequired(mangaData, ['mainTitle']);

    return this.executeInTransaction(() => {
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
  }

  async updateManga(id: number, mangaData: Partial<MangaData>) {
    this.logOperation('updateManga', `ID: ${id}`);
    this.validateRequired({ id }, ['id']);

    return this.safeExecute(
      () => this.db
        .update(schema.manga)
        .set({
          ...mangaData,
          updatedAt: new Date().toISOString(),
        })
        .where(eq(schema.manga.mangaId, id))
        .run(),
      'updateManga'
    );
  }

  async deleteManga(id: number) {
    this.logOperation('deleteManga', `ID: ${id}`);
    this.validateRequired({ id }, ['id']);

    return this.executeInTransaction(() => {
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
  }

  // Alternative titles operations
  async getAlternativeTitles(mangaId: number) {
    this.logOperation('getAlternativeTitles', `Manga ID: ${mangaId}`);
    this.validateRequired({ mangaId }, ['mangaId']);
    
    return this.safeExecute(
      () => this.db
        .select()
        .from(schema.alternativeTitles)
        .where(eq(schema.alternativeTitles.mangaId, mangaId)),
      'getAlternativeTitles'
    );
  }

  async addAlternativeTitle(mangaId: number, title: string) {
    this.logOperation('addAlternativeTitle', `Manga ID: ${mangaId}, Title: ${title}`);
    this.validateRequired({ mangaId, title }, ['mangaId', 'title']);
    
    return this.safeExecute(
      () => this.db
        .insert(schema.alternativeTitles)
        .values({
          mangaId,
          alternativeTitle: title,
        })
        .run(),
      'addAlternativeTitle'
    );
  }

  async removeAlternativeTitle(altId: number) {
    this.logOperation('removeAlternativeTitle', `Alt ID: ${altId}`);
    this.validateRequired({ altId }, ['altId']);
    
    return this.safeExecute(
      () => this.db
        .delete(schema.alternativeTitles)
        .where(eq(schema.alternativeTitles.altId, altId))
        .run(),
      'removeAlternativeTitle'
    );
  }

  // Chapter operations
  async getChapters(mangaId: number) {
    this.logOperation('getChapters', `Manga ID: ${mangaId}`);
    this.validateRequired({ mangaId }, ['mangaId']);
    
    return this.safeExecute(
      () => this.db
        .select()
        .from(schema.chapters)
        .where(eq(schema.chapters.mangaId, mangaId))
        .orderBy(schema.chapters.chapterNumber),
      'getChapters'
    );
  }

  async getChapterById(chapterId: number) {
    this.logOperation('getChapterById', `Chapter ID: ${chapterId}`);
    this.validateRequired({ chapterId }, ['chapterId']);
    
    return this.safeExecute(
      () => this.db
        .select()
        .from(schema.chapters)
        .where(eq(schema.chapters.chapterId, chapterId)),
      'getChapterById'
    );
  }

  async createChapter(chapterData: ChapterData) {
    this.logOperation('createChapter', `Manga ID: ${chapterData.mangaId}, Chapter: ${chapterData.chapterNumber}`);
    this.validateRequired(chapterData, ['mangaId', 'chapterNumber']);
    
    return this.safeExecute(
      () => this.db.insert(schema.chapters).values(chapterData).run(),
      'createChapter'
    );
  }

  async updateChapter(chapterId: number, chapterData: Partial<ChapterData>) {
    this.logOperation('updateChapter', `Chapter ID: ${chapterId}`);
    this.validateRequired({ chapterId }, ['chapterId']);
    
    return this.safeExecute(
      () => this.db
        .update(schema.chapters)
        .set(chapterData)
        .where(eq(schema.chapters.chapterId, chapterId))
        .run(),
      'updateChapter'
    );
  }

  async deleteChapter(chapterId: number) {
    this.logOperation('deleteChapter', `Chapter ID: ${chapterId}`);
    this.validateRequired({ chapterId }, ['chapterId']);
    
    return this.safeExecute(
      () => this.db
        .delete(schema.chapters)
        .where(eq(schema.chapters.chapterId, chapterId))
        .run(),
      'deleteChapter'
    );
  }

  // Update chapter read status
  async updateChapterReadStatus(chapterId: number, statusRead: boolean) {
    this.logOperation('updateChapterReadStatus', `Chapter ID: ${chapterId}, Status: ${statusRead}`);
    this.validateRequired({ chapterId, statusRead }, ['chapterId', 'statusRead']);
    
    return this.safeExecute(
      () => this.db
        .update(schema.chapters)
        .set({ statusRead })
        .where(eq(schema.chapters.chapterId, chapterId))
        .run(),
      'updateChapterReadStatus'
    );
  }

  // Mark chapter as read
  async markChapterAsRead(chapterId: number) {
    return this.updateChapterReadStatus(chapterId, true);
  }

  // Mark chapter as unread
  async markChapterAsUnread(chapterId: number) {
    return this.updateChapterReadStatus(chapterId, false);
  }

  // Get chapters by read status
  async getChaptersByReadStatus(mangaId: number, statusRead: boolean) {
    this.logOperation('getChaptersByReadStatus', `Manga ID: ${mangaId}, Status: ${statusRead}`);
    this.validateRequired({ mangaId, statusRead }, ['mangaId', 'statusRead']);
    
    return this.safeExecute(
      () => this.db
        .select()
        .from(schema.chapters)
        .where(and(
          eq(schema.chapters.mangaId, mangaId),
          eq(schema.chapters.statusRead, statusRead)
        ))
        .orderBy(schema.chapters.chapterNumber),
      'getChaptersByReadStatus'
    );
  }

  // Manga status operations
  async getAllStatuses() {
    this.logOperation('getAllStatuses');
    return this.safeExecute(
      () => this.db.select().from(schema.mangaStatus),
      'getAllStatuses'
    );
  }

  // Scraping rules operations
  async getAllScrapingRules() {
    this.logOperation('getAllScrapingRules');
    return this.safeExecute(
      () => this.db.select().from(schema.scrapingRules),
      'getAllScrapingRules'
    );
  }

  async getScrapingRuleById(ruleId: number) {
    this.logOperation('getScrapingRuleById', `Rule ID: ${ruleId}`);
    this.validateRequired({ ruleId }, ['ruleId']);
    
    return this.safeExecute(
      () => this.db
        .select()
        .from(schema.scrapingRules)
        .where(eq(schema.scrapingRules.ruleId, ruleId)),
      'getScrapingRuleById'
    );
  }

  async createScrapingRule(ruleData: ScrapingRuleData) {
    this.logOperation('createScrapingRule', `URL: ${ruleData.websiteUrl}`);
    this.validateRequired(ruleData, ['websiteUrl', 'rulesJson']);
    
    return this.safeExecute(
      () => this.db.insert(schema.scrapingRules).values(ruleData).run(),
      'createScrapingRule'
    );
  }

  async updateScrapingRule(
    ruleId: number,
    ruleData: Partial<ScrapingRuleData>
  ) {
    this.logOperation('updateScrapingRule', `Rule ID: ${ruleId}`);
    this.validateRequired({ ruleId }, ['ruleId']);
    
    return this.safeExecute(
      () => this.db
        .update(schema.scrapingRules)
        .set(ruleData)
        .where(eq(schema.scrapingRules.ruleId, ruleId))
        .run(),
      'updateScrapingRule'
    );
  }

  async deleteScrapingRule(ruleId: number) {
    this.logOperation('deleteScrapingRule', `Rule ID: ${ruleId}`);
    this.validateRequired({ ruleId }, ['ruleId']);
    
    return this.safeExecute(
      () => this.db
        .delete(schema.scrapingRules)
        .where(eq(schema.scrapingRules.ruleId, ruleId))
        .run(),
      'deleteScrapingRule'
    );
  }

  // Config operations
  async getConfig(key: string) {
    this.logOperation('getConfig', `Key: ${key}`);
    this.validateRequired({ key }, ['key']);
    
    return this.safeExecute(
      () => this.db
        .select()
        .from(schema.config)
        .where(eq(schema.config.key, key)),
      'getConfig'
    );
  }

  async getAllConfig() {
    this.logOperation('getAllConfig');
    return this.safeExecute(
      () => this.db.select().from(schema.config),
      'getAllConfig'
    );
  }

  async setConfig(configData: ConfigData) {
    this.logOperation('setConfig', `Key: ${configData.key}`);
    this.validateRequired(configData, ['key', 'value']);

    return this.executeInTransaction(() => {
      // Check if the config key already exists
      const existingConfig = this.db
        .select()
        .from(schema.config)
        .where(eq(schema.config.key, configData.key))
        .all();
      
      if (existingConfig.length > 0) {
        // Update existing config
        return this.db
          .update(schema.config)
          .set({
            value: configData.value,
            updatedAt: new Date().toISOString(),
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
    });
  }

  async deleteConfig(key: string) {
    this.logOperation('deleteConfig', `Key: ${key}`);
    this.validateRequired({ key }, ['key']);
    
    return this.safeExecute(
      () => this.db
        .delete(schema.config)
        .where(eq(schema.config.key, key))
        .run(),
      'deleteConfig'
    );
  }

  // Batch insert manga with chapters
  async batchInsertManga(mangaList: BatchMangaData[]): Promise<BatchInsertResult> {
    this.logOperation('batchInsertManga', `Count: ${mangaList.length}`);
    
    if (mangaList.length === 0) {
      return {
        success: true,
        insertedManga: 0,
        insertedChapters: 0,
        errors: []
      };
    }

    const result: BatchInsertResult = {
      success: true,
      insertedManga: 0,
      insertedChapters: 0,
      errors: []
    };

    try {
      return this.executeInTransaction(() => {
        for (const mangaData of mangaList) {
          try {
            // Validate required fields
            this.validateRequired(mangaData, ['mainTitle']);
            
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

            // Insert alternative titles if provided
            if (mangaData.alternativeTitles && mangaData.alternativeTitles.length > 0) {
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
              for (const chapterData of mangaData.chapters) {
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
            }
          } catch (error) {
            const errorMsg = `Error inserting manga "${mangaData.mainTitle}": ${error}`;
            result.errors?.push(errorMsg);
            console.error(errorMsg);
          }
        }

        return result;
      });
    } catch (error) {
      result.success = false;
      result.errors?.push(`Batch insert transaction failed: ${error}`);
      console.error('Batch insert failed:', error);
      return result;
    }
  }

  // Batch insert chapters for existing manga
  async batchInsertChapters(mangaId: number, chapters: Omit<ChapterData, 'mangaId'>[]): Promise<BatchInsertResult> {
    this.logOperation('batchInsertChapters', `Manga ID: ${mangaId}, Count: ${chapters.length}`);
    this.validateRequired({ mangaId }, ['mangaId']);
    
    if (chapters.length === 0) {
      return {
        success: true,
        insertedManga: 0,
        insertedChapters: 0,
        errors: []
      };
    }

    const result: BatchInsertResult = {
      success: true,
      insertedManga: 0,
      insertedChapters: 0,
      errors: []
    };

    try {
      return this.executeInTransaction(() => {
        for (const chapterData of chapters) {
          try {
            this.validateRequired(chapterData, ['chapterNumber']);
            
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

        return result;
      });
    } catch (error) {
      result.success = false;
      result.errors?.push(`Batch chapter insert transaction failed: ${error}`);
      console.error('Batch chapter insert failed:', error);
      return result;
    }
  }

  // Get latest manga with their latest chapters
  async getLatestManga() {
    this.logOperation('getLatestManga');
    
    return this.safeExecute(
      () => this.db
        .select({
          manga_id: schema.manga.mangaId,
          main_title: schema.manga.mainTitle,
          status_name: schema.mangaStatus.statusName,
          chapter_id: schema.chapters.chapterId,
          chapter_number: schema.chapters.chapterNumber,
          download_time: schema.chapters.createdAt
        })
        .from(schema.manga)
        .innerJoin(schema.chapters, eq(schema.manga.mangaId, schema.chapters.mangaId))
        .innerJoin(schema.mangaStatus, eq(schema.manga.statusId, schema.mangaStatus.statusId))
        .where(
          sql`${schema.chapters.chapterNumber} = (
            SELECT MAX(CAST(c2.chapter_number AS decimal))
            FROM ${schema.chapters} c2
            WHERE c2.manga_id = ${schema.manga.mangaId}
          )`
        )
        .orderBy(schema.chapters.createdAt, schema.manga.mainTitle),
      'getLatestManga'
    );
  }

  /**
   * Get manga with all its chapters and alternative titles
   * @param mangaId - ID manga yang akan diambil
   * @returns Manga dengan chapter dan alternative titles
   */
  async getMangaWithChapters(mangaId: number) {
    this.logOperation('getMangaWithChapters', `Manga ID: ${mangaId}`);
    this.validateRequired({ mangaId }, ['mangaId']);
    
    return this.safeExecute(
      async () => {
        // Get manga details
        const mangaResult = await this.db
          .select({
            mangaId: schema.manga.mangaId,
            mainTitle: schema.manga.mainTitle,
            description: schema.manga.description,
            year: schema.manga.year,
            statusId: schema.manga.statusId,
            createdAt: schema.manga.createdAt,
            updatedAt: schema.manga.updatedAt
          })
          .from(schema.manga)
          .where(eq(schema.manga.mangaId, mangaId))
          .all();

        if (mangaResult.length === 0) {
          return null;
        }

        const manga = mangaResult[0];

        // Get chapters for this manga
        const chapters = await this.db
          .select({
            chapterId: schema.chapters.chapterId,
            chapterNumber: schema.chapters.chapterNumber,
            chapterTitle: schema.chapters.chapterTitle,
            volume: schema.chapters.volume,
            translatorGroup: schema.chapters.translatorGroup,
            releaseTime: schema.chapters.releaseTime,
            language: schema.chapters.language,
            statusRead: schema.chapters.statusRead,
            createdAt: schema.chapters.createdAt
          })
          .from(schema.chapters)
          .where(eq(schema.chapters.mangaId, mangaId))
          .orderBy(schema.chapters.chapterNumber)
          .all();

        // Get alternative titles
        const alternativeTitles = await this.db
          .select({
            altId: schema.alternativeTitles.altId,
            alternativeTitle: schema.alternativeTitles.alternativeTitle
          })
          .from(schema.alternativeTitles)
          .where(eq(schema.alternativeTitles.mangaId, mangaId))
          .all();

        // Get manga status
        let status = null;
        if (manga.statusId) {
          const statusResult = await this.db
            .select({
              statusId: schema.mangaStatus.statusId,
              statusName: schema.mangaStatus.statusName
            })
            .from(schema.mangaStatus)
            .where(eq(schema.mangaStatus.statusId, manga.statusId))
            .all();

          status = statusResult.length > 0 ? statusResult[0] : null;
        }

        return {
          manga: {
            ...manga,
            status
          },
          chapters,
          alternativeTitles,
          totalChapters: chapters.length
        };
      },
      'getMangaWithChapters'
    );
  }

  // Close the database connection (legacy method - not needed with DatabaseManager)
  close() {
    console.warn('close() method is deprecated. Use DatabaseManager.getInstance().close() instead.');
  }
}
