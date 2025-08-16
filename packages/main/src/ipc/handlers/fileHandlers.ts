import { IpcHandler, IpcModule, IpcResult } from "../types.js";
import { createSuccessResponse, createErrorResponse } from "../utils/errorHandler.js";
import { InputValidator } from "../utils/validation.js";
import fs from "fs/promises";

const readFile: IpcHandler<[string], string> = {
  name: "file:read",
  handler: async (_, filePath: string): IpcResult<string> => {
    // Validate input
    if (!InputValidator.validateFilePath(filePath)) {
      return createErrorResponse("Invalid file path - access denied");
    }

    try {
      const content = await fs.readFile(filePath, "utf-8");
      return createSuccessResponse(content, "File read successfully");
    } catch (error) {
      return createErrorResponse(error as Error, "Failed to read file");
    }
  },
  validateInput: (filePath: string) => InputValidator.validateFilePath(filePath)
};

const writeFile: IpcHandler<[string, string], boolean> = {
  name: "file:write",
  handler: async (_, filePath: string, content: string): IpcResult<boolean> => {
    // Validate inputs
    if (!InputValidator.validateFilePath(filePath)) {
      return createErrorResponse("Invalid file path - access denied");
    }

    if (!content || content.trim().length === 0) {
      return createErrorResponse("Content cannot be empty");
    }

    const sanitizedContent = InputValidator.sanitizeString(content);

    try {
      await fs.writeFile(filePath, sanitizedContent, "utf-8");
      return createSuccessResponse(true, "File written successfully");
    } catch (error) {
      return createErrorResponse(error as Error, "Failed to write file");
    }
  },
  validateInput: (filePath: string, content: string) => 
    InputValidator.validateFilePath(filePath) && content.trim().length > 0
};

export const fileHandlers: IpcModule = {
  getHandlers: () => [readFile, writeFile],
};
