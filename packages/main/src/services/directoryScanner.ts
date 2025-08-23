import { readdir, stat } from 'fs/promises';
import { statSync } from 'fs';
import { join, basename, extname } from 'path';
import { BatchMangaData } from '../schema/mangaRepository.js';

export interface DirectoryScanResult {
  mangaList: BatchMangaData[];
  totalManga: number;
  totalChapters: number;
}

export class DirectoryScanner {
  private mangaDirectory: string;

  constructor(mangaDirectory: string) {
    this.mangaDirectory = mangaDirectory;
  }

  /**
   * Scan directory manga dan extract informasi manga + chapter
   */
  async scanMangaDirectory(): Promise<DirectoryScanResult> {
    try {
      console.log(`🔍 Scanning manga directory: ${this.mangaDirectory}`);
      
      const mangaList: BatchMangaData[] = [];
      let totalChapters = 0;

      // Scan subdirectories (manga titles)
      const mangaDirs = await this.getMangaDirectories();
      console.log(`📁 Found ${mangaDirs.length} manga directories:`, mangaDirs.map(dir => basename(dir)));
      
      for (const mangaDir of mangaDirs) {
        const mangaData = await this.scanMangaFolder(mangaDir);
        if (mangaData) {
          console.log(`✅ Adding manga to list: "${mangaData.mainTitle}" with ${mangaData.chapters?.length || 0} chapters`);
          mangaList.push(mangaData);
          totalChapters += mangaData.chapters?.length || 0;
        } else {
          console.log(`❌ Skipping manga directory (no valid data): ${basename(mangaDir)}`);
        }
      }

      console.log(`📊 Final scan result: ${mangaList.length} manga, ${totalChapters} total chapters`);
      console.log(`📋 Manga list:`, mangaList.map(m => ({ title: m.mainTitle, chapters: m.chapters?.length || 0 })));

      return {
        mangaList,
        totalManga: mangaList.length,
        totalChapters
      };
    } catch (error) {
      console.error('Error scanning manga directory:', error);
      throw error;
    }
  }

  /**
   * Get list of manga directories
   */
  private async getMangaDirectories(): Promise<string[]> {
    try {
      const items = await readdir(this.mangaDirectory);
      const mangaDirs: string[] = [];

      for (const item of items) {
        const fullPath = join(this.mangaDirectory, item);
        const stats = await stat(fullPath);
        
        if (stats.isDirectory()) {
          mangaDirs.push(fullPath);
        }
      }

      return mangaDirs;
    } catch (error) {
      console.error('Error reading manga directories:', error);
      return [];
    }
  }

  /**
   * Scan individual manga folder untuk extract chapter info
   */
  private async scanMangaFolder(mangaPath: string): Promise<BatchMangaData | null> {
    try {
      const mangaName = basename(mangaPath);
      console.log(`Scanning manga: ${mangaName}`);

      // Get chapter files
      const chapterFiles = await this.getChapterFiles(mangaPath);
      
      if (chapterFiles.length === 0) {
        console.log(`No chapter files found for ${mangaName}`);
        return null;
      }

      // Extract manga info
      const mangaData: BatchMangaData = {
        mainTitle: mangaName,
        description: `Manga: ${mangaName}`,
        year: new Date().getFullYear(),
        statusId: 1, // Ongoing (default)
        alternativeTitles: [],
        chapters: []
      };

      // Process chapter files
      for (const chapterFile of chapterFiles) {
        const chapterData = this.extractChapterInfo(chapterFile, mangaName);
        if (chapterData) {
          mangaData.chapters!.push(chapterData);
        }
      }

      // Sort chapters by number
      if (mangaData.chapters) {
        mangaData.chapters.sort((a, b) => a.chapterNumber - b.chapterNumber);
      }

      console.log(`Found ${mangaData.chapters?.length || 0} chapters for ${mangaName}`);
      return mangaData;

    } catch (error) {
      console.error(`Error scanning manga folder ${mangaPath}:`, error);
      return null;
    }
  }

  /**
   * Get chapter files from manga directory
   */
  private async getChapterFiles(mangaPath: string): Promise<string[]> {
    try {
      const items = await readdir(mangaPath);
      const chapterFiles: string[] = [];
      
      console.log(`📂 Scanning folder "${basename(mangaPath)}" for chapter files...`);
      console.log(`📋 Found items:`, items);

      for (const item of items) {
        const fullPath = join(mangaPath, item);
        const stats = await stat(fullPath);
        
        if (stats.isFile()) {
          const ext = extname(item).toLowerCase();
          console.log(`  📄 File: "${item}" (${ext})`);
          if (ext === '.cbz' || ext === '.zip') {
            chapterFiles.push(fullPath);
            console.log(`    ✅ Added as chapter file`);
          } else {
            console.log(`    ❌ Not a chapter file (${ext})`);
          }
        } else if (stats.isDirectory()) {
          console.log(`  📁 Subfolder: "${item}" (scanning for chapter content)`);
          // Scan subfolder untuk chapter
          const subfolderChapters = await this.scanSubfolderForChapters(fullPath, item);
          chapterFiles.push(...subfolderChapters);
        }
      }

      console.log(`📊 Total chapter files found: ${chapterFiles.length}`);
      return chapterFiles;
    } catch (error) {
      console.error('Error reading chapter files:', error);
      return [];
    }
  }

  /**
   * Scan subfolder untuk chapter content (folder dengan gambar atau file)
   */
  private async scanSubfolderForChapters(subfolderPath: string, subfolderName: string): Promise<string[]> {
    try {
      console.log(`    🔍 Scanning subfolder: "${subfolderName}"`);
      
      // Try to extract chapter number from subfolder name
      const chapterNumber = this.extractChapterNumber(subfolderName);
      if (chapterNumber === null) {
        console.log(`    ❌ Could not extract chapter number from subfolder name: "${subfolderName}"`);
        return [];
      }

      console.log(`    ✅ Extracted chapter number: ${chapterNumber} from subfolder: "${subfolderName}"`);
      
      // Check if subfolder contains image files or other content
      const subItems = await readdir(subfolderPath);
      let hasContent = false;
      
      for (const item of subItems) {
        const fullPath = join(subfolderPath, item);
        const stats = await stat(fullPath);
        
        if (stats.isFile()) {
          const ext = extname(item).toLowerCase();
          // Check for image files, text files, or any content
          if (['.jpg', '.jpeg', '.png', '.webp', '.gif', '.bmp', '.txt', '.nfo'].includes(ext)) {
            hasContent = true;
            console.log(`      📄 Found content file: "${item}" (${ext})`);
            break;
          }
        }
      }

      if (hasContent) {
        // Return the subfolder path as a "virtual chapter file"
        // We'll handle this specially in extractChapterInfo
        console.log(`    ✅ Subfolder "${subfolderName}" contains chapter content`);
        return [subfolderPath]; // Return folder path instead of file path
      } else {
        console.log(`    ❌ Subfolder "${subfolderName}" has no content`);
        return [];
      }
    } catch (error) {
      console.error(`Error scanning subfolder ${subfolderPath}:`, error);
      return [];
    }
  }

  /**
   * Extract chapter information from filename or folder name
   */
  private extractChapterInfo(filePath: string, mangaName: string) {
    try {
      const stats = statSync(filePath);
      const isDirectory = stats.isDirectory();
      
      if (isDirectory) {
        // Handle folder path (subfolder chapter)
        const folderName = basename(filePath);
        console.log(`🔍 Processing folder name: "${folderName}" for manga: ${mangaName}`);
        
        // Try to extract chapter number from folder name
        const chapterNumber = this.extractChapterNumber(folderName);
        
        if (chapterNumber === null) {
          console.log(`❌ Could not extract chapter number from folder: "${folderName}"`);
          return null;
        }

        console.log(`✅ Extracted chapter number: ${chapterNumber} from folder: "${folderName}"`);
        
        // Generate path: /{mangaTitle}/{chapterNumber}/
        const path = `/${mangaName}/${chapterNumber}/`;
        
        return {
          chapterNumber,
          chapterTitle: `Chapter ${chapterNumber}`,
          volume: Math.ceil(chapterNumber / 10), // Estimate volume
          translatorGroup: 'Unknown',
          releaseTime: new Date().toISOString().split('T')[0], // Today's date
          language: 'English',
          path: path,
          isCompressed: false, // Folder is not compressed
          status: 'valid' as const
        };
      } else {
        // Handle file path (compressed chapter)
        const fileName = basename(filePath, extname(filePath));
        const fileExt = extname(filePath).toLowerCase();
        console.log(`🔍 Processing filename: "${fileName}" for manga: ${mangaName}`);
        
        // Try to extract chapter number from filename
        const chapterNumber = this.extractChapterNumber(fileName);
        
        if (chapterNumber === null) {
          console.log(`❌ Could not extract chapter number from: "${fileName}"`);
          return null;
        }

        console.log(`✅ Extracted chapter number: ${chapterNumber} from filename: "${fileName}"`);
        
        // Generate path: /{mangaTitle}/{chapterNumber}
        const path = `/${mangaName}/${chapterNumber}`;
        
        // Check if file is compressed
        const isCompressed = ['.zip', '.cbz'].includes(fileExt);
        
        return {
          chapterNumber,
          chapterTitle: `Chapter ${chapterNumber}`,
          volume: Math.ceil(chapterNumber / 10), // Estimate volume
          translatorGroup: 'Unknown',
          releaseTime: new Date().toISOString().split('T')[0], // Today's date
          language: 'English',
          path: path,
          isCompressed: isCompressed,
          status: 'valid' as const
        };
      }
    } catch (error) {
      console.error('Error extracting chapter info:', error);
      return null;
    }
  }

  /**
   * Extract chapter number from filename
   * Supports various formats: "001", "1", "Chapter 1", "1.5", etc.
   */
  private extractChapterNumber(fileName: string): number | null {
    try {
      // Remove common prefixes/suffixes
      let cleanName = fileName
        .replace(/chapter\s*/i, '')
        .replace(/episode\s*/i, '')
        .replace(/vol\s*\d*\s*/i, '')
        .replace(/volume\s*\d*\s*/i, '')
        .trim();

      // Try to find number patterns
      const patterns = [
        /^(\d+(?:\.\d+)?)$/,           // "1", "1.5", "001"
        /^(\d+(?:\.\d+)?)\s*[-_].*$/,  // "1 - Title", "1_Title"
        /^.*[-_]\s*(\d+(?:\.\d+)?)$/,  // "Title - 1", "Title_1"
        /^.*\s+(\d+(?:\.\d+)?)\s*$/,   // "Title 1 "
      ];

      for (const pattern of patterns) {
        const match = cleanName.match(pattern);
        if (match) {
          const number = parseFloat(match[1]);
          if (!isNaN(number) && number > 0) {
            return number;
          }
        }
      }

      return null;
    } catch (error) {
      console.error('Error extracting chapter number:', error);
      return null;
    }
  }
}
