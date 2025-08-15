import { IpcMainInvokeEvent, app } from "electron";
import { IpcHandler, IpcModule } from "../types.js";
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
import { join } from "path";
import fs from "node:fs";

// Initialize the database and run migrations when the app starts
let dbInitialized = false;
let mangaRepository: MangaRepository;

const initializeDatabase = async () => {
  if (!dbInitialized) {
    try {
      // Initialize database connection and run migrations
      const dbManager = DatabaseManager.getInstance();
      await dbManager.initialize();

      // Create repository instance
      mangaRepository = new MangaRepository();

      // Initialize default config values if they don't exist
      await initializeDefaultConfig(mangaRepository);

      dbInitialized = true;
      console.log("Database initialized successfully");
    } catch (error) {
      console.error("Failed to initialize database:", error);
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
const getAllManga = async (_event: IpcMainInvokeEvent) => {
  const repo = await initializeDatabase();
  return repo.getAllManga();
};

const getMangaById = async (_event: IpcMainInvokeEvent, id: number) => {
  const repo = await initializeDatabase();
  return repo.getMangaById(id);
};

const searchMangaByTitle = async (
  _event: IpcMainInvokeEvent,
  title: string
) => {
  const repo = await initializeDatabase();
  return repo.searchMangaByTitle(title);
};

const createManga = async (
  _event: IpcMainInvokeEvent,
  mangaData: MangaData
) => {
  const repo = await initializeDatabase();
  return repo.createManga(mangaData);
};

// Batch insert manga with chapters
const batchInsertManga = async (
  _event: IpcMainInvokeEvent,
  mangaList: BatchMangaData[]
): Promise<BatchInsertResult> => {
  const repo = await initializeDatabase();
  return repo.batchInsertManga(mangaList);
};

// Batch insert chapters for existing manga
const batchInsertChapters = async (
  _event: IpcMainInvokeEvent,
  mangaId: number,
  chapters: Omit<ChapterData, 'mangaId'>[]
): Promise<BatchInsertResult> => {
  const repo = await initializeDatabase();
  return repo.batchInsertChapters(mangaId, chapters);
};

// Scan directory and auto-import manga
const scanDirectoryAndImport = async (
  _event: IpcMainInvokeEvent,
  mangaDirectory: string
): Promise<{ scanResult: DirectoryScanResult; importResult: BatchInsertResult }> => {
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
    
    return { scanResult, importResult };
    
  } catch (error) {
    console.error('Error scanning directory and importing:', error);
    throw error;
  }
};

const updateManga = async (
  _event: IpcMainInvokeEvent,
  id: number,
  mangaData: Partial<MangaData>
) => {
  const repo = await initializeDatabase();
  return repo.updateManga(id, mangaData);
};

const deleteManga = async (_event: IpcMainInvokeEvent, id: number) => {
  const repo = await initializeDatabase();
  return repo.deleteManga(id);
};

// Alternative titles handlers
const getAlternativeTitles = async (
  _event: IpcMainInvokeEvent,
  mangaId: number
) => {
  const repo = await initializeDatabase();
  return repo.getAlternativeTitles(mangaId);
};

const addAlternativeTitle = async (
  _event: IpcMainInvokeEvent,
  mangaId: number,
  title: string
) => {
  const repo = await initializeDatabase();
  return repo.addAlternativeTitle(mangaId, title);
};

const removeAlternativeTitle = async (
  _event: IpcMainInvokeEvent,
  altId: number
) => {
  const repo = await initializeDatabase();
  return repo.removeAlternativeTitle(altId);
};

// Chapter handlers
const getChapters = async (_event: IpcMainInvokeEvent, mangaId: number) => {
  const repo = await initializeDatabase();
  return repo.getChapters(mangaId);
};

const getChapterById = async (
  _event: IpcMainInvokeEvent,
  chapterId: number
) => {
  const repo = await initializeDatabase();
  return repo.getChapterById(chapterId);
};

const createChapter = async (
  _event: IpcMainInvokeEvent,
  chapterData: ChapterData
) => {
  const repo = await initializeDatabase();
  return repo.createChapter(chapterData);
};

const updateChapter = async (
  _event: IpcMainInvokeEvent,
  chapterId: number,
  chapterData: Partial<ChapterData>
) => {
  const repo = await initializeDatabase();
  return repo.updateChapter(chapterId, chapterData);
};

const deleteChapter = async (_event: IpcMainInvokeEvent, chapterId: number) => {
  const repo = await initializeDatabase();
  return repo.deleteChapter(chapterId);
};

// Manga status handlers
const getAllStatuses = async (_event: IpcMainInvokeEvent) => {
  const repo = await initializeDatabase();
  return repo.getAllStatuses();
};

// Scraping rules handlers
const getAllScrapingRules = async (_event: IpcMainInvokeEvent) => {
  const repo = await initializeDatabase();
  return repo.getAllScrapingRules();
};

const getScrapingRuleById = async (
  _event: IpcMainInvokeEvent,
  ruleId: number
) => {
  const repo = await initializeDatabase();
  return repo.getScrapingRuleById(ruleId);
};

const createScrapingRule = async (
  _event: IpcMainInvokeEvent,
  ruleData: ScrapingRuleData
) => {
  const repo = await initializeDatabase();
  return repo.createScrapingRule(ruleData);
};

const updateScrapingRule = async (
  _event: IpcMainInvokeEvent,
  ruleId: number,
  ruleData: Partial<ScrapingRuleData>
) => {
  const repo = await initializeDatabase();
  return repo.updateScrapingRule(ruleId, ruleData);
};

const deleteScrapingRule = async (
  _event: IpcMainInvokeEvent,
  ruleId: number
) => {
  const repo = await initializeDatabase();
  return repo.deleteScrapingRule(ruleId);
};

// Config handlers
const getConfig = async (_event: IpcMainInvokeEvent, key: string) => {
  const repo = await initializeDatabase();
  return repo.getConfig(key);
};

const getAllConfig = async (_event: IpcMainInvokeEvent) => {
  const repo = await initializeDatabase();
  return repo.getAllConfig();
};

const setConfig = async (
  _event: IpcMainInvokeEvent,
  configData: ConfigData
) => {
  const repo = await initializeDatabase();
  return repo.setConfig(configData);
};

const deleteConfig = async (_event: IpcMainInvokeEvent, key: string) => {
  const repo = await initializeDatabase();
  return repo.deleteConfig(key);
};

// Export the IPC module
// getDatabasePath is location database is stored
const getDatabasePath = async (_event?: IpcMainInvokeEvent) => {
  // Use the app's user data directory to store the database
  const userDataPath = app.getPath("userData");
  return join(userDataPath, "manga.db");
};

// get
const checkDatabaseExist = async (_event: IpcMainInvokeEvent) => {
  const dbPath = await getDatabasePath();
  return fs.existsSync(dbPath);
};

// Initialize database explicitly
const initDb = async (_event: IpcMainInvokeEvent) => {
  try {
    await initializeDatabase();
    return { success: true, message: "Database initialized successfully" };
  } catch (error) {
    console.error("Failed to initialize database:", error);
    return {
      success: false,
      message: `Database initialization failed: ${error}`,
    };
  }
};

// Get latest manga with their latest chapters
const getLatestManga = async (_event: IpcMainInvokeEvent) => {
  const repo = await initializeDatabase();
  return repo.getLatestManga();
};

// Then add it to the handlers list in the mangaDatabaseHandlers object
export const mangaDatabaseHandlers: IpcModule = {
  getHandlers: () => [
    // Manga handlers
    { name: "manga:getAll", handler: getAllManga },
    { name: "manga:getById", handler: getMangaById },
    { name: "manga:search", handler: searchMangaByTitle },
    { name: "manga:create", handler: createManga },
    { name: "manga:batchInsert", handler: batchInsertManga },
    { name: "manga:batchInsertChapters", handler: batchInsertChapters },
    { name: "manga:scanDirectoryAndImport", handler: scanDirectoryAndImport },
    { name: "manga:update", handler: updateManga },
    { name: "manga:delete", handler: deleteManga },
    { name: "manga:latest", handler: getLatestManga },

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
