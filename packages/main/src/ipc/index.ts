import { ipcMain } from "electron";
import { IpcHandler } from "./types.js";
import { fileHandlers } from "./handlers/fileHandlers.js";
import { imageHandlers } from "./handlers/imageHanlers.js";
import { scraperHandlers } from "./manga/scraper.js";
// Import other handler modules

const modules = [
  fileHandlers,
  imageHandlers,
  scraperHandlers,
  // Add other modules
];

export function registerIpcHandlers() {
  const handlers: IpcHandler[] = modules.flatMap((module) =>
    module.getHandlers()
  );

  for (const { name, handler } of handlers) {
    ipcMain.handle(name, handler);
  }
}
