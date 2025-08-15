// Contoh penggunaan directory scanner dan auto-import
import type { DirectoryScanResult } from '../types/electron';

// Contoh struktur directory yang diharapkan:
// D:/manga/
// ├── one piece/
// │   ├── 001.cbz
// │   ├── 002.cbz
// │   └── 003.cbz
// ├── naruto/
// │   ├── 001.cbz
// │   └── 002.cbz
// └── dragon ball/
//     └── 001.cbz

// Contoh penggunaan scan directory
export async function exampleScanDirectory() {
  try {
    console.log('🚀 Starting directory scan...');
    
    // Pilih directory manga (contoh: D:/manga)
    const mangaDirectory = 'D:/manga'; // Ganti dengan path yang sesuai
    
    console.log(`📁 Scanning directory: ${mangaDirectory}`);
    
    // Scan dan import otomatis
    const result = await window.mangaAPI.scanDirectoryAndImport(mangaDirectory);
    
    console.log('✅ Scan completed!');
    console.log(`📚 Manga found: ${result.scanResult.totalManga}`);
    console.log(`📖 Chapters found: ${result.scanResult.totalChapters}`);
    console.log(`💾 Imported: ${result.importResult.insertedManga} manga`);
    console.log(`📥 Imported: ${result.importResult.insertedChapters} chapters`);
    
    // Tampilkan detail manga yang ditemukan
    if (result.scanResult.mangaList.length > 0) {
      console.log('\n📋 Manga Details:');
      result.scanResult.mangaList.forEach((manga, index) => {
        console.log(`${index + 1}. ${manga.mainTitle}`);
        console.log(`   📖 Chapters: ${manga.chapters?.length || 0}`);
        if (manga.chapters && manga.chapters.length > 0) {
          console.log(`   📚 Sample chapters: ${manga.chapters.slice(0, 3).map(c => c.chapterNumber).join(', ')}`);
        }
        console.log('');
      });
    }
    
    return result;
    
  } catch (error) {
    console.error('❌ Error scanning directory:', error);
    throw error;
  }
}

// Contoh scan directory tanpa import (hanya untuk preview)
export async function exampleScanDirectoryOnly(directoryPath: string): Promise<DirectoryScanResult | null> {
  try {
    console.log(`🔍 Scanning directory: ${directoryPath}`);
    
    // Note: Ini hanya contoh, karena scanDirectoryAndImport selalu melakukan import
    // Untuk implementasi yang lebih fleksibel, bisa ditambahkan parameter untuk skip import
    
    const result = await window.mangaAPI.scanDirectoryAndImport(directoryPath);
    
    console.log(`📊 Scan preview: ${result.scanResult.totalManga} manga, ${result.scanResult.totalChapters} chapters`);
    
    return result.scanResult;
    
  } catch (error) {
    console.error('❌ Error scanning directory:', error);
    return null;
  }
}

// Contoh validasi directory sebelum scan
export function validateMangaDirectory(directoryPath: string): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  if (!directoryPath || directoryPath.trim() === '') {
    errors.push('Directory path tidak boleh kosong');
    return { valid: false, errors };
  }
  
  // Check if directory exists (basic validation)
  if (!directoryPath.includes('/') && !directoryPath.includes('\\')) {
    errors.push('Directory path tidak valid');
  }
  
  // Check if it's a root directory (optional safety check)
  if (directoryPath.length <= 3) {
    errors.push('Directory terlalu pendek, pastikan path lengkap');
  }
  
  return {
    valid: errors.length === 0,
    errors
  };
}

// Contoh penggunaan dengan validasi
export async function exampleScanWithValidation(directoryPath: string) {
  try {
    // 1. Validate directory path
    const validation = validateMangaDirectory(directoryPath);
    if (!validation.valid) {
      console.error('❌ Directory validation failed:', validation.errors);
      return null;
    }
    
    console.log('✅ Directory path valid, proceeding with scan...');
    
    // 2. Scan and import
    const result = await exampleScanDirectory();
    
    return result;
    
  } catch (error) {
    console.error('❌ Error in scan with validation:', error);
    return null;
  }
}

// Contoh format filename yang didukung:
export const supportedFilenameFormats = [
  '001.cbz',           // ✅ Basic number
  '1.cbz',             // ✅ Single digit
  '1.5.cbz',           // ✅ Decimal chapter
  'Chapter 1.cbz',     // ✅ With prefix
  '1 - Title.cbz',     // ✅ With separator
  'Title - 1.cbz',     // ✅ With separator
  'Title 1.cbz',       // ✅ With space
  '001_Title.cbz',     // ✅ With underscore
  'Vol1_001.cbz',      // ✅ With volume prefix
  'Episode 1.cbz'      // ✅ With episode prefix
];

// Contoh format yang TIDAK didukung:
export const unsupportedFilenameFormats = [
  'Chapter.cbz',        // ❌ No number
  'Title.cbz',          // ❌ No number
  'Special.cbz',        // ❌ No number
  'Bonus.cbz'           // ❌ No number
];
