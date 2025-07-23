import { IpcHandler, IpcModule } from "../types.js";
import { getDownloadService } from "../../modules/DownloadServiceModule.js";
import type { DownloadOptions } from "../../types/downloadTypes.js";
import { BrowserWindow } from "electron";

/**
 * Handler for sequential batch downloads
 */
const downloadBatchSequential: IpcHandler = {
  name: "download:batch-sequential",
  handler: async (event, urls: string[], options?: DownloadOptions) => {
    try {
      const downloadService = getDownloadService();
      // Set the main window for progress updates
      const window = BrowserWindow.fromWebContents(event.sender);
      if (window) {
        downloadService.setMainWindow(window);
      }

      const results = await downloadService.downloadBatchSequential(urls, options);
      return {
        success: true,
        results,
        message: `Downloaded ${results.filter(r => r.success).length}/${results.length} files successfully`
      };
    } catch (error) {
      console.error("Error in batch sequential download:", error);
      return {
        success: false,
        error: (error as Error).message || "Unknown error occurred",
        results: []
      };
    }
  },
};

/**
 * Handler for concurrent batch downloads
 */
const downloadBatchConcurrent: IpcHandler = {
  name: "download:batch-concurrent",
  handler: async (event, urls: string[], options?: DownloadOptions) => {
    try {
      const downloadService = getDownloadService();
      // Set the main window for progress updates
      const window = BrowserWindow.fromWebContents(event.sender);
      if (window) {
        downloadService.setMainWindow(window);
      }

      const results = await downloadService.downloadBatchConcurrent(urls, options);
      return {
        success: true,
        results,
        message: `Downloaded ${results.filter(r => r.success).length}/${results.length} files successfully`
      };
    } catch (error) {
      console.error("Error in batch concurrent download:", error);
      return {
        success: false,
        error: (error as Error).message || "Unknown error occurred",
        results: []
      };
    }
  },
};

/**
 * Handler to cancel all active downloads
 */
const cancelDownloads: IpcHandler = {
  name: "download:cancel-all",
  handler: async () => {
    try {
      const downloadService = getDownloadService();
      downloadService.cancelAllDownloads();
      return {
        success: true,
        message: "All downloads cancelled successfully"
      };
    } catch (error) {
      console.error("Error cancelling downloads:", error);
      return {
        success: false,
        error: (error as Error).message || "Unknown error occurred"
      };
    }
  },
};

/**
 * Handler to get download statistics
 */
const getDownloadStats: IpcHandler = {
  name: "download:get-stats",
  handler: async () => {
    try {
      const downloadService = getDownloadService();
      const stats = downloadService.getDownloadStats();
      return {
        success: true,
        stats
      };
    } catch (error) {
      console.error("Error getting download stats:", error);
      return {
        success: false,
        error: (error as Error).message || "Unknown error occurred",
        stats: { activeDownloads: 0 }
      };
    }
  },
};

export const downloadHandlers: IpcModule = {
  getHandlers: () => [
    downloadBatchSequential,
    downloadBatchConcurrent,
    cancelDownloads,
    getDownloadStats
  ],
};