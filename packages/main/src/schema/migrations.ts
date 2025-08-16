import { sql } from 'drizzle-orm';
import { Database } from 'better-sqlite3';

// Migration version management
function getCurrentVersion(sqlite: Database): string {
  try {
    const result = sqlite.prepare('SELECT version FROM __migrations__ ORDER BY applied_at DESC LIMIT 1').get() as { version: string } | undefined;
    return result?.version || '0.0.0';
  } catch {
    return '0.0.0';
  }
}

function updateVersion(sqlite: Database, version: string): void {
  sqlite.prepare('INSERT INTO __migrations__ (version) VALUES (?)').run(version);
}

export async function runMigrations(sqlite: Database) {
  try {
    // Create migrations table if it doesn't exist
    sqlite.exec(`
      CREATE TABLE IF NOT EXISTS __migrations__ (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        version TEXT NOT NULL UNIQUE,
        applied_at TEXT DEFAULT (datetime('now'))
      );
    `);

    // Check current database version
    const currentVersion = getCurrentVersion(sqlite);
    const targetVersion = '1.1.0'; // Updated schema version with status_read field
    
    if (currentVersion === targetVersion) {
      console.log('Database is up to date, no migrations needed');
      return;
    }

    console.log(`Running database migrations from ${currentVersion} to ${targetVersion}...`);
    
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
        status_read INTEGER DEFAULT 0,
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

    // Add status_read field to existing Chapters table if it doesn't exist
    try {
      const columnExists = sqlite.prepare("PRAGMA table_info(Chapters)").all() as Array<{name: string}>;
      const hasStatusRead = columnExists.some(col => col.name === 'status_read');
      
      if (!hasStatusRead) {
        console.log('Adding status_read field to Chapters table...');
        sqlite.exec('ALTER TABLE Chapters ADD COLUMN status_read INTEGER DEFAULT 0');
        console.log('status_read field added successfully');
      }
    } catch (error) {
      console.log('Chapters table might not exist yet, skipping status_read addition');
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

    // Update database version
    updateVersion(sqlite, targetVersion);
    
    console.log('Database migrations completed successfully');
  } catch (error) {
    console.error('Migration error:', error);
    throw error;
  }
}