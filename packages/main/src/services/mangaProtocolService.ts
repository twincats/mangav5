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
import yazl from "yazl";
import os from "os";

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
   * Removes a specific ZIP file from the cache
   * Useful for clearing cache when modifying archives
   */
  removeSpecific(zipPath: string) {
    this.remove(zipPath);
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
      // console.log(fullPath); // TODO: remove this

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

/**
 * Compresses a directory of manga chapter images into a CBZ archive
 * and removes the original directory after successful compression
 *
 * @param chapterPath - The relative path to the chapter (e.g., "OnePiece/Chapter-1")
 * @returns A Promise resolving to true if compression was successful, false otherwise
 */
export async function compressChapterDirectory(
  chapterPath: string
): Promise<boolean> {
  try {
    const fullDirPath = path.join(baseMangaDir, chapterPath);

    // Check if the directory exists
    if (
      !fs.existsSync(fullDirPath) ||
      !fs.statSync(fullDirPath).isDirectory()
    ) {
      console.error(`Directory does not exist: ${fullDirPath}`);
      return false;
    }

    // Get the chapter name from the path
    const chapterName = path.basename(fullDirPath);
    const parentDir = path.dirname(fullDirPath);
    const archivePath = path.join(parentDir, `${chapterName}.cbz`);

    // Create a new ZIP file
    const zipFile = new yazl.ZipFile();

    // Get all image files in the directory
    const files = await fs.promises.readdir(fullDirPath);
    const imageFiles = files.filter(isImage);

    if (imageFiles.length === 0) {
      console.error(`No image files found in directory: ${fullDirPath}`);
      return false;
    }

    // Add each image to the ZIP file
    for (const file of imageFiles) {
      const filePath = path.join(fullDirPath, file);
      zipFile.addFile(filePath, file);
    }

    // Finalize the ZIP file
    zipFile.end();

    // Create a write stream to save the ZIP file
    const outputStream = fs.createWriteStream(archivePath);

    // Wait for the ZIP file to be written
    await new Promise<void>((resolve, reject) => {
      zipFile.outputStream.pipe(outputStream);
      outputStream.on("close", resolve);
      outputStream.on("error", reject);
    });

    console.log(`Successfully created archive: ${archivePath}`);

    // Remove the original directory and its contents
    for (const file of files) {
      await fs.promises.unlink(path.join(fullDirPath, file));
    }
    await fs.promises.rmdir(fullDirPath);

    console.log(`Successfully removed directory: ${fullDirPath}`);

    return true;
  } catch (err) {
    console.error(`Error compressing chapter directory: ${chapterPath}`, err);
    return false;
  }
}

/**
 * Deletes specific files from a compressed chapter archive (CBZ/ZIP)
 * by extracting to temporary directory, removing files, and recompressing
 *
 * @param archivePath - Path to the compressed archive (relative to base manga directory)
 * @param filesToDelete - Array of file paths to delete (e.g., ["1/3.webp", "1/4.webp"])
 * @returns Promise resolving to true if successful, false otherwise
 */
export async function deleteFromCompressFile(
  archivePath: string,
  filesToDelete: string[]
): Promise<boolean> {
  try {
    const fullArchivePath = path.join(baseMangaDir, archivePath);
    
    // Check if archive exists
    if (!fs.existsSync(fullArchivePath)) {
      console.error(`Archive does not exist: ${fullArchivePath}`);
      return false;
    }

    // Clear ZIP cache for this archive to prevent conflicts
    // This ensures the archive is not being read while we modify it
    if (zipCache.has(fullArchivePath)) {
      console.log(`Clearing ZIP cache for: ${fullArchivePath}`);
      zipCache.removeSpecific(fullArchivePath);
    }

    // Check if it's a supported archive format
    const ext = path.extname(fullArchivePath).toLowerCase();
    if (!zipExtensions.includes(ext)) {
      console.error(`Unsupported archive format: ${ext}`);
      return false;
    }

    // Create temporary directory for extraction
    const tempDir = await fs.promises.mkdtemp(path.join(os.tmpdir(), 'manga-delete-'));
    console.log(`Created temporary directory: ${tempDir}`);

    try {
      // Extract archive to temporary directory
      const zip = new StreamZip.async({ file: fullArchivePath });
      await zip.extract(null, tempDir);
      await zip.close();
      console.log(`Extracted archive to: ${tempDir}`);

      // Get list of all files in the archive
      const allFiles = await getAllFilesRecursive(tempDir);
      console.log(`Found ${allFiles.length} files in archive`);
      
      // Debug: Log all file names for troubleshooting
      console.log('Files in archive:', allFiles.map(f => path.basename(f)));
      
      // Log the files that will be deleted
      console.log('Files to delete:', filesToDelete);

      // Delete specified files
      let deletedCount = 0;
      console.log(`Attempting to delete files:`, filesToDelete);
      
      for (const fileToDelete of filesToDelete) {
        const fullFilePath = path.join(tempDir, fileToDelete);
        console.log(`Looking for file: ${fileToDelete} at path: ${fullFilePath}`);
        
        if (fs.existsSync(fullFilePath)) {
          await fs.promises.unlink(fullFilePath);
          console.log(`✅ Successfully deleted file: ${fileToDelete}`);
          deletedCount++;
        } else {
          console.warn(`❌ File not found for deletion: ${fileToDelete}`);
          console.log(`Full path checked: ${fullFilePath}`);
          
          // Debug: Check if file exists with different case or similar name
          const similarFiles = allFiles.filter(f => 
            path.basename(f).toLowerCase().includes(fileToDelete.toLowerCase()) ||
            fileToDelete.toLowerCase().includes(path.basename(f).toLowerCase())
          );
          if (similarFiles.length > 0) {
            console.log(`Similar files found:`, similarFiles.map(f => path.basename(f)));
          }
          
          // Debug: Check if file exists in subfolders
          const fileInSubfolder = allFiles.find(f => 
            f.endsWith(fileToDelete) || 
            f.endsWith(path.basename(fileToDelete))
          );
          if (fileInSubfolder) {
            console.log(`File found in subfolder: ${fileInSubfolder}`);
          }
        }
      }

      if (deletedCount === 0) {
        console.warn(`No files were deleted from the archive`);
        return false;
      }

      console.log(`Deleted ${deletedCount} files from archive`);

      // Create new archive with remaining files
      const newZipFile = new yazl.ZipFile();
      
      // Add remaining files to new archive
      // Filter out files that were deleted and only include existing files
      const existingFiles = allFiles.filter(file => {
        const relativePath = path.relative(tempDir, file);
        // Only include files that weren't deleted AND still exist on filesystem
        return !filesToDelete.includes(relativePath) && fs.existsSync(file);
      });

      console.log(`Adding ${existingFiles.length} existing files to new archive`);
      console.log(`Original files: ${allFiles.length}, Files to delete: ${filesToDelete.length}, Remaining: ${existingFiles.length}`);

      for (const file of existingFiles) {
        try {
          const relativePath = path.relative(tempDir, file);
          newZipFile.addFile(file, relativePath);
          console.log(`Added to archive: ${relativePath}`);
        } catch (fileError) {
          console.warn(`Error adding file ${file} to archive:`, fileError);
          // Continue with other files
        }
      }

      // Finalize the new ZIP file
      newZipFile.end();

      // Create backup of original archive
      const backupPath = fullArchivePath + '.backup';
      await fs.promises.copyFile(fullArchivePath, backupPath);
      console.log(`Created backup: ${backupPath}`);

      // Replace original archive with new one
      const outputStream = fs.createWriteStream(fullArchivePath);
      
      await new Promise<void>((resolve, reject) => {
        newZipFile.outputStream.pipe(outputStream);
        outputStream.on("close", resolve);
        outputStream.on("error", reject);
      });

      console.log(`Successfully updated archive: ${fullArchivePath}`);

      // Remove backup file
      await fs.promises.unlink(backupPath);
      console.log(`Removed backup file`);

      // Force refresh of ZIP cache to ensure new archive is read correctly
      console.log(`Archive updated successfully, cache will refresh on next read`);

      return true;

    } finally {
      // Clean up temporary directory
      try {
        await fs.promises.rm(tempDir, { recursive: true, force: true });
        console.log(`Cleaned up temporary directory: ${tempDir}`);
      } catch (cleanupErr) {
        console.warn(`Failed to clean up temporary directory: ${tempDir}`, cleanupErr);
      }

      // Ensure ZIP cache is cleared for this archive to prevent conflicts
      if (zipCache.has(fullArchivePath)) {
        console.log(`Final cache cleanup for: ${fullArchivePath}`);
        zipCache.removeSpecific(fullArchivePath);
      }
    }

  } catch (err) {
    console.error(`Error deleting files from compressed archive: ${archivePath}`, err);
    
    // Clear cache on error to prevent stale references
    const fullArchivePath = path.join(baseMangaDir, archivePath);
    if (zipCache.has(fullArchivePath)) {
      console.log(`Clearing ZIP cache due to error: ${fullArchivePath}`);
      zipCache.removeSpecific(fullArchivePath);
    }
    
    return false;
  }
}

/**
 * Helper function to get all files recursively from a directory
 * 
 * @param dirPath - Directory path to scan
 * @returns Array of full file paths
 */
async function getAllFilesRecursive(dirPath: string): Promise<string[]> {
  const files: string[] = [];
  
  try {
    const items = await fs.promises.readdir(dirPath, { withFileTypes: true });
    
    for (const item of items) {
      const fullPath = path.join(dirPath, item.name);
      
      if (item.isDirectory()) {
        const subFiles = await getAllFilesRecursive(fullPath);
        files.push(...subFiles);
      } else if (item.isFile()) {
        files.push(fullPath);
      }
    }
  } catch (err) {
    console.error(`Error reading directory: ${dirPath}`, err);
  }
  
  return files;
}

/**
 * Deletes a specific file from a manga chapter directory
 * 
 * @param chapterPath - Path to the chapter directory (relative to base manga directory)
 * @param fileName - Name of the file to delete
 * @returns Promise resolving to true if successful, false otherwise
 */
export async function deleteFileFromDirectory(
  chapterPath: string,
  fileName: string
): Promise<boolean> {
  try {
    const fullChapterPath = path.join(baseMangaDir, chapterPath);
    
    // Check if directory exists
    if (!fs.existsSync(fullChapterPath) || !fs.statSync(fullChapterPath).isDirectory()) {
      console.error(`Chapter directory does not exist: ${fullChapterPath}`);
      return false;
    }

    // Find the file in the directory (including subdirectories)
    const allFiles = await getAllFilesRecursive(fullChapterPath);
    const targetFile = allFiles.find(file => path.basename(file) === fileName);
    
    if (!targetFile) {
      console.error(`File ${fileName} not found in chapter directory: ${fullChapterPath}`);
      return false;
    }

    // Delete the file
    await fs.promises.unlink(targetFile);
    console.log(`Successfully deleted file: ${fileName} from ${fullChapterPath}`);
    
    return true;
  } catch (err) {
    console.error(`Error deleting file ${fileName} from directory: ${chapterPath}`, err);
    return false;
  }
}
