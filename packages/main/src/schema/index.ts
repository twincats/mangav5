import { drizzle } from 'drizzle-orm/better-sqlite3';
import Database from 'better-sqlite3';
import { join } from 'path';
import { app } from 'electron';
import * as schema from './manga.js';

// Define the path for the SQLite database file
const getDatabasePath = () => {
  // Use the app's user data directory to store the database
  const userDataPath = app.getPath('userData');
  return join(userDataPath, 'manga.db');
};

// Initialize the database connection
export const initializeDatabase = () => {
  const dbPath = getDatabasePath();
  console.log(`Initializing database at: ${dbPath}`);
  
  // Create a new database connection
  const sqlite = new Database(dbPath);
  
  // Create the Drizzle ORM instance
  const db = drizzle(sqlite, { schema });
  
  return { db, sqlite };
};

// Export the schema for use in other files
export { schema };