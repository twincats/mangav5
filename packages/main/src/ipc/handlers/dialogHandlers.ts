import { IpcHandler, IpcModule, IpcResult } from "../types.js";
import { createSuccessResponse, createErrorResponse } from "../utils/errorHandler.js";
import { dialog } from "electron";
import type {
  OpenDialogOptions,
  SaveDialogOptions,
  OpenDialogReturnValue,
  SaveDialogReturnValue,
} from "electron";

// Type aliases untuk brevity
type OpenDialogHandler = IpcHandler<[OpenDialogOptions], OpenDialogReturnValue>;
type SaveDialogHandler = IpcHandler<[SaveDialogOptions], SaveDialogReturnValue>;

const showOpenDialog: OpenDialogHandler = {
  name: "dialog:showOpen",
  handler: async (
    _event,
    options: OpenDialogOptions
  ): IpcResult<OpenDialogReturnValue> => {
    try {
      const result = await dialog.showOpenDialog(options);
      return createSuccessResponse(result, "Open dialog shown successfully");
    } catch (error) {
      return createErrorResponse(error as Error, "Failed to show open dialog");
    }
  },
};

const showSaveDialog: SaveDialogHandler = {
  name: "dialog:showSave",
  handler: async (
    _event,
    options: SaveDialogOptions
  ): IpcResult<SaveDialogReturnValue> => {
    try {
      const result = await dialog.showSaveDialog(options);
      return createSuccessResponse(result, "Save dialog shown successfully");
    } catch (error) {
      return createErrorResponse(error as Error, "Failed to show save dialog");
    }
  },
};

export const dialogHandlers: IpcModule = {
  getHandlers: () => [showOpenDialog, showSaveDialog],
};
