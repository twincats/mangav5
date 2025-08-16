import { IpcHandler, IpcModule, IpcResult } from "../types.js";
import { createSuccessResponse, createErrorResponse } from "../utils/errorHandler.js";
import { InputValidator } from "../utils/validation.js";
import { getImageList, clearZipCache } from '../../services/mangaProtocolService.js';

// Type aliases untuk brevity
type ImageListHandler = IpcHandler<[string], string[]>;
type ClearCacheHandler = IpcHandler<[], boolean>;

const chapterImageGetImageList: ImageListHandler = {
  name: "chapterImage:getImageList",
  handler: async (_, chapterPath: string): IpcResult<string[]> => {
    try {
      // Validate input
      if (!InputValidator.validateFilePath(chapterPath)) {
        return createErrorResponse("Invalid chapter path - access denied");
      }

      const result = await getImageList(chapterPath);
      return createSuccessResponse(result, "Image list retrieved successfully");
    } catch (error) {
      return createErrorResponse(error as Error, "Failed to get image list");
    }
  },
  validateInput: (chapterPath: string) => InputValidator.validateFilePath(chapterPath)
};

const chapterImageClearZipCache: ClearCacheHandler = {
  name: "chapterImage:clearZipCache",
  handler: async (): IpcResult<boolean> => {
    try {
      clearZipCache();
      return createSuccessResponse(true, "Zip cache cleared successfully");
    } catch (error) {
      return createErrorResponse(error as Error, "Failed to clear zip cache");
    }
  },
  validateInput: () => true
};

export const chapterImageHandlers: IpcModule = {
  getHandlers: () => [chapterImageGetImageList, chapterImageClearZipCache],
};
