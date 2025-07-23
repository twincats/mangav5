import { ipcMain } from "electron";
import { IpcHandler } from "./types.js";
import { fileHandlers } from "./handlers/fileHandlers.js";
import { imageHandlers } from "./handlers/imageHanlers.js";
import { scraperHandlers } from "./manga/scraper.js";
import { mangaDatabaseHandlers } from "./manga/database.js";
import { chapterImageHandlers } from "./manga/chapterImage.js";
import { dialogHandlers } from "./handlers/dialogHandlers.js";
import { downloadHandlers } from "./handlers/downloadHandlers.js";
// Import other handler modules

const modules = [
  fileHandlers,
  imageHandlers,
  scraperHandlers,
  mangaDatabaseHandlers,
  chapterImageHandlers,
  dialogHandlers,
  downloadHandlers,
  // Add other modules
];

export function registerIpcHandlers() {
  // Extract all handlers from the modules
  const handlers: IpcHandler[] = modules.flatMap((module) =>
    module.getHandlers()
  );

  // Register each handler with Electron's IPC
  for (const { name, handler } of handlers) {
    ipcMain.handle(name, handler);
  }

  console.log(`Registered ${handlers.length} IPC handlers`);
}
