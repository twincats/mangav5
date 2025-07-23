import type { AppModule } from '../AppModule.js';
import { ModuleContext } from '../ModuleContext.js';
import { BrowserWindow } from 'electron';
import { DownloadService } from '../services/downloadService.js';

class DownloadServiceModule implements AppModule {
  private downloadService: DownloadService;

  constructor() {
    this.downloadService = new DownloadService();
  }

  async enable({ app }: ModuleContext): Promise<void> {
    // Wait for the app to be ready
    await app.whenReady();

    // Set up a listener for when windows are created
    app.on('browser-window-created', (_, window) => {
      // Set the main window for the download service
      this.downloadService.setMainWindow(window);
    });

    // If there's already a window, set it
    const existingWindows = BrowserWindow.getAllWindows();
    if (existingWindows.length > 0) {
      this.downloadService.setMainWindow(existingWindows[0]);
    }
  }

  getDownloadService(): DownloadService {
    return this.downloadService;
  }
}

// Create a singleton instance
let downloadServiceModule: DownloadServiceModule | null = null;

export function createDownloadServiceModule(): DownloadServiceModule {
  if (!downloadServiceModule) {
    downloadServiceModule = new DownloadServiceModule();
  }
  return downloadServiceModule;
}

export function getDownloadService(): DownloadService {
  if (!downloadServiceModule) {
    throw new Error('Download service module not initialized. Call createDownloadServiceModule() first.');
  }
  return downloadServiceModule.getDownloadService();
}