import { migrate } from 'drizzle-orm/better-sqlite3/migrator';
import { initializeDatabase } from './index.js';

// Function to run migrations
export const runMigrations = async () => {
  const { db, sqlite } = initializeDatabase();
  
  try {
    // Create tables if they don't exist
    console.log('Running database migrations...');
    
    // Create MangaStatus table and insert default values
    sqlite.exec(`
      CREATE TABLE IF NOT EXISTS MangaStatus (
        status_id INTEGER PRIMARY KEY AUTOINCREMENT,
        status_name TEXT NOT NULL
      );
    `);
    
    // Insert default status values if they don't exist
    const statusCount = sqlite.prepare('SELECT COUNT(*) as count FROM MangaStatus').get() as { count: number };
    if (statusCount.count === 0) {
      const statuses = ['Ongoing', 'Completed', 'Hiatus', 'Cancelled'];
      const insertStatus = sqlite.prepare('INSERT INTO MangaStatus (status_name) VALUES (?)'); 
      
      for (const status of statuses) {
        insertStatus.run(status);
      }
      console.log('Default manga statuses inserted');
    }
    
    // Create Config table
    sqlite.exec(`
      CREATE TABLE IF NOT EXISTS Config (
        config_id INTEGER PRIMARY KEY AUTOINCREMENT,
        key TEXT NOT NULL,
        value TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    
    // Create other tables
    sqlite.exec(`
      CREATE TABLE IF NOT EXISTS Manga (
        manga_id INTEGER PRIMARY KEY AUTOINCREMENT,
        main_title TEXT NOT NULL,
        description TEXT,
        year INTEGER,
        status_id INTEGER,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(status_id) REFERENCES MangaStatus(status_id)
      );
      
      CREATE TABLE IF NOT EXISTS AlternativeTitles (
        alt_id INTEGER PRIMARY KEY AUTOINCREMENT,
        manga_id INTEGER,
        alternative_title TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(manga_id) REFERENCES Manga(manga_id)
      );
      
      CREATE TABLE IF NOT EXISTS Chapters (
        chapter_id INTEGER PRIMARY KEY AUTOINCREMENT,
        manga_id INTEGER,
        chapter_number INTEGER NOT NULL,
        chapter_title TEXT,
        volume INTEGER,
        translator_group TEXT,
        release_time TIMESTAMP,
        language TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(manga_id) REFERENCES Manga(manga_id)
      );
      
      CREATE TABLE IF NOT EXISTS ScrapingRules (
        rule_id INTEGER PRIMARY KEY AUTOINCREMENT,
        website_url TEXT NOT NULL,
        rules_json TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    
    console.log('Database migrations completed successfully');
    
    return { db, sqlite };
  } catch (error) {
    console.error('Error running migrations:', error);
    throw error;
  }
};