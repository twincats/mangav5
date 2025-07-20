/**
 * Manga Protocol Service
 * 
 * This service implements a custom Electron protocol handler for manga content,
 * allowing the application to access manga images from both directories and ZIP/CBZ archives
 * using a unified manga:// protocol.
 */

import { protocol } from "electron";
import path from "path";
import fs from "fs";
import mime from "mime";
import StreamZip from "node-stream-zip";
import { app } from "electron";

/** Base directory where all manga content is stored */
const baseMangaDir = "D:/Tools/Manga";

/** Supported archive extensions for manga chapters */
const zipExtensions = [".cbz", ".zip"];

/**
 * Enhanced ZIP cache with LRU functionality and automatic cleanup
 */
class ZipCache {
  private cache = new Map<
    string,
    { zip: StreamZip.StreamZipAsync; lastAccessed: number }
  >();
  private maxSize: number;
  private cleanupInterval: NodeJS.Timeout;
  private maxAgeMs: number;

  constructor(
    maxSize = 50,
    cleanupIntervalMs = 5 * 60 * 1000,
    maxAgeMs = 30 * 60 * 1000
  ) {
    this.maxSize = maxSize;
    this.maxAgeMs = maxAgeMs;
    this.cleanupInterval = setInterval(() => this.cleanup(), cleanupIntervalMs);

    // Ensure cleanup on app quit
    app.on("will-quit", () => this.clear());
  }

  /**
   * Retrieves a ZIP handler from the cache or creates a new one
   * 
   * @param zipPath - Path to the ZIP file
   * @returns Promise resolving to the ZIP handler
   */
  async get(zipPath: string): Promise<StreamZip.StreamZipAsync> {
    const cached = this.cache.get(zipPath);
    if (cached) {
      cached.lastAccessed = Date.now();
      return cached.zip;
    }

    if (this.cache.size >= this.maxSize) {
      this.evictOldest();
    }

    try {
      const zip = new StreamZip.async({ file: zipPath });
      this.cache.set(zipPath, { zip, lastAccessed: Date.now() });
      return zip;
    } catch (err) {
      console.error(`Error opening ZIP file: ${zipPath}`, err);
      throw err;
    }
  }

  /**
   * Checks if a ZIP file is already in the cache
   * 
   * @param zipPath - Path to the ZIP file
   * @returns True if the ZIP file is in the cache, false otherwise
   */
  has(zipPath: string): boolean {
    return this.cache.has(zipPath);
  }

  /**
   * Removes the least recently used ZIP file from the cache
   * Called when the cache reaches its maximum size
   */
  private evictOldest() {
    let oldestPath: string | null = null;
    let oldestTime = Infinity;

    for (const [path, { lastAccessed }] of this.cache.entries()) {
      if (lastAccessed < oldestTime) {
        oldestTime = lastAccessed;
        oldestPath = path;
      }
    }

    if (oldestPath) {
      this.remove(oldestPath);
    }
  }

  /**
   * Removes a ZIP file from the cache and closes the handler
   * 
   * @param zipPath - Path to the ZIP file to remove
   */
  private remove(zipPath: string) {
    const cached = this.cache.get(zipPath);
    if (cached) {
      cached.zip
        .close()
        .catch((err) => console.error(`Error closing ZIP: ${zipPath}`, err));
      this.cache.delete(zipPath);
    }
  }

  /**
   * Performs periodic cleanup of unused ZIP handlers
   * Removes ZIP files that haven't been accessed for longer than maxAgeMs
   */
  private cleanup() {
    const now = Date.now();
    for (const [path, { lastAccessed }] of this.cache.entries()) {
      if (now - lastAccessed > this.maxAgeMs) {
        this.remove(path);
      }
    }
  }

  /**
   * Clears the entire cache and closes all ZIP handlers
   * Called when the application is shutting down
   */
  clear() {
    for (const [path] of this.cache.entries()) {
      this.remove(path);
    }
    clearInterval(this.cleanupInterval);
  }

  /**
   * Gets the current number of ZIP files in the cache
   * 
   * @returns The number of cached ZIP files
   */
  get size(): number {
    return this.cache.size;
  }
}

/** Global ZIP cache instance with default settings */
const zipCache = new ZipCache();

/**
 * Determines if a file is an image based on its extension
 * 
 * @param filename - The filename to check
 * @returns True if the file has a supported image extension, false otherwise
 */
function isImage(filename: string): boolean {
  return [".jpg", ".jpeg", ".png", ".webp", ".gif"].includes(
    path.extname(filename).toLowerCase()
  );
}

/**
 * Retrieves a ZIP handler for the specified path, using the cache when possible
 * 
 * @param zipPath - The path to the ZIP file
 * @returns A Promise resolving to the StreamZipAsync instance
 * @throws If the ZIP file cannot be opened or accessed
 */
async function getZip(zipPath: string): Promise<StreamZip.StreamZipAsync> {
  try {
    return await zipCache.get(zipPath);
  } catch (err) {
    console.error(`Failed to get ZIP file: ${zipPath}`, err);
    throw err;
  }
}

/**
 * Registers the custom manga:// protocol handler with Electron
 * 
 * The protocol format is: manga://manga-title/chapter-path/image-name
 * - hostname: manga title (folder name in baseMangaDir)
 * - pathname: chapter path and image name
 */
export function registerMangaProtocol() {
  protocol.handle("manga", async (request) => {
    try {
      const url = new URL(request.url);
      const host = decodeURIComponent(url.hostname); // manga title
      const chapterPath = decodeURIComponent(url.pathname).slice(1); // remove leading "/"
      const fullPath = path.join(baseMangaDir, host, chapterPath);
      console.log(fullPath);

      // 1. Serve from actual file (folder)
      if (fs.existsSync(fullPath)) {
        const data = await fs.promises.readFile(fullPath);
        const mimeType = mime.getType(fullPath) || "application/octet-stream";
        return new Response(data, {
          headers: { "Content-Type": mimeType },
        });
      }

      // 2. Serve from CBZ (ZIP)
      const dirPath = path.dirname(fullPath); // e.g. OnePiece/Chapter-1
      const imageName = path.basename(fullPath); // e.g. 001.webp

      let zipPath: string | undefined;

      for (const ext of zipExtensions) {
        const possiblePath = dirPath + ext;
        if (fs.existsSync(possiblePath)) {
          zipPath = possiblePath;
          break;
        }
      }

      if (zipPath) {
        const zip = await getZip(zipPath);
        const entries = await zip.entries();

        const matchKey = Object.keys(entries).find((e) =>
          e.endsWith(imageName)
        );
        if (matchKey) {
          const buffer = await zip.entryData(matchKey);
          const mimeType =
            mime.getType(imageName) || "application/octet-stream";
          return new Response(buffer, {
            headers: { "Content-Type": mimeType },
          });
        }
      }

      return new Response("Not Found", { status: 404 });
    } catch (err) {
      console.error("manga protocol error", err);
      return new Response("Internal Server Error", { status: 500 });
    }
  });
}

/**
 * Retrieves a list of image files for a specific manga chapter
 * 
 * @param chapterPath - The relative path to the chapter (e.g., "OnePiece/Chapter-1")
 * @returns A Promise resolving to an array of image paths, or empty array if no images found
 */
export async function getImageList(chapterPath: string): Promise<string[]> {
  const fullDirPath = path.join(baseMangaDir, chapterPath);

  // 1. Try real directory
  if (fs.existsSync(fullDirPath) && fs.statSync(fullDirPath).isDirectory()) {
    const files = await fs.promises.readdir(fullDirPath);
    return files
      .filter(isImage)
      .sort()
      .map((f) => path.join(chapterPath, f));
  }

  // 2. try chapter ZIP
  const chapterDir = path.join(baseMangaDir, chapterPath);
  for (const ext of zipExtensions) {
    const zipPath = chapterDir + ext;
    if (fs.existsSync(zipPath)) {
      const zip = await getZip(zipPath);
      const entries = await zip.entries();
      return Object.keys(entries)
        .filter((e) => isImage(e) && !entries[e].isDirectory)
        .sort()
        .map((e) => path.posix.join(chapterPath, path.basename(e)));
    }
  }

  return [];
}

/**
 * Clears the ZIP cache and properly closes all open ZIP files
 */
export function clearZipCache() {
  zipCache.clear();
}

/**
 * Returns statistics about the ZIP cache
 */
export function getZipCacheStats() {
  return {
    size: zipCache.size,
  };
}
