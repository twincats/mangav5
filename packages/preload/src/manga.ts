import { ipcRenderer } from "electron";

// Import types from renderer's electron.d.ts
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

// Directory scan interfaces
export interface DirectoryScanResult {
  mangaList: BatchMangaData[];
  totalManga: number;
  totalChapters: number;
}

// Manga database API
export const mangaAPI = {
  // Manga operations
  getAllManga: () => ipcRenderer.invoke("manga:getAll"),
  getMangaById: (id: number) => ipcRenderer.invoke("manga:getById", id),
  searchManga: (title: string) => ipcRenderer.invoke("manga:search", title),
  createManga: (mangaData: MangaData) =>
    ipcRenderer.invoke("manga:create", mangaData),
  updateManga: (id: number, mangaData: Partial<MangaData>) =>
    ipcRenderer.invoke("manga:update", id, mangaData),
  deleteManga: (id: number) => ipcRenderer.invoke("manga:delete", id),

  // Alternative titles operations
  getAlternativeTitles: (mangaId: number) =>
    ipcRenderer.invoke("manga:getAlternativeTitles", mangaId),
  addAlternativeTitle: (mangaId: number, title: string) =>
    ipcRenderer.invoke("manga:addAlternativeTitle", mangaId, title),
  removeAlternativeTitle: (altId: number) =>
    ipcRenderer.invoke("manga:removeAlternativeTitle", altId),

  // Chapter operations
  getChapters: (mangaId: number) =>
    ipcRenderer.invoke("manga:getChapters", mangaId),
  getChapterById: (chapterId: number) =>
    ipcRenderer.invoke("manga:getChapterById", chapterId),
  createChapter: (chapterData: ChapterData) =>
    ipcRenderer.invoke("manga:createChapter", chapterData),
  updateChapter: (chapterId: number, chapterData: Partial<ChapterData>) =>
    ipcRenderer.invoke("manga:updateChapter", chapterId, chapterData),
  deleteChapter: (chapterId: number) =>
    ipcRenderer.invoke("manga:deleteChapter", chapterId),

  // Manga status operations
  getAllStatuses: () => ipcRenderer.invoke("manga:getAllStatuses"),

  // Scraping rules operations
  getAllScrapingRules: () => ipcRenderer.invoke("manga:getAllScrapingRules"),
  getScrapingRuleById: (ruleId: number) =>
    ipcRenderer.invoke("manga:getScrapingRuleById", ruleId),
  createScrapingRule: (ruleData: ScrapingRuleData) =>
    ipcRenderer.invoke("manga:createScrapingRule", ruleData),
  updateScrapingRule: (ruleId: number, ruleData: Partial<ScrapingRuleData>) =>
    ipcRenderer.invoke("manga:updateScrapingRule", ruleId, ruleData),
  deleteScrapingRule: (ruleId: number) =>
    ipcRenderer.invoke("manga:deleteScrapingRule", ruleId),

  // Database path and initialization
  getDatabasePath: () => ipcRenderer.invoke("manga:getDatabasePath"),
  checkDatabaseExist: () => ipcRenderer.invoke("manga:checkDatabaseExist"),
  initDb: () => ipcRenderer.invoke("manga:initDb"),

  // Config operations
  getConfig: (key: string) => ipcRenderer.invoke("manga:getConfig", key),
  getAllConfig: () => ipcRenderer.invoke("manga:getAllConfig"),
  setConfig: (configData: ConfigData) =>
    ipcRenderer.invoke("manga:setConfig", configData),
  deleteConfig: (key: string) => ipcRenderer.invoke("manga:deleteConfig", key),

  // Batch insert operations
  batchInsertManga: (mangaList: BatchMangaData[]) =>
    ipcRenderer.invoke("manga:batchInsert", mangaList),
  batchInsertChapters: (mangaId: number, chapters: Omit<ChapterData, 'mangaId'>[]) =>
    ipcRenderer.invoke("manga:batchInsertChapters", mangaId, chapters),

  // Directory scan operations
  scanDirectoryAndImport: (directoryPath: string) =>
    ipcRenderer.invoke("manga:scanDirectoryAndImport", directoryPath),
};
