export class IpcLogger {
  static logRequest(handlerName: string, args: any[], userId?: string) {
    console.log(`[IPC] ${handlerName} called by ${userId || 'unknown'}`, {
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
    });
  }

  static logError(handlerName: string, error: Error, args: any[]) {
    console.error(`[IPC ERROR] ${handlerName} failed:`, {
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
    });
  }

  static logSuccess(handlerName: string, duration: number, args: any[]) {
    console.log(`[IPC SUCCESS] ${handlerName} completed in ${duration}ms`, {
      timestamp: new Date().toISOString(),
      duration,
      argsCount: args.length
    });
  }

  static logRateLimit(handlerName: string, status: { allowed: boolean; remaining: number; resetTime: number }) {
    if (!status.allowed) {
      console.warn(`[IPC RATE LIMIT] ${handlerName} rate limited`, {
        timestamp: new Date().toISOString(),
        remaining: status.remaining,
        resetTime: new Date(status.resetTime).toISOString()
      });
    }
  }
}
