export class RateLimiter {
  private requests = new Map<string, number[]>();
  private maxRequests = 100; // Max requests per minute
  private windowMs = 60000; // 1 minute

  isAllowed(handlerName: string): boolean {
    const now = Date.now();
    const userRequests = this.requests.get(handlerName) || [];
    
    // Remove old requests outside the window
    const recentRequests = userRequests.filter(time => now - time < this.windowMs);
    
    if (recentRequests.length >= this.maxRequests) {
      return false;
    }
    
    recentRequests.push(now);
    this.requests.set(handlerName, recentRequests);
    return true;
  }

  // Reset rate limit for specific handler
  reset(handlerName: string): void {
    this.requests.delete(handlerName);
  }

  // Reset all rate limits
  resetAll(): void {
    this.requests.clear();
  }

  // Get current rate limit status
  getStatus(handlerName: string): { allowed: boolean; remaining: number; resetTime: number } {
    const now = Date.now();
    const userRequests = this.requests.get(handlerName) || [];
    const recentRequests = userRequests.filter(time => now - time < this.windowMs);
    const remaining = Math.max(0, this.maxRequests - recentRequests.length);
    const resetTime = now + this.windowMs;
    
    return {
      allowed: remaining > 0,
      remaining,
      resetTime
    };
  }
}

// Global rate limiter instance
export const globalRateLimiter = new RateLimiter();
