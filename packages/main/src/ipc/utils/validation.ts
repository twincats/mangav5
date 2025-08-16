import path from 'path';
import { app } from 'electron';

export class InputValidator {
  static validateFilePath(filePath: string): boolean {
    // Prevent path traversal
    const normalizedPath = path.normalize(filePath);
    const userDataPath = app.getPath('userData');
    const documentsPath = app.getPath('documents');
    
    return normalizedPath.startsWith(userDataPath) || 
           normalizedPath.startsWith(documentsPath);
  }

  static validateUrl(url: string): boolean {
    try {
      const urlObj = new URL(url);
      // Only allow HTTP/HTTPS
      return ['http:', 'https:'].includes(urlObj.protocol);
    } catch {
      return false;
    }
  }

  static sanitizeString(input: string): string {
    // Remove potentially dangerous characters
    return input.replace(/[<>\"'&]/g, '');
  }

  static validateMangaTitle(title: string): boolean {
    // Basic validation for manga title
    return Boolean(title) && title.trim().length > 0 && title.trim().length <= 500;
  }

  static validateChapterNumber(chapterNumber: number): boolean {
    // Chapter number should be positive
    return chapterNumber > 0 && chapterNumber <= 9999;
  }

  static validateArrayOfStrings(arr: any[]): boolean {
    return Array.isArray(arr) && arr.every(item => typeof item === 'string' && item.trim().length > 0);
  }
}
