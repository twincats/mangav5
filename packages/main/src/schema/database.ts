import { drizzle } from 'drizzle-orm/better-sqlite3';
import Database from 'better-sqlite3';
import type { Database as SQLiteDatabase } from 'better-sqlite3';
import { join } from 'path';
import { app } from 'electron';
import * as schema from './manga.js';
import { runMigrations } from './migrations.js';

export class DatabaseManager {
  private static instance: DatabaseManager;
  private sqlite: SQLiteDatabase | null = null;
  private db: ReturnType<typeof drizzle> | null = null;
  private isInitialized = false;

  private constructor() {}

  static getInstance(): DatabaseManager {
    if (!DatabaseManager.instance) {
      DatabaseManager.instance = new DatabaseManager();
    }
    return DatabaseManager.instance;
  }

  private getDatabasePath(): string {
    const userDataPath = app.getPath('userData');
    return join(userDataPath, 'manga.db');
  }

  async initialize(): Promise<void> {
    if (this.isInitialized) {
      console.log('Database already initialized');
      return;
    }

    try {
      const dbPath = this.getDatabasePath();
      console.log(`Initializing database at: ${dbPath}`);
      
      // Create a new database connection
      this.sqlite = new Database(dbPath);
      
      // Create the Drizzle ORM instance
      this.db = drizzle(this.sqlite, { schema });
      
      // Run migrations
      await runMigrations(this.sqlite);
      
      this.isInitialized = true;
      console.log('Database initialized successfully');
    } catch (error) {
      console.error('Failed to initialize database:', error);
      throw error;
    }
  }

  getConnection() {
    if (!this.isInitialized || !this.db || !this.sqlite) {
      throw new Error('Database not initialized. Call initialize() first.');
    }
    return { db: this.db, sqlite: this.sqlite };
  }

  async close(): Promise<void> {
    if (this.sqlite) {
      this.sqlite.close();
      this.sqlite = null;
      this.db = null;
      this.isInitialized = false;
      console.log('Database connection closed');
    }
  }

  isReady(): boolean {
    return this.isInitialized;
  }
}

// Legacy function for backward compatibility
export const initializeDatabase = () => {
  const dbManager = DatabaseManager.getInstance();
  if (!dbManager.isReady()) {
    throw new Error('Database not initialized. Call DatabaseManager.getInstance().initialize() first.');
  }
  return dbManager.getConnection();
};

// Export the schema for use in other files
export { schema };
