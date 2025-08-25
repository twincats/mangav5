/**
 * This file contains type declarations for Electron APIs
 * commonly used in the renderer process.
 */

import type { DownloadAPI } from "@app/main/src/types/downloadTypes.js";

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

export interface MangaAPI {
  // Manga operations
  getAllManga: () => Promise<any[]>;
  getMangaById: (id: number) => Promise<any>;
  searchManga: (title: string) => Promise<any[]>;
  createManga: (mangaData: MangaData) => Promise<number>;
  batchInsertManga: (mangaList: BatchMangaData[]) => Promise<BatchInsertResult>;
  batchInsertChapters: (mangaId: number, chapters: Omit<ChapterData, 'mangaId'>[]) => Promise<BatchInsertResult>;
  scanDirectoryAndImport: (directoryPath: string) => Promise<{ scanResult: DirectoryScanResult; importResult: BatchInsertResult }>;
  updateManga: (id: number, mangaData: Partial<MangaData>) => Promise<void>;
  deleteManga: (id: number) => Promise<void>;

  // Alternative titles operations
  getAlternativeTitles: (mangaId: number) => Promise<any[]>;
  addAlternativeTitle: (mangaId: number, title: string) => Promise<void>;
  removeAlternativeTitle: (altId: number) => Promise<void>;

  // Chapter operations
  getChapters: (mangaId: number) => Promise<any[]>;
  getChapterById: (chapterId: number) => Promise<any>;
  createChapter: (chapterData: ChapterData) => Promise<void>;
  updateChapter: (
    chapterId: number,
    chapterData: Partial<ChapterData>
  ) => Promise<void>;
  deleteChapter: (chapterId: number) => Promise<void>;

  // Chapter image operations
  getChapterImageList: (chapterId: number) => Promise<string[]>;

  // Compressed file operations
  deleteFromCompressFile: (archivePath: string, filesToDelete: string[]) => Promise<boolean>;

  // Directory file operations
  deleteFileFromDirectory: (chapterPath: string, fileName: string) => Promise<boolean>;

  // Manga status operations
  getAllStatuses: () => Promise<any[]>;

  // Scraping rules operations
  getAllScrapingRules: () => Promise<any[]>;
  getScrapingRuleById: (ruleId: number) => Promise<any>;
  createScrapingRule: (ruleData: ScrapingRuleData) => Promise<void>;
  updateScrapingRule: (
    ruleId: number,
    ruleData: Partial<ScrapingRuleData>
  ) => Promise<void>;
  deleteScrapingRule: (ruleId: number) => Promise<void>;

  // Database path and initialization
  getDatabasePath: () => Promise<string>;
  checkDatabaseExist: () => Promise<boolean>;
  initDb: () => Promise<{success: boolean, message: string}>;
  
  // Config operations
  getConfig: (key: string) => Promise<any[]>;
  getAllConfig: () => Promise<any[]>;
  setConfig: (configData: ConfigData) => Promise<void>;
  deleteConfig: (key: string) => Promise<void>;
}

interface Clipboard {
  copy: (content: string) => void;
  paste: () => string;
}

declare global {
  interface Window {
    /**
     * Sha256 hash function exposed from preload script
     */
    sha256sum: (data: string) => string;

    /**
     * Node.js version information
     */
    versions: Record<string, string>;

    /**
     * General IPC send function
     */
    send: (channel: string, message: string) => Promise<any>;

    /**
     * Clipboard utilities
     */
    getClipboard: () => Clipboard;

    /**
     * Manga database API
     */
    mangaAPI: MangaAPI;

    /**
     * Download API for batch downloads with progress tracking
     */
    downloadAPI: DownloadAPI;
  }
}
