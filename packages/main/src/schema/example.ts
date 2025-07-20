/**
 * This file contains examples of how to use the MangaRepository
 * for database operations in your application.
 */

import { MangaRepository } from './mangaRepository.js';

// Example function to demonstrate manga database operations
export async function mangaDatabaseExample() {
  // Create a new repository instance
  const repo = new MangaRepository();
  
  try {
    console.log('Running manga database example...');
    
    // Get all manga statuses
    const statuses = await repo.getAllStatuses();
    console.log('Available manga statuses:', statuses);
    
    // Create a new manga
    const mangaId = await repo.createManga({
      mainTitle: 'One Piece',
      description: 'A story about pirates searching for the ultimate treasure, the One Piece.',
      year: 1999,
      statusId: 1, // Assuming 1 is 'Ongoing'
      alternativeTitles: ['ワンピース', 'Wan Pīsu']
    });
    console.log(`Created manga with ID: ${mangaId}`);
    
    // Get the manga by ID
    const manga = await repo.getMangaById(mangaId);
    console.log('Retrieved manga:', manga);
    
    // Get alternative titles
    const altTitles = await repo.getAlternativeTitles(mangaId);
    console.log('Alternative titles:', altTitles);
    
    // Add chapters
    await repo.createChapter({
      mangaId,
      chapterNumber: 1,
      chapterTitle: 'Romance Dawn',
      volume: 1,
      translatorGroup: 'Viz Media',
      language: 'English'
    });
    
    await repo.createChapter({
      mangaId,
      chapterNumber: 2,
      chapterTitle: 'They Call Him "Straw Hat Luffy"',
      volume: 1,
      translatorGroup: 'Viz Media',
      language: 'English'
    });
    
    // Get chapters
    const chapters = await repo.getChapters(mangaId);
    console.log('Chapters:', chapters);
    
    // Create a scraping rule
    await repo.createScrapingRule({
      websiteUrl: 'https://example.com/manga',
      rulesJson: JSON.stringify({
        titleSelector: '.manga-title',
        chapterSelector: '.chapter-list .chapter-item',
        imageSelector: '.manga-image img'
      })
    });
    
    // Get all scraping rules
    const rules = await repo.getAllScrapingRules();
    console.log('Scraping rules:', rules);
    
    console.log('Manga database example completed successfully');
  } catch (error) {
    console.error('Error in manga database example:', error);
  } finally {
    // Close the database connection
    repo.close();
  }
}

// To run this example, you would call:
// mangaDatabaseExample().catch(console.error);