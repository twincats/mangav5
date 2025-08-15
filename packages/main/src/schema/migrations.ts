import { sql } from 'drizzle-orm';
import { Database } from 'better-sqlite3';

export async function runMigrations(sqlite: Database) {
  try {
    console.log('Running database migrations...');
    
    // Create tables if they don't exist
    sqlite.exec(`
      CREATE TABLE IF NOT EXISTS Config (
        config_id INTEGER PRIMARY KEY AUTOINCREMENT,
        key TEXT NOT NULL,
        value TEXT NOT NULL,
        created_at TEXT DEFAULT (datetime('now')),
        updated_at TEXT DEFAULT (datetime('now'))
      );
    `);

    sqlite.exec(`
      CREATE TABLE IF NOT EXISTS MangaStatus (
        status_id INTEGER PRIMARY KEY AUTOINCREMENT,
        status_name TEXT NOT NULL
      );
    `);

    sqlite.exec(`
      CREATE TABLE IF NOT EXISTS Manga (
        manga_id INTEGER PRIMARY KEY AUTOINCREMENT,
        main_title TEXT NOT NULL,
        description TEXT,
        year INTEGER,
        status_id INTEGER,
        created_at TEXT DEFAULT (datetime('now')),
        updated_at TEXT DEFAULT (datetime('now')),
        FOREIGN KEY (status_id) REFERENCES MangaStatus(status_id)
      );
    `);

    sqlite.exec(`
      CREATE TABLE IF NOT EXISTS AlternativeTitles (
        alt_id INTEGER PRIMARY KEY AUTOINCREMENT,
        manga_id INTEGER NOT NULL,
        alternative_title TEXT NOT NULL,
        created_at TEXT DEFAULT (datetime('now')),
        FOREIGN KEY (manga_id) REFERENCES Manga(manga_id)
      );
    `);

    sqlite.exec(`
      CREATE TABLE IF NOT EXISTS Chapters (
        chapter_id INTEGER PRIMARY KEY AUTOINCREMENT,
        manga_id INTEGER NOT NULL,
        chapter_number INTEGER NOT NULL,
        chapter_title TEXT,
        volume INTEGER,
        translator_group TEXT,
        release_time TEXT,
        language TEXT,
        created_at TEXT DEFAULT (datetime('now')),
        FOREIGN KEY (manga_id) REFERENCES Manga(manga_id)
      );
    `);

    sqlite.exec(`
      CREATE TABLE IF NOT EXISTS ScrapingRules (
        rule_id INTEGER PRIMARY KEY AUTOINCREMENT,
        website_url TEXT NOT NULL,
        rules_json TEXT NOT NULL,
        created_at TEXT DEFAULT (datetime('now'))
      );
    `);

    // Insert default manga statuses if they don't exist
    const statusExists = sqlite.prepare('SELECT COUNT(*) as count FROM MangaStatus').get() as { count: number };
    if (statusExists.count === 0) {
      console.log('Default manga statuses inserted');
      sqlite.prepare('INSERT INTO MangaStatus (status_name) VALUES (?)').run('Ongoing');
      sqlite.prepare('INSERT INTO MangaStatus (status_name) VALUES (?)').run('Completed');
      sqlite.prepare('INSERT INTO MangaStatus (status_name) VALUES (?)').run('Hiatus');
      sqlite.prepare('INSERT INTO MangaStatus (status_name) VALUES (?)').run('Cancelled');
    }

    // Fix existing timestamp fields if they contain "CURRENT_TIMESTAMP" text
    console.log('Fixing existing timestamp fields...');
    
    // Update Config table
    sqlite.prepare(`
      UPDATE Config 
      SET created_at = datetime('now'), updated_at = datetime('now') 
      WHERE created_at = 'CURRENT_TIMESTAMP' OR updated_at = 'CURRENT_TIMESTAMP'
    `).run();

    // Update Manga table  
    sqlite.prepare(`
      UPDATE Manga 
      SET created_at = datetime('now'), updated_at = datetime('now') 
      WHERE created_at = 'CURRENT_TIMESTAMP' OR updated_at = 'CURRENT_TIMESTAMP'
    `).run();

    // Update AlternativeTitles table
    sqlite.prepare(`
      UPDATE AlternativeTitles 
      SET created_at = datetime('now') 
      WHERE created_at = 'CURRENT_TIMESTAMP'
    `).run();

    // Update Chapters table
    sqlite.prepare(`
      UPDATE Chapters 
      SET created_at = datetime('now') 
      WHERE created_at = 'CURRENT_TIMESTAMP'
    `).run();

    // Update ScrapingRules table
    sqlite.prepare(`
      UPDATE ScrapingRules 
      SET created_at = datetime('now') 
      WHERE created_at = 'CURRENT_TIMESTAMP'
    `).run();

    console.log('Database migrations completed successfully');
  } catch (error) {
    console.error('Migration error:', error);
    throw error;
  }
}