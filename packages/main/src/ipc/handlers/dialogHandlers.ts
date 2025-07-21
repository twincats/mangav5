import { IpcHandler, IpcModule } from "../types.js";
import { dialog } from "electron";
import type {
  OpenDialogOptions,
  SaveDialogOptions,
  OpenDialogReturnValue,
  SaveDialogReturnValue,
} from "electron";

const showOpenDialog: IpcHandler = {
  name: "dialog:showOpen",
  handler: async (
    _event,
    options: OpenDialogOptions
  ): Promise<OpenDialogReturnValue> => {
    try {
      return await dialog.showOpenDialog(options);
    } catch (error) {
      console.error("Error showing open dialog:", error);
      throw error;
    }
  },
};

const showSaveDialog: IpcHandler = {
  name: "dialog:showSave",
  handler: async (
    _event,
    options: SaveDialogOptions
  ): Promise<SaveDialogReturnValue> => {
    try {
      return await dialog.showSaveDialog(options);
    } catch (error) {
      console.error("Error showing save dialog:", error);
      throw error;
    }
  },
};

export const dialogHandlers: IpcModule = {
  getHandlers: () => [showOpenDialog, showSaveDialog],
};
