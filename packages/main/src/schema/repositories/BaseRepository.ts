import { drizzle } from 'drizzle-orm/better-sqlite3';
import type { Database as SQLiteDatabase } from 'better-sqlite3';
import { DatabaseManager } from '../database.js';

export abstract class BaseRepository {
  protected db: ReturnType<typeof drizzle>;
  protected sqlite: SQLiteDatabase;

  constructor() {
    const dbManager = DatabaseManager.getInstance();
    if (!dbManager.isReady()) {
      throw new Error('Database not initialized. Call DatabaseManager.getInstance().initialize() first.');
    }
    
    const connection = dbManager.getConnection();
    this.db = connection.db;
    this.sqlite = connection.sqlite;
  }

  /**
   * Execute operation within a transaction
   */
  protected async executeInTransaction<T>(
    operation: () => T
  ): Promise<T> {
    try {
      return this.sqlite.transaction(operation)();
    } catch (error) {
      console.error('Transaction failed:', error);
      throw new Error(`Transaction failed: ${error}`);
    }
  }

  /**
   * Execute batch operations with error handling
   */
  protected async executeBatch<T>(
    items: T[],
    operation: (item: T, index: number) => Promise<void>,
    operationName: string = 'batch operation'
  ): Promise<{ success: boolean; processed: number; errors: string[] }> {
    const result = {
      success: true,
      processed: 0,
      errors: [] as string[]
    };

    for (let i = 0; i < items.length; i++) {
      try {
        await operation(items[i], i);
        result.processed++;
      } catch (error) {
        const errorMsg = `Error in ${operationName} at index ${i}: ${error}`;
        result.errors.push(errorMsg);
        console.error(errorMsg);
      }
    }

    result.success = result.errors.length === 0;
    return result;
  }

  /**
   * Safe database operation with error handling
   */
  protected async safeExecute<T>(
    operation: () => T,
    operationName: string = 'database operation'
  ): Promise<T> {
    try {
      return operation();
    } catch (error) {
      console.error(`${operationName} failed:`, error);
      throw new Error(`${operationName} failed: ${error}`);
    }
  }

  /**
   * Validate required fields
   */
  protected validateRequired<T extends Record<string, any>>(
    data: T,
    requiredFields: (keyof T)[]
  ): void {
    const missingFields = requiredFields.filter(field => {
      const value = data[field];
      return value === undefined || value === null || value === '';
    });

    if (missingFields.length > 0) {
      throw new Error(`Missing required fields: ${missingFields.join(', ')}`);
    }
  }

  /**
   * Log operation start and completion
   */
  protected logOperation(operationName: string, details?: string): void {
    const timestamp = new Date().toISOString();
    const logMessage = `[${timestamp}] ${operationName}${details ? `: ${details}` : ''}`;
    console.log(logMessage);
  }
}
