import { ipcMain } from "electron";
import { IpcHandler, IpcModule, IpcResult } from "./types.js";
import { createErrorResponse } from "./utils/errorHandler.js";
import { globalRateLimiter } from "./utils/rateLimiter.js";
import { IpcLogger } from "./utils/logger.js";
import { fileHandlers } from "./handlers/fileHandlers.js";
import { imageHandlers } from "./handlers/imageHanlers.js";
import { scraperHandlers } from "./manga/scraper.js";
import { mangaDatabaseHandlers } from "./manga/database.js";
import { chapterImageHandlers } from "./manga/chapterImage.js";
import { dialogHandlers } from "./handlers/dialogHandlers.js";
import { downloadHandlers } from "./handlers/downloadHandlers.js";

const modules = [
  fileHandlers,
  imageHandlers,
  scraperHandlers,
  mangaDatabaseHandlers,
  chapterImageHandlers,
  dialogHandlers,
  downloadHandlers,
];

// Enhanced handler wrapper with rate limiting and logging
function createEnhancedHandler(originalHandler: IpcHandler): IpcHandler {
  return {
    ...originalHandler,
    handler: async (event, ...args) => {
      const startTime = Date.now();
      
      try {
        // Log request
        IpcLogger.logRequest(originalHandler.name, args);
        
        // Check rate limit
        if (!globalRateLimiter.isAllowed(originalHandler.name)) {
          const status = globalRateLimiter.getStatus(originalHandler.name);
          IpcLogger.logRateLimit(originalHandler.name, status);
          return createErrorResponse("Rate limit exceeded. Please try again later.");
        }
        
        // Validate input if validator exists
        if (originalHandler.validateInput && !originalHandler.validateInput(...args)) {
          return createErrorResponse("Invalid input parameters");
        }
        
        // Execute original handler
        const result = await originalHandler.handler(event, ...args);
        
        // Log success
        const duration = Date.now() - startTime;
        IpcLogger.logSuccess(originalHandler.name, duration, args);
        
        return result;
        
      } catch (error) {
        // Log error
        IpcLogger.logError(originalHandler.name, error as Error, args);
        
        // Return error response
        return createErrorResponse(error as Error, `Handler ${originalHandler.name} failed`);
      }
    }
  };
}

export function registerIpcHandlers() {
  // Extract all handlers from the modules
  const handlers: IpcHandler[] = modules.flatMap((module) =>
    module.getHandlers()
  );

  // Register each enhanced handler with Electron's IPC
  for (const handler of handlers) {
    const enhancedHandler = createEnhancedHandler(handler);
    ipcMain.handle(enhancedHandler.name, enhancedHandler.handler);
  }

  console.log(`Registered ${handlers.length} enhanced IPC handlers with rate limiting and logging`);
}
