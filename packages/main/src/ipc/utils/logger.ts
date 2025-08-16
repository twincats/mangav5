// Environment-based logging configuration
const isDevelopment = process.env.NODE_ENV === 'development' || !process.env.NODE_ENV;
const isProduction = process.env.NODE_ENV === 'production';

// Logging levels
export enum LogLevel {
  NONE = 0,
  ERROR = 1,
  WARN = 2,
  INFO = 3,
  DEBUG = 4
}

// Get current log level based on environment
const getCurrentLogLevel = (): LogLevel => {
  if (isProduction) {
    return LogLevel.ERROR; // Only errors in production
  }
  if (isDevelopment) {
    return LogLevel.DEBUG; // Full logging in development
  }
  return LogLevel.WARN; // Default to warnings
};

export class IpcLogger {
  private static currentLevel = getCurrentLogLevel();

  // Update log level (useful for runtime configuration)
  static setLogLevel(level: LogLevel): void {
    this.currentLevel = level;
  }

  // Get current log level
  static getLogLevel(): LogLevel {
    return this.currentLevel;
  }

  // Check if logging is enabled for given level
  private static shouldLog(level: LogLevel): boolean {
    return level <= this.currentLevel;
  }

  static logRequest(handlerName: string, args: any[], userId?: string) {
    if (!this.shouldLog(LogLevel.DEBUG)) return;

    const logData = {
      timestamp: new Date().toISOString(),
      args: args.map(arg => {
        if (typeof arg === 'string') {
          return arg.length > 100 ? arg.substring(0, 100) + '...' : arg;
        }
        if (Array.isArray(arg)) {
          return `Array[${arg.length}]`;
        }
        if (typeof arg === 'object') {
          return `Object(${Object.keys(arg).length} keys)`;
        }
        return typeof arg;
      })
    };

    if (isProduction) {
      // In production, use structured logging without console
      this.writeToLogFile('REQUEST', handlerName, logData);
    } else {
      console.log(`[IPC] ${handlerName} called by ${userId || 'unknown'}`, logData);
    }
  }

  static logError(handlerName: string, error: Error, args: any[]) {
    if (!this.shouldLog(LogLevel.ERROR)) return;

    const logData = {
      error: error.message,
      stack: error.stack,
      args: args.map(arg => {
        if (typeof arg === 'string') {
          return arg.length > 100 ? arg.substring(0, 100) + '...' : arg;
        }
        if (Array.isArray(arg)) {
          return `Array[${arg.length}]`;
        }
        if (typeof arg === 'object') {
          return `Object(${Object.keys(arg).length} keys)`;
        }
        return typeof arg;
      }),
      timestamp: new Date().toISOString()
    };

    if (isProduction) {
      // In production, use structured logging without console
      this.writeToLogFile('ERROR', handlerName, logData);
    } else {
      console.error(`[IPC ERROR] ${handlerName} failed:`, logData);
    }
  }

  static logSuccess(handlerName: string, duration: number, args: any[]) {
    if (!this.shouldLog(LogLevel.INFO)) return;

    const logData = {
      timestamp: new Date().toISOString(),
      duration,
      argsCount: args.length
    };

    if (isProduction) {
      // In production, use structured logging without console
      this.writeToLogFile('SUCCESS', handlerName, logData);
    } else {
      console.log(`[IPC SUCCESS] ${handlerName} completed in ${duration}ms`, logData);
    }
  }

  static logRateLimit(handlerName: string, status: { allowed: boolean; remaining: number; resetTime: number }) {
    if (!status.allowed && this.shouldLog(LogLevel.WARN)) {
      const logData = {
        timestamp: new Date().toISOString(),
        remaining: status.remaining,
        resetTime: new Date(status.resetTime).toISOString()
      };

      if (isProduction) {
        // In production, use structured logging without console
        this.writeToLogFile('RATE_LIMIT', handlerName, logData);
      } else {
        console.warn(`[IPC RATE LIMIT] ${handlerName} rate limited`, logData);
      }
    }
  }

  // Production logging to file (optional)
  private static writeToLogFile(level: string, handlerName: string, data: any): void {
    // In production, you might want to write to log files instead of console
    // This is a placeholder for production logging strategy
    if (isProduction) {
      // Example: Write to log file, send to monitoring service, etc.
      // For now, we just don't log anything in production
      return;
    }
  }
}
