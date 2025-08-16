import { IpcHandler, IpcModule, IpcResult } from "../types.js";
import { createSuccessResponse, createErrorResponse } from "../utils/errorHandler.js";
import { InputValidator } from "../utils/validation.js";
import { getDownloadService } from "../../modules/DownloadServiceModule.js";
import type { DownloadOptions } from "../../types/downloadTypes.js";
import { BrowserWindow } from "electron";

// Type aliases untuk brevity
type DownloadBatchHandler = IpcHandler<[string[], DownloadOptions?], any>;
type CancelHandler = IpcHandler<[], boolean>;
type StatsHandler = IpcHandler<[], any>;

/**
 * Handler for sequential batch downloads
 */
const downloadBatchSequential: DownloadBatchHandler = {
  name: "download:batch-sequential",
  handler: async (event, urls: string[], options?: DownloadOptions): IpcResult<any> => {
    try {
      // Validate input
      if (!InputValidator.validateArrayOfStrings(urls)) {
        return createErrorResponse("Invalid URLs array");
      }

      const downloadService = getDownloadService();
      // Set the main window for progress updates
      const window = BrowserWindow.fromWebContents(event.sender);
      if (window) {
        downloadService.setMainWindow(window);
      }

      const results = await downloadService.downloadBatchSequential(urls, options);
      const successCount = results.filter(r => r.success).length;
      return createSuccessResponse(results, `Downloaded ${successCount}/${results.length} files successfully`);
    } catch (error) {
      return createErrorResponse(error as Error, "Failed to download batch sequentially");
    }
  },
  validateInput: (urls: string[]) => InputValidator.validateArrayOfStrings(urls)
};

/**
 * Handler for concurrent batch downloads
 */
const downloadBatchConcurrent: DownloadBatchHandler = {
  name: "download:batch-concurrent",
  handler: async (event, urls: string[], options?: DownloadOptions): IpcResult<any> => {
    try {
      // Validate input
      if (!InputValidator.validateArrayOfStrings(urls)) {
        return createErrorResponse("Invalid URLs array");
      }

      const downloadService = getDownloadService();
      // Set the main window for progress updates
      const window = BrowserWindow.fromWebContents(event.sender);
      if (window) {
        downloadService.setMainWindow(window);
      }

      const results = await downloadService.downloadBatchConcurrent(urls, options);
      const successCount = results.filter(r => r.success).length;
      return createSuccessResponse(results, `Downloaded ${successCount}/${results.length} files successfully`);
    } catch (error) {
      return createErrorResponse(error as Error, "Failed to download batch concurrently");
    }
  },
  validateInput: (urls: string[]) => InputValidator.validateArrayOfStrings(urls)
};

/**
 * Handler to cancel all active downloads
 */
const cancelDownloads: CancelHandler = {
  name: "download:cancel-all",
  handler: async (): IpcResult<boolean> => {
    try {
      const downloadService = getDownloadService();
      downloadService.cancelAllDownloads();
      return createSuccessResponse(true, "All downloads cancelled successfully");
    } catch (error) {
      return createErrorResponse(error as Error, "Failed to cancel downloads");
    }
  },
};

/**
 * Handler to get download statistics
 */
const getDownloadStats: StatsHandler = {
  name: "download:get-stats",
  handler: async (): IpcResult<any> => {
    try {
      const downloadService = getDownloadService();
      const stats = downloadService.getDownloadStats();
      return createSuccessResponse(stats, "Download statistics retrieved successfully");
    } catch (error) {
      return createErrorResponse(error as Error, "Failed to get download statistics");
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