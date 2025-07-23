/**
 * Download Service
 *
 * This service provides comprehensive download functionality including:
 * - Sequential batch downloads
 * - Concurrent downloads with control
 * - Retry logic with exponential backoff
 * - Progress reporting via IPC
 */

import got from 'got';
import fs from 'fs';
import path from 'path';
import { pipeline } from 'stream/promises';
import { BrowserWindow } from 'electron';

export interface DownloadItem {
  url: string;
  outputPath: string;
  filename?: string;
}

export interface DownloadProgress {
  index: number;
  total: number;
  filename: string;
  url: string;
  transferred: number;
  totalSize?: number;
  percent: number;
  status: 'downloading' | 'completed' | 'failed' | 'retrying';
  error?: string;
}

export interface DownloadOptions {
  maxConcurrency?: number;
  retryLimit?: number;
  timeout?: number;
  retryDelay?: number;
  outputDirectory?: string;
}

export interface DownloadResult {
  success: boolean;
  url: string;
  filename: string;
  outputPath: string;
  error?: string;
  retryCount?: number;
}

export class DownloadService {
  private mainWindow: BrowserWindow | null = null;
  private activeDownloads = new Map<string, boolean>();

  constructor(mainWindow?: BrowserWindow) {
    this.mainWindow = mainWindow || null;
  }

  /**
   * Set the main window for IPC communication
   */
  setMainWindow(window: BrowserWindow) {
    this.mainWindow = window;
  }

  /**
   * Emit progress update via IPC
   */
  private emitProgress(progress: DownloadProgress) {
    if (this.mainWindow && !this.mainWindow.isDestroyed()) {
      this.mainWindow.webContents.send('download-progress', progress);
    }
  }

  /**
   * Download files sequentially (one after another)
   */
  async downloadBatchSequential(
    urls: string[],
    options: DownloadOptions = {}
  ): Promise<DownloadResult[]> {
    const {
      retryLimit = 3,
      timeout = 30000,
      retryDelay = 1000,
      outputDirectory = './downloads'
    } = options;

    // Ensure output directory exists
    if (!fs.existsSync(outputDirectory)) {
      fs.mkdirSync(outputDirectory, { recursive: true });
    }

    const results: DownloadResult[] = [];
    const total = urls.length;

    for (let index = 0; index < urls.length; index++) {
      const url = urls[index];
      const filename = this.extractFilename(url, index);
      const outputPath = path.join(outputDirectory, filename);

      const downloadItem: DownloadItem = { url, outputPath, filename };
      
      this.emitProgress({
        index: index + 1,
        total,
        filename,
        url,
        transferred: 0,
        percent: 0,
        status: 'downloading'
      });

      const result = await this.downloadSingleWithRetry(
        downloadItem,
        { retryLimit, timeout, retryDelay },
        index + 1,
        total
      );

      results.push(result);

      // Emit completion status
      this.emitProgress({
        index: index + 1,
        total,
        filename,
        url,
        transferred: result.success ? 100 : 0,
        percent: result.success ? 100 : 0,
        status: result.success ? 'completed' : 'failed',
        error: result.error
      });
    }

    return results;
  }

  /**
   * Download files with concurrency control
   */
  async downloadBatchConcurrent(
    urls: string[],
    options: DownloadOptions = {}
  ): Promise<DownloadResult[]> {
    const {
      maxConcurrency = 3,
      retryLimit = 3,
      timeout = 30000,
      retryDelay = 1000,
      outputDirectory = './downloads'
    } = options;

    // Ensure output directory exists
    if (!fs.existsSync(outputDirectory)) {
      fs.mkdirSync(outputDirectory, { recursive: true });
    }

    const total = urls.length;
    const results: DownloadResult[] = [];

    // Process downloads in batches with concurrency control
    for (let i = 0; i < urls.length; i += maxConcurrency) {
      const batch = urls.slice(i, i + maxConcurrency);
      const batchPromises = batch.map(async (url, batchIndex) => {
        const globalIndex = i + batchIndex;
        const filename = this.extractFilename(url, globalIndex);
        const outputPath = path.join(outputDirectory, filename);
        const downloadItem: DownloadItem = { url, outputPath, filename };

        this.emitProgress({
          index: globalIndex + 1,
          total,
          filename,
          url,
          transferred: 0,
          percent: 0,
          status: 'downloading'
        });

        const result = await this.downloadSingleWithRetry(
          downloadItem,
          { retryLimit, timeout, retryDelay },
          globalIndex + 1,
          total
        );

        // Emit completion status
        this.emitProgress({
          index: globalIndex + 1,
          total,
          filename,
          url,
          transferred: result.success ? 100 : 0,
          percent: result.success ? 100 : 0,
          status: result.success ? 'completed' : 'failed',
          error: result.error
        });

        return result;
      });

      const batchResults = await Promise.all(batchPromises);
      results.push(...batchResults);
    }

    return results;
  }

  /**
   * Download a single file with retry logic
   */
  private async downloadSingleWithRetry(
    item: DownloadItem,
    options: { retryLimit: number; timeout: number; retryDelay: number },
    index: number,
    total: number
  ): Promise<DownloadResult> {
    const { retryLimit, timeout, retryDelay } = options;
    let lastError: Error | null = null;

    for (let attempt = 0; attempt <= retryLimit; attempt++) {
      try {
        if (attempt > 0) {
          // Emit retry status
          this.emitProgress({
            index,
            total,
            filename: item.filename!,
            url: item.url,
            transferred: 0,
            percent: 0,
            status: 'retrying'
          });

          // Wait before retry with exponential backoff
          const delay = retryDelay * Math.pow(2, attempt - 1);
          await new Promise(resolve => setTimeout(resolve, delay));
        }

        await this.downloadSingle(item, index, total, timeout);
        
        return {
          success: true,
          url: item.url,
          filename: item.filename!,
          outputPath: item.outputPath,
          retryCount: attempt
        };
      } catch (error) {
        lastError = error as Error;
        console.error(`Download attempt ${attempt + 1} failed for ${item.url}:`, error);
      }
    }

    return {
      success: false,
      url: item.url,
      filename: item.filename!,
      outputPath: item.outputPath,
      error: lastError?.message || 'Unknown error',
      retryCount: retryLimit
    };
  }

  /**
   * Download a single file
   */
  private async downloadSingle(
    item: DownloadItem,
    index: number,
    total: number,
    timeout: number
  ): Promise<void> {
    const downloadStream = got.stream(item.url, {
      timeout: {
        request: timeout
      }
    });

    const fileWriter = fs.createWriteStream(item.outputPath);

    // Track download progress
    downloadStream.on('downloadProgress', ({ transferred, total: totalSize, percent }) => {
      this.emitProgress({
        index,
        total,
        filename: item.filename!,
        url: item.url,
        transferred,
        totalSize,
        percent: Math.round(percent * 100),
        status: 'downloading'
      });
    });

    try {
      await pipeline(downloadStream, fileWriter);
    } catch (error) {
      // Clean up partial file on error
      try {
        if (fs.existsSync(item.outputPath)) {
          fs.unlinkSync(item.outputPath);
        }
      } catch (cleanupError) {
        console.error('Error cleaning up partial file:', cleanupError);
      }
      throw error;
    }
  }

  /**
   * Extract filename from URL or generate one
   */
  private extractFilename(url: string, index: number): string {
    try {
      const urlObj = new URL(url);
      const pathname = urlObj.pathname;
      const filename = path.basename(pathname);
      
      if (filename && filename !== '/') {
        return filename;
      }
    } catch (error) {
      console.warn('Error parsing URL:', error);
    }
    
    // Fallback to generated filename
    return `download-${index + 1}`;
  }

  /**
   * Cancel all active downloads
   */
  cancelAllDownloads(): void {
    this.activeDownloads.clear();
  }

  /**
   * Get download statistics
   */
  getDownloadStats(): { activeDownloads: number } {
    return {
      activeDownloads: this.activeDownloads.size
    };
  }
}

// Export singleton instance
export const downloadService = new DownloadService();