/**
 * Type definitions for the Download Service
 * These types are shared between main and renderer processes
 */

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

export interface DownloadResponse {
  success: boolean;
  results?: DownloadResult[];
  message?: string;
  error?: string;
}

export interface DownloadStatsResponse {
  success: boolean;
  stats?: {
    activeDownloads: number;
  };
  error?: string;
}

/**
 * IPC API for download functionality
 */
export interface DownloadAPI {
  /**
   * Download files sequentially (one after another)
   */
  downloadBatchSequential: (urls: string[], options?: DownloadOptions) => Promise<DownloadResponse>;
  
  /**
   * Download files with concurrency control
   */
  downloadBatchConcurrent: (urls: string[], options?: DownloadOptions) => Promise<DownloadResponse>;
  
  /**
   * Cancel all active downloads
   */
  cancelAllDownloads: () => Promise<{ success: boolean; message?: string; error?: string }>;
  
  /**
   * Get download statistics
   */
  getDownloadStats: () => Promise<DownloadStatsResponse>;
  
  /**
   * Listen to download progress events
   */
  onDownloadProgress: (callback: (progress: DownloadProgress) => void) => () => void;
}