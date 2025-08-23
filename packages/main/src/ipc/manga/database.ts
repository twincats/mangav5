import { IpcMainInvokeEvent, app } from "electron";
import { IpcHandler, IpcModule, IpcResult } from "../types.js";
import { createSuccessResponse, createErrorResponse } from "../utils/errorHandler.js";
import {
  MangaRepository,
  MangaData,
  ChapterData,
  ScrapingRuleData,
  ConfigData,
  BatchMangaData,
  BatchInsertResult,
} from "../../schema/mangaRepository.js";
import { DatabaseManager } from "../../schema/database.js";
import { DirectoryScanner, DirectoryScanResult } from "../../services/directoryScanner.js";
import { getImageList } from "../../services/mangaProtocolService.js";
import { join } from "path";
import fs from "node:fs";

// Initialize the database and run migrations when the app starts
let mangaRepository: MangaRepository;

const initializeDatabase = async () => {
  if (!mangaRepository) {
    try {
      // Get database manager instance (will initialize if needed)
      const dbManager = DatabaseManager.getInstance();
      
      // Only initialize if not already initialized
      if (!dbManager.isReady()) {
        await dbManager.initialize();
      }

      // Create repository instance
      mangaRepository = new MangaRepository();

      // Initialize default config values if they don't exist
      await initializeDefaultConfig(mangaRepository);

      console.log("Manga repository initialized successfully");
    } catch (error) {
      console.error("Failed to initialize manga repository:", error);
      throw error;
    }
  }

  return mangaRepository;
};

// Initialize default config values
const initializeDefaultConfig = async (repo: MangaRepository) => {
  try {
    // Check if mangadirectory config exists
    const mangaDirectoryConfig = await repo.getConfig("mangadirectory");

    if (mangaDirectoryConfig.length === 0) {
      // Set default manga directory to user's Documents/Manga folder
      const documentsPath = app.getPath("documents");
      const defaultMangaDirectory = join(documentsPath, "Manga");

      await repo.setConfig({
        key: "mangadirectory",
        value: defaultMangaDirectory,
      });

      console.log(`Set default manga directory to: ${defaultMangaDirectory}`);
    }
  } catch (error) {
    console.error("Error initializing default config:", error);
  }
};

// Manga handlers
const getAllManga = async (_event: IpcMainInvokeEvent): IpcResult<any[]> => {
  try {
    const repo = await initializeDatabase();
    const result = await repo.getAllManga();
    return createSuccessResponse(result, "Manga retrieved successfully");
  } catch (error) {
    return createErrorResponse(error as Error, "Failed to retrieve manga");
  }
};

const getMangaById = async (_event: IpcMainInvokeEvent, id: number): IpcResult<any> => {
  try {
    const repo = await initializeDatabase();
    const result = await repo.getMangaById(id);
    if (!result) {
      return createErrorResponse("Manga not found");
    }
    return createSuccessResponse(result, "Manga retrieved successfully");
  } catch (error) {
    return createErrorResponse(error as Error, "Failed to retrieve manga");
  }
};

const searchMangaByTitle = async (
  _event: IpcMainInvokeEvent,
  title: string
): IpcResult<any[]> => {
  try {
    const repo = await initializeDatabase();
    const result = await repo.searchMangaByTitle(title);
    return createSuccessResponse(result, "Manga search completed");
  } catch (error) {
    return createErrorResponse(error as Error, "Failed to search manga");
  }
};

const createManga = async (
  _event: IpcMainInvokeEvent,
  mangaData: MangaData
): IpcResult<any> => {
  try {
    const repo = await initializeDatabase();
    const result = await repo.createManga(mangaData);
    return createSuccessResponse(result, "Manga created successfully");
  } catch (error) {
    return createErrorResponse(error as Error, "Failed to create manga");
  }
};

// Batch insert manga with chapters
const batchInsertManga = async (
  _event: IpcMainInvokeEvent,
  mangaList: BatchMangaData[]
): IpcResult<BatchInsertResult> => {
  try {
    const repo = await initializeDatabase();
    const result = await repo.batchInsertManga(mangaList);
    return createSuccessResponse(result, "Batch insert completed");
  } catch (error) {
    return createErrorResponse(error as Error, "Failed to batch insert manga");
  }
};

// Batch insert chapters for existing manga
const batchInsertChapters = async (
  _event: IpcMainInvokeEvent,
  mangaId: number,
  chapters: Omit<ChapterData, 'mangaId'>[]
): IpcResult<BatchInsertResult> => {
  try {
    const repo = await initializeDatabase();
    const result = await repo.batchInsertChapters(mangaId, chapters);
    return createSuccessResponse(result, "Chapters batch insert completed");
  } catch (error) {
    return createErrorResponse(error as Error, "Failed to batch insert chapters");
  }
};

// Scan directory and auto-import manga
const scanDirectoryAndImport = async (
  _event: IpcMainInvokeEvent,
  mangaDirectory: string
): IpcResult<{ scanResult: DirectoryScanResult; importResult: BatchInsertResult }> => {
  try {
    // 1. Scan directory
    const scanner = new DirectoryScanner(mangaDirectory);
    const scanResult = await scanner.scanMangaDirectory();
    
    console.log(`Scanned ${scanResult.totalManga} manga with ${scanResult.totalChapters} chapters`);
    
    // 2. Save directory to config
    const repo = await initializeDatabase();
    await repo.setConfig({
      key: "mangadirectory",
      value: mangaDirectory,
    });
    
    // 3. Auto-import manga jika ada
    let importResult: BatchInsertResult = {
      success: true,
      insertedManga: 0,
      insertedChapters: 0,
      errors: []
    };
    
    if (scanResult.mangaList.length > 0) {
      importResult = await repo.batchInsertManga(scanResult.mangaList);
      console.log(`Auto-imported ${importResult.insertedManga} manga with ${importResult.insertedChapters} chapters`);
    }
    
    const result = { scanResult, importResult };
    return createSuccessResponse(result, "Directory scan and import completed");
    
  } catch (error) {
    console.error('Error scanning directory and importing:', error);
    return createErrorResponse(error as Error, "Failed to scan directory and import");
  }
};

const updateManga = async (
  _event: IpcMainInvokeEvent,
  id: number,
  mangaData: Partial<MangaData>
): IpcResult<any> => {
  try {
    const repo = await initializeDatabase();
    const result = await repo.updateManga(id, mangaData);
    return createSuccessResponse(result, "Manga updated successfully");
  } catch (error) {
    return createErrorResponse(error as Error, "Failed to update manga");
  }
};

const deleteManga = async (_event: IpcMainInvokeEvent, id: number): IpcResult<boolean> => {
  try {
    const repo = await initializeDatabase();
    const result = await repo.deleteManga(id);
    return createSuccessResponse(result.changes > 0, "Manga deleted successfully");
  } catch (error) {
    return createErrorResponse(error as Error, "Failed to delete manga");
  }
};

// Alternative titles handlers
const getAlternativeTitles = async (
  _event: IpcMainInvokeEvent,
  mangaId: number
): IpcResult<string[]> => {
  try {
    const repo = await initializeDatabase();
    const result = await repo.getAlternativeTitles(mangaId);
    const titles = result.map(item => item.alternativeTitle);
    return createSuccessResponse(titles, "Alternative titles retrieved successfully");
  } catch (error) {
    return createErrorResponse(error as Error, "Failed to retrieve alternative titles");
  }
};

const addAlternativeTitle = async (
  _event: IpcMainInvokeEvent,
  mangaId: number,
  title: string
): IpcResult<any> => {
  try {
    const repo = await initializeDatabase();
    const result = await repo.addAlternativeTitle(mangaId, title);
    return createSuccessResponse(result, "Alternative title added successfully");
  } catch (error) {
    return createErrorResponse(error as Error, "Failed to add alternative title");
  }
};

const removeAlternativeTitle = async (
  _event: IpcMainInvokeEvent,
  altId: number
): IpcResult<boolean> => {
  try {
    const repo = await initializeDatabase();
    const result = await repo.removeAlternativeTitle(altId);
    return createSuccessResponse(result.changes > 0, "Alternative title removed successfully");
  } catch (error) {
    return createErrorResponse(error as Error, "Failed to remove alternative title");
  }
};

// Chapter handlers
const getChapters = async (_event: IpcMainInvokeEvent, mangaId: number): IpcResult<any[]> => {
  try {
    const repo = await initializeDatabase();
    const result = await repo.getChapters(mangaId);
    return createSuccessResponse(result, "Chapters retrieved successfully");
  } catch (error) {
    return createErrorResponse(error as Error, "Failed to retrieve chapters");
  }
};

const getChapterById = async (
  _event: IpcMainInvokeEvent,
  chapterId: number
): IpcResult<any> => {
  try {
    const repo = await initializeDatabase();
    const result = await repo.getChapterById(chapterId);
    if (!result) {
      return createErrorResponse("Chapter not found");
    }
    return createSuccessResponse(result, "Chapter retrieved successfully");
  } catch (error) {
    return createErrorResponse(error as Error, "Failed to retrieve chapter");
  }
};

const createChapter = async (
  _event: IpcMainInvokeEvent,
  chapterData: ChapterData
): IpcResult<any> => {
  try {
    const repo = await initializeDatabase();
    const result = await repo.createChapter(chapterData);
    return createSuccessResponse(result, "Chapter created successfully");
  } catch (error) {
    return createErrorResponse(error as Error, "Failed to create chapter");
  }
};

const updateChapter = async (
  _event: IpcMainInvokeEvent,
  chapterId: number,
  chapterData: Partial<ChapterData>
): IpcResult<any> => {
  try {
    const repo = await initializeDatabase();
    const result = await repo.updateChapter(chapterId, chapterData);
    return createSuccessResponse(result, "Chapter updated successfully");
  } catch (error) {
    return createErrorResponse(error as Error, "Failed to update chapter");
  }
};

const deleteChapter = async (_event: IpcMainInvokeEvent, chapterId: number): IpcResult<boolean> => {
  try {
    const repo = await initializeDatabase();
    const result = await repo.deleteChapter(chapterId);
    return createSuccessResponse(result.changes > 0, "Chapter deleted successfully");
  } catch (error) {
    return createErrorResponse(error as Error, "Failed to delete chapter");
  }
};

// Chapter read status handlers
const updateChapterReadStatus = async (
  _event: IpcMainInvokeEvent,
  chapterId: number,
  statusRead: boolean
): IpcResult<boolean> => {
  try {
    const repo = await initializeDatabase();
    const result = await repo.updateChapterReadStatus(chapterId, statusRead);
    return createSuccessResponse(result.changes > 0, "Chapter read status updated successfully");
  } catch (error) {
    return createErrorResponse(error as Error, "Failed to update chapter read status");
  }
};

const markChapterAsRead = async (_event: IpcMainInvokeEvent, chapterId: number): IpcResult<boolean> => {
  try {
    const repo = await initializeDatabase();
    const result = await repo.markChapterAsRead(chapterId);
    return createSuccessResponse(result.changes > 0, "Chapter marked as read successfully");
  } catch (error) {
    return createErrorResponse(error as Error, "Failed to mark chapter as read");
  }
};

const markChapterAsUnread = async (_event: IpcMainInvokeEvent, chapterId: number): IpcResult<boolean> => {
  try {
    const repo = await initializeDatabase();
    const result = await repo.markChapterAsUnread(chapterId);
    return createSuccessResponse(result.changes > 0, "Chapter marked as unread successfully");
  } catch (error) {
    return createErrorResponse(error as Error, "Failed to mark chapter as unread");
  }
};

const getChaptersByReadStatus = async (
  _event: IpcMainInvokeEvent,
  mangaId: number,
  statusRead: boolean
): IpcResult<any[]> => {
  try {
    const repo = await initializeDatabase();
    const result = await repo.getChaptersByReadStatus(mangaId, statusRead);
    return createSuccessResponse(result, "Chapters retrieved by read status successfully");
  } catch (error) {
    return createErrorResponse(error as Error, "Failed to retrieve chapters by read status");
  }
};

// Manga status handlers
const getAllStatuses = async (_event: IpcMainInvokeEvent): IpcResult<any[]> => {
  try {
    const repo = await initializeDatabase();
    const result = await repo.getAllStatuses();
    return createSuccessResponse(result, "Manga statuses retrieved successfully");
  } catch (error) {
    return createErrorResponse(error as Error, "Failed to retrieve manga statuses");
  }
};

// Scraping rules handlers
const getAllScrapingRules = async (_event: IpcMainInvokeEvent): IpcResult<any[]> => {
  try {
    const repo = await initializeDatabase();
    const result = await repo.getAllScrapingRules();
    return createSuccessResponse(result, "Scraping rules retrieved successfully");
  } catch (error) {
    return createErrorResponse(error as Error, "Failed to retrieve scraping rules");
  }
};

const getScrapingRuleById = async (
  _event: IpcMainInvokeEvent,
  ruleId: number
): IpcResult<any> => {
  try {
    const repo = await initializeDatabase();
    const result = await repo.getScrapingRuleById(ruleId);
    if (!result) {
      return createErrorResponse("Scraping rule not found");
    }
    return createSuccessResponse(result, "Scraping rule retrieved successfully");
  } catch (error) {
    return createErrorResponse(error as Error, "Failed to retrieve scraping rule");
  }
};

const createScrapingRule = async (
  _event: IpcMainInvokeEvent,
  ruleData: ScrapingRuleData
): IpcResult<any> => {
  try {
    const repo = await initializeDatabase();
    const result = await repo.createScrapingRule(ruleData);
    return createSuccessResponse(result, "Scraping rule created successfully");
  } catch (error) {
    return createErrorResponse(error as Error, "Failed to create scraping rule");
  }
};

const updateScrapingRule = async (
  _event: IpcMainInvokeEvent,
  ruleId: number,
  ruleData: Partial<ScrapingRuleData>
): IpcResult<any> => {
  try {
    const repo = await initializeDatabase();
    const result = await repo.updateScrapingRule(ruleId, ruleData);
    return createSuccessResponse(result, "Scraping rule updated successfully");
  } catch (error) {
    return createErrorResponse(error as Error, "Failed to update scraping rule");
  }
};

const deleteScrapingRule = async (
  _event: IpcMainInvokeEvent,
  ruleId: number
): IpcResult<boolean> => {
  try {
    const repo = await initializeDatabase();
    const result = await repo.deleteScrapingRule(ruleId);
    return createSuccessResponse(result.changes > 0, "Scraping rule deleted successfully");
  } catch (error) {
    return createErrorResponse(error as Error, "Failed to delete scraping rule");
  }
};

// Config handlers
const getConfig = async (_event: IpcMainInvokeEvent, key: string): IpcResult<any[]> => {
  try {
    const repo = await initializeDatabase();
    const result = await repo.getConfig(key);
    return createSuccessResponse(result, "Config retrieved successfully");
  } catch (error) {
    return createErrorResponse(error as Error, "Failed to retrieve config");
  }
};

const getAllConfig = async (_event: IpcMainInvokeEvent): IpcResult<any[]> => {
  try {
    const repo = await initializeDatabase();
    const result = await repo.getAllConfig();
    return createSuccessResponse(result, "All configs retrieved successfully");
  } catch (error) {
    return createErrorResponse(error as Error, "Failed to retrieve all configs");
  }
};

const setConfig = async (
  _event: IpcMainInvokeEvent,
  configData: ConfigData
): IpcResult<any> => {
  try {
    const repo = await initializeDatabase();
    const result = await repo.setConfig(configData);
    return createSuccessResponse(result, "Config set successfully");
  } catch (error) {
    return createErrorResponse(error as Error, "Failed to set config");
  }
};

const deleteConfig = async (_event: IpcMainInvokeEvent, key: string): IpcResult<boolean> => {
  try {
    const repo = await initializeDatabase();
    const result = await repo.deleteConfig(key);
    return createSuccessResponse(result.changes > 0, "Config deleted successfully");
  } catch (error) {
    return createErrorResponse(error as Error, "Failed to delete config");
  }
};

// Export the IPC module
// getDatabasePath is location database is stored
const getDatabasePath = async (_event?: IpcMainInvokeEvent): IpcResult<string> => {
  try {
    // Use the app's user data directory to store the database
    const userDataPath = app.getPath("userData");
    const dbPath = join(userDataPath, "manga.db");
    return createSuccessResponse(dbPath, "Database path retrieved successfully");
  } catch (error) {
    return createErrorResponse(error as Error, "Failed to get database path");
  }
};

// get
const checkDatabaseExist = async (_event: IpcMainInvokeEvent): IpcResult<boolean> => {
  try {
    const dbPath = await getDatabasePath();
    if (dbPath.success && dbPath.data) {
      const exists = fs.existsSync(dbPath.data);
      return createSuccessResponse(exists, "Database existence checked successfully");
    }
    return createErrorResponse("Failed to get database path");
  } catch (error) {
    return createErrorResponse(error as Error, "Failed to check database existence");
  }
};

// Initialize database explicitly
const initDb = async (_event: IpcMainInvokeEvent): IpcResult<{ success: boolean; message: string }> => {
  try {
    await initializeDatabase();
    return createSuccessResponse(
      { success: true, message: "Database initialized successfully" },
      "Database initialized successfully"
    );
  } catch (error) {
    console.error("Failed to initialize database:", error);
    return createErrorResponse(
      error as Error,
      "Database initialization failed"
    );
  }
};

// Get latest manga with their latest chapters
const getLatestManga = async (_event: IpcMainInvokeEvent): IpcResult<any[]> => {
  try {
    const repo = await initializeDatabase();
    const rawResult = await repo.getLatestManga();
    
    // Transform database result to flat structure
    const transformedResult = rawResult.map(item => ({
      id: item.manga_id,
      mainTitle: item.main_title,
      statusName: item.status_name,
      chapterID: item.chapter_id,
      chapterNumber: item.chapter_number,
      downloadTime: item.download_time
    }));
    
    return createSuccessResponse(transformedResult, "Latest manga retrieved successfully");
  } catch (error) {
    return createErrorResponse(error as Error, "Failed to retrieve latest manga");
  }
};

/**
 * Get manga with all its chapters and alternative titles
 * @param _event - IPC event
 * @param mangaId - ID manga yang akan diambil
 * @returns Manga dengan chapter dan alternative titles
 */
const getMangaWithChapters = async (_event: IpcMainInvokeEvent, mangaId: number): IpcResult<any> => {
  try {
    const repo = await initializeDatabase();
    const result = await repo.getMangaWithChapters(mangaId);
    
    if (!result) {
      return createErrorResponse("Manga not found");
    }

    //
    
    
    return createSuccessResponse(result, "Manga with chapters retrieved successfully");
  } catch (error) {
    return createErrorResponse(error as Error, "Failed to retrieve manga with chapters");
  }
};

const getChapterImageList = async (_event: IpcMainInvokeEvent, chapterId: number): IpcResult<any> => {
  try {
    const repo = await initializeDatabase();
    const chapter = await repo.getChapterById(chapterId);
    if (!chapter) {
      return createErrorResponse("Chapter not found");
    }
    if (chapter.mangaId === null) {
      return createErrorResponse("Chapter not found");
    }
    const manga = await repo.getMangaById(chapter.mangaId);
    if (!manga) {
      return createErrorResponse("Manga not found");
    }
    if (manga.mainTitle === null) {
      return createErrorResponse("Manga not found");
    }
    // Use the path field if available, otherwise fallback to the old format
    let chapterPath: string;
    if (chapter.path) {
      // Remove leading slash if present
      chapterPath = chapter.path.startsWith('/') ? chapter.path.slice(1) : chapter.path;
    } else {
      // Fallback to old format for backward compatibility
      chapterPath = `${manga.mainTitle}/${chapter.chapterNumber}`;
    }

    const result = await getImageList(chapterPath);
    return createSuccessResponse(result, "Chapter image list retrieved successfully");
  } catch (error) {
    return createErrorResponse(error as Error, "Failed to retrieve chapter image list");
  }
};

// Then add it to the handlers list in the mangaDatabaseHandlers object
export const mangaDatabaseHandlers: IpcModule = {
  getHandlers: () => [
    // Manga handlers
    { name: "manga:getAll", handler: getAllManga },
    { name: "manga:getById", handler: getMangaById },
    { name: "manga:getWithChapters", handler: getMangaWithChapters },
    { name: "manga:search", handler: searchMangaByTitle },
    { name: "manga:create", handler: createManga },
    { name: "manga:batchInsert", handler: batchInsertManga },
    { name: "manga:batchInsertChapters", handler: batchInsertChapters },
    { name: "manga:scanDirectoryAndImport", handler: scanDirectoryAndImport },
    { name: "manga:update", handler: updateManga },
    { name: "manga:delete", handler: deleteManga },
    { name: "manga:latest", handler: getLatestManga },
    { name: "manga:getChapterImageList", handler: getChapterImageList },

    // Alternative titles handlers
    { name: "manga:getAlternativeTitles", handler: getAlternativeTitles },
    { name: "manga:addAlternativeTitle", handler: addAlternativeTitle },
    { name: "manga:removeAlternativeTitle", handler: removeAlternativeTitle },

    // Chapter handlers
    { name: "manga:getChapters", handler: getChapters },
    { name: "manga:getChapterById", handler: getChapterById },
    { name: "manga:createChapter", handler: createChapter },
    { name: "manga:updateChapter", handler: updateChapter },
    { name: "manga:deleteChapter", handler: deleteChapter },
    { name: "manga:updateChapterReadStatus", handler: updateChapterReadStatus },
    { name: "manga:markChapterAsRead", handler: markChapterAsRead },
    { name: "manga:markChapterAsUnread", handler: markChapterAsUnread },
    { name: "manga:getChaptersByReadStatus", handler: getChaptersByReadStatus },

    // Manga status handlers
    { name: "manga:getAllStatuses", handler: getAllStatuses },

    // Scraping rules handlers
    { name: "manga:getAllScrapingRules", handler: getAllScrapingRules },
    { name: "manga:getScrapingRuleById", handler: getScrapingRuleById },
    { name: "manga:createScrapingRule", handler: createScrapingRule },
    { name: "manga:updateScrapingRule", handler: updateScrapingRule },
    { name: "manga:deleteScrapingRule", handler: deleteScrapingRule },

    // Add these new handlers
    { name: "manga:getDatabasePath", handler: getDatabasePath },
    { name: "manga:checkDatabaseExist", handler: checkDatabaseExist },
    { name: "manga:initDb", handler: initDb },

    // Config handlers
    { name: "manga:getConfig", handler: getConfig },
    { name: "manga:getAllConfig", handler: getAllConfig },
    { name: "manga:setConfig", handler: setConfig },
    { name: "manga:deleteConfig", handler: deleteConfig },
  ],
};
