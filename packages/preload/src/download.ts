import { ipcRenderer } from "electron";
import type {
  DownloadOptions,
  DownloadProgress,
  DownloadResponse,
  DownloadStatsResponse,
  DownloadAPI
} from "../../main/src/types/downloadTypes.js";

/**
 * Download API for the renderer process
 * Provides access to download functionality through IPC
 */
export const downloadAPI: DownloadAPI = {
  /**
   * Download files sequentially (one after another)
   */
  downloadBatchSequential: async (urls: string[], options?: DownloadOptions): Promise<DownloadResponse> => {
    return await ipcRenderer.invoke('download:batch-sequential', urls, options);
  },

  /**
   * Download files with concurrency control
   */
  downloadBatchConcurrent: async (urls: string[], options?: DownloadOptions): Promise<DownloadResponse> => {
    return await ipcRenderer.invoke('download:batch-concurrent', urls, options);
  },

  /**
   * Cancel all active downloads
   */
  cancelAllDownloads: async (): Promise<{ success: boolean; message?: string; error?: string }> => {
    return await ipcRenderer.invoke('download:cancel-all');
  },

  /**
   * Get download statistics
   */
  getDownloadStats: async (): Promise<DownloadStatsResponse> => {
    return await ipcRenderer.invoke('download:get-stats');
  },

  /**
   * Listen to download progress events
   */
  onDownloadProgress: (callback: (progress: DownloadProgress) => void): (() => void) => {
    const listener = (_event: any, progress: DownloadProgress) => {
      callback(progress);
    };

    ipcRenderer.on('download-progress', listener);

    // Return cleanup function
    return () => {
      ipcRenderer.removeListener('download-progress', listener);
    };
  }
};