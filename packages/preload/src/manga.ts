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
  statusRead?: boolean;
  path?: string;
  isCompressed?: boolean;
  status?: 'valid' | 'missing' | 'corrupted';
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

// Enhanced response interface
export interface IpcResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// Manga with chapters response interface
export interface MangaWithChaptersResponse {
  manga: MangaResponse & { 
    status: { 
      statusId: number; 
      statusName: string; 
    } | null; 
  };
  chapters: ChapterResponse[];
  alternativeTitles: { 
    altId: number; 
    alternativeTitle: string; 
  }[];
  totalChapters: number;
}

// Response data types yang lebih spesifik
export interface MangaResponse extends MangaData {
  id: number;
  createdAt?: string;
  updatedAt?: string;
}

// Special interface for latest manga with chapter info (flat structure)
export interface LatestMangaResponse {
  id: number;
  mainTitle: string;
  statusName: string;
  chapterID: number;
  chapterNumber: number;
  downloadTime: string;
}

export interface ChapterResponse extends ChapterData {
  id: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface MangaStatusResponse {
  id: number;
  name: string;
  description?: string;
}

export interface ScrapingRuleResponse extends ScrapingRuleData {
  id: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface ConfigResponse {
  key: string;
  value: string;
  createdAt?: string;
  updatedAt?: string;
}

// Advanced utility functions dengan higher-order functions
const createIpcCall = <T>(channel: string, ...args: any[]): Promise<IpcResponse<T>> => {
  return ipcRenderer.invoke(channel, ...args);
};

const createErrorResponse = (error: string): IpcResponse<never> => ({
  success: false,
  error
});

// Higher-order function untuk error handling
const withErrorHandling = <T>(
  operation: () => Promise<IpcResponse<T>>,
  fallbackError: string = "Unknown error occurred"
): Promise<IpcResponse<T>> => {
  return operation().catch(error => 
    createErrorResponse(error instanceof Error ? error.message : fallbackError)
  );
};

// Validation utilities dengan better error handling
const ValidationResult = {
  success: <T>(data: T): IpcResponse<T> => ({ success: true, data }),
  error: (message: string): IpcResponse<never> => ({ success: false, error: message })
};

const validateId = (id: number, name: string): IpcResponse<never> | null => {
  return (!id || id <= 0) ? ValidationResult.error(`Invalid ${name} ID`) : null;
};

const validateString = (value: string, name: string): IpcResponse<never> | null => {
  return (!value || value.trim().length === 0) ? ValidationResult.error(`${name} cannot be empty`) : null;
};

const validateArray = (arr: any[], name: string, maxLength?: number): IpcResponse<never> | null => {
  if (!Array.isArray(arr) || arr.length === 0) {
    return ValidationResult.error(`${name} cannot be empty`);
  }
  if (maxLength && arr.length > maxLength) {
    return ValidationResult.error(`Too many ${name} (maximum ${maxLength})`);
  }
  return null;
};

// Higher-order function untuk validation + operation
const withValidation = <T>(
  validations: (() => IpcResponse<never> | null)[],
  operation: () => Promise<IpcResponse<T>>
): Promise<IpcResponse<T>> => {
  // Run all validations
  for (const validation of validations) {
    const result = validation();
    if (result) return Promise.resolve(result);
  }
  
  // If all validations pass, run operation
  return withErrorHandling(operation);
};

// Simple URL validator for preload script
const InputValidator = {
  validateUrl: (url: string): boolean => {
    try {
      const urlObj = new URL(url);
      return ['http:', 'https:'].includes(urlObj.protocol);
    } catch {
      return false;
    }
  }
};

// Enhanced manga API dengan advanced utility functions dan proper types
export const mangaAPI = {
  // Manga operations
  getAllManga: () => withErrorHandling(
    () => createIpcCall<MangaResponse[]>("manga:getAll")
  ),

  getMangaById: (id: number) => withValidation(
    [() => validateId(id, "manga")],
    () => createIpcCall<MangaResponse>("manga:getById", id)
  ),

  getMangaWithChapters: (id: number) => withValidation(
    [() => validateId(id, "manga")],
    () => createIpcCall<MangaWithChaptersResponse>("manga:getWithChapters", id)
  ),

  searchManga: (title: string) => withValidation(
    [() => validateString(title, "Search title")],
    () => createIpcCall<MangaResponse[]>("manga:search", title.trim())
  ),

  createManga: (mangaData: MangaData) => withValidation(
    [() => validateString(mangaData.mainTitle, "Manga title")],
    () => createIpcCall<MangaResponse>("manga:create", mangaData)
  ),

  updateManga: (id: number, mangaData: Partial<MangaData>) => withValidation(
    [() => validateId(id, "manga")],
    () => createIpcCall<MangaResponse>("manga:update", id, mangaData)
  ),

  deleteManga: (id: number) => withValidation(
    [() => validateId(id, "manga")],
    () => createIpcCall<boolean>("manga:delete", id)
  ),

          getLatestManga: () => withErrorHandling(
          () => createIpcCall<LatestMangaResponse[]>("manga:latest")
        ),

  // Alternative titles operations
  getAlternativeTitles: (mangaId: number) => withValidation(
    [() => validateId(mangaId, "manga")],
    () => createIpcCall<string[]>("manga:getAlternativeTitles", mangaId)
  ),

  addAlternativeTitle: (mangaId: number, title: string) => withValidation(
    [
      () => validateId(mangaId, "manga"),
      () => validateString(title, "Alternative title")
    ],
    () => createIpcCall<MangaResponse>("manga:addAlternativeTitle", mangaId, title.trim())
  ),

  removeAlternativeTitle: (altId: number) => withValidation(
    [() => validateId(altId, "alternative title")],
    () => createIpcCall<boolean>("manga:removeAlternativeTitle", altId)
  ),

  // Chapter operations
  getChapters: (mangaId: number) => withValidation(
    [() => validateId(mangaId, "manga")],
    () => createIpcCall<ChapterResponse[]>("manga:getChapters", mangaId)
  ),

  getChapterById: (chapterId: number) => withValidation(
    [() => validateId(chapterId, "chapter")],
    () => createIpcCall<ChapterResponse>("manga:getChapterById", chapterId)
  ),

  createChapter: (chapterData: ChapterData) => withValidation(
    [
      () => validateId(chapterData.mangaId, "manga"),
      () => validateId(chapterData.chapterNumber, "chapter number")
    ],
    () => createIpcCall<ChapterResponse>("manga:createChapter", chapterData)
  ),

  updateChapter: (chapterId: number, chapterData: Partial<ChapterData>) => withValidation(
    [() => validateId(chapterId, "chapter")],
    () => createIpcCall<ChapterResponse>("manga:updateChapter", chapterId, chapterData)
  ),

  deleteChapter: (chapterId: number) => withValidation(
    [() => validateId(chapterId, "chapter")],
    () => createIpcCall<boolean>("manga:deleteChapter", chapterId)
  ),

  // Chapter read status operations
  updateChapterReadStatus: (chapterId: number, statusRead: boolean) => withValidation(
    [() => validateId(chapterId, "chapter")],
    () => createIpcCall<boolean>("manga:updateChapterReadStatus", chapterId, statusRead)
  ),

  markChapterAsRead: (chapterId: number) => withValidation(
    [() => validateId(chapterId, "chapter")],
    () => createIpcCall<boolean>("manga:markChapterAsRead", chapterId)
  ),

  markChapterAsUnread: (chapterId: number) => withValidation(
    [() => validateId(chapterId, "chapter")],
    () => createIpcCall<boolean>("manga:markChapterAsUnread", chapterId)
  ),

  getChaptersByReadStatus: (mangaId: number, statusRead: boolean) => withValidation(
    [() => validateId(mangaId, "manga")],
    () => createIpcCall<ChapterResponse[]>("manga:getChaptersByReadStatus", mangaId, statusRead)
  ),

  // Manga status operations
  getAllStatuses: () => withErrorHandling(
    () => createIpcCall<MangaStatusResponse[]>("manga:getAllStatuses")
  ),

  // Scraping rules operations
  getAllScrapingRules: () => withErrorHandling(
    () => createIpcCall<ScrapingRuleResponse[]>("manga:getAllScrapingRules")
  ),

  getScrapingRuleById: (ruleId: number) => withValidation(
    [() => validateId(ruleId, "rule")],
    () => createIpcCall<ScrapingRuleResponse>("manga:getScrapingRuleById", ruleId)
  ),

  createScrapingRule: (ruleData: ScrapingRuleData) => {
    // Custom validation untuk URL
    if (!ruleData.websiteUrl || !InputValidator.validateUrl(ruleData.websiteUrl)) {
      return Promise.resolve(createErrorResponse("Invalid website URL"));
    }
    
    return withValidation(
      [() => validateString(ruleData.rulesJson, "Rules JSON")],
      () => createIpcCall<ScrapingRuleResponse>("manga:createScrapingRule", ruleData)
    );
  },

  updateScrapingRule: (ruleId: number, ruleData: Partial<ScrapingRuleData>) => {
    // Custom validation untuk URL jika ada
    if (ruleData.websiteUrl && !InputValidator.validateUrl(ruleData.websiteUrl)) {
      return Promise.resolve(createErrorResponse("Invalid website URL"));
    }
    
    return withValidation(
      [() => validateId(ruleId, "rule")],
      () => createIpcCall<ScrapingRuleResponse>("manga:updateScrapingRule", ruleId, ruleData)
    );
  },

  deleteScrapingRule: (ruleId: number) => withValidation(
    [() => validateId(ruleId, "rule")],
    () => createIpcCall<boolean>("manga:deleteScrapingRule", ruleId)
  ),

  // Database path and initialization
  getDatabasePath: () => withErrorHandling(
    () => createIpcCall<string>("manga:getDatabasePath")
  ),

  checkDatabaseExist: () => withErrorHandling(
    () => createIpcCall<boolean>("manga:checkDatabaseExist")
  ),

  initDb: () => withErrorHandling(
    () => createIpcCall<{ success: boolean; message: string }>("manga:initDb")
  ),

  // Config operations
  getConfig: (key: string) => withValidation(
    [() => validateString(key, "Config key")],
    () => createIpcCall<ConfigResponse>("manga:getConfig", key.trim())
  ),

  getAllConfig: () => withErrorHandling(
    () => createIpcCall<ConfigResponse[]>("manga:getAllConfig")
  ),

  setConfig: (configData: ConfigData) => withValidation(
    [() => validateString(configData.key, "Config key")],
    () => createIpcCall<ConfigResponse>("manga:setConfig", configData)
  ),

  deleteConfig: (key: string) => withValidation(
    [() => validateString(key, "Config key")],
    () => createIpcCall<boolean>("manga:deleteConfig", key.trim())
  ),

  // Batch insert operations
  batchInsertManga: (mangaList: BatchMangaData[]) => withValidation(
    [() => validateArray(mangaList, "manga", 1000)],
    () => createIpcCall<BatchInsertResult>("manga:batchInsert", mangaList)
  ),

  batchInsertChapters: (mangaId: number, chapters: Omit<ChapterData, 'mangaId'>[]) => withValidation(
    [
      () => validateId(mangaId, "manga"),
      () => validateArray(chapters, "chapters", 1000)
    ],
    () => createIpcCall<BatchInsertResult>("manga:batchInsertChapters", mangaId, chapters)
  ),

  // Directory scan operations
  scanDirectoryAndImport: (directoryPath: string) => withValidation(
    [() => validateString(directoryPath, "Directory path")],
    () => createIpcCall<{ scanResult: DirectoryScanResult; importResult: BatchInsertResult }>("manga:scanDirectoryAndImport", directoryPath.trim())
  ),

  // Chapter image operations
  getChapterImageList: (chapterId: number) => withValidation(
    [() => validateId(chapterId, "chapter")],
    () => createIpcCall<string[]>("manga:getChapterImageList", chapterId)
  ),
};
