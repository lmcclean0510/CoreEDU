// src/lib/security/rate-limit.ts - FIXED VERSION

interface RateLimitConfig {
  windowMs: number; // Time window in milliseconds
  maxAttempts: number; // Maximum attempts per window
  skipSuccessfulRequests?: boolean; // Don't count successful requests
  skipFailedRequests?: boolean; // Don't count failed requests
  keyGenerator?: (identifier: string) => string; // Custom key generation
}

interface RateLimitResult {
  success: boolean;
  limit: number;
  remaining: number;
  resetTime: number;
  retryAfter?: number;
}

interface RateLimitEntry {
  count: number;
  resetTime: number;
  blocked: boolean; // Track if this IP is currently blocked
  blockStartTime?: number; // When the block started
}

class InMemoryRateLimitStore {
  private store = new Map<string, RateLimitEntry>();
  private cleanupInterval: NodeJS.Timeout;

  constructor() {
    // Clean up expired entries every minute
    this.cleanupInterval = setInterval(() => {
      this.cleanup();
    }, 60000);
  }

  private cleanup() {
    const now = Date.now();
    for (const [key, entry] of this.store.entries()) {
      if (entry.resetTime <= now) {
        this.store.delete(key);
      }
    }
  }

  get(key: string): RateLimitEntry | undefined {
    const entry = this.store.get(key);
    if (entry && entry.resetTime > Date.now()) {
      return entry;
    }
    // Clean up expired entry
    if (entry) {
      this.store.delete(key);
    }
    return undefined;
  }

  set(key: string, entry: RateLimitEntry): void {
    this.store.set(key, entry);
  }

  increment(key: string, windowMs: number, maxAttempts: number): RateLimitEntry {
    const now = Date.now();
    const resetTime = now + windowMs;
    const existing = this.get(key);

    if (existing) {
      existing.count++;
      
      // Block if exceeded limit
      if (existing.count >= maxAttempts && !existing.blocked) {
        existing.blocked = true;
        existing.blockStartTime = now;
        // Extend the reset time when blocked
        existing.resetTime = now + windowMs;
      }
      
      this.set(key, existing);
      return existing;
    } else {
      const newEntry: RateLimitEntry = { 
        count: 1, 
        resetTime, 
        blocked: false 
      };
      this.set(key, newEntry);
      return newEntry;
    }
  }

  isBlocked(key: string): boolean {
    const entry = this.get(key);
    return entry ? entry.blocked : false;
  }

  destroy() {
    clearInterval(this.cleanupInterval);
    this.store.clear();
  }
}

// Global store instance
const store = new InMemoryRateLimitStore();

export class RateLimit {
  private config: Required<RateLimitConfig>;

  constructor(config: RateLimitConfig) {
    this.config = {
      skipSuccessfulRequests: false,
      skipFailedRequests: false,
      keyGenerator: (identifier: string) => identifier,
      ...config,
    };
  }

  async check(identifier: string): Promise<RateLimitResult> {
    const key = this.config.keyGenerator(identifier);
    const now = Date.now();
    
    // Check if already blocked
    if (store.isBlocked(key)) {
      const entry = store.get(key);
      if (entry) {
        return {
          success: false,
          limit: this.config.maxAttempts,
          remaining: 0,
          resetTime: entry.resetTime,
          retryAfter: Math.ceil((entry.resetTime - now) / 1000),
        };
      }
    }
    
    const entry = store.get(key);
    
    if (!entry) {
      // First request in window
      const resetTime = now + this.config.windowMs;
      store.set(key, { count: 1, resetTime, blocked: false });
      
      return {
        success: true,
        limit: this.config.maxAttempts,
        remaining: this.config.maxAttempts - 1,
        resetTime,
      };
    }

    if (entry.count >= this.config.maxAttempts) {
      // Rate limit exceeded - ensure they stay blocked
      entry.blocked = true;
      entry.resetTime = Math.max(entry.resetTime, now + this.config.windowMs);
      store.set(key, entry);
      
      return {
        success: false,
        limit: this.config.maxAttempts,
        remaining: 0,
        resetTime: entry.resetTime,
        retryAfter: Math.ceil((entry.resetTime - now) / 1000),
      };
    }

    // Increment counter
    const updatedEntry = store.increment(key, this.config.windowMs, this.config.maxAttempts);
    
    return {
      success: !updatedEntry.blocked,
      limit: this.config.maxAttempts,
      remaining: Math.max(0, this.config.maxAttempts - updatedEntry.count),
      resetTime: updatedEntry.resetTime,
    };
  }

  async consume(identifier: string): Promise<RateLimitResult> {
    return this.check(identifier);
  }

  async reset(identifier: string): Promise<void> {
    const key = this.config.keyGenerator(identifier);
    store.set(key, { 
      count: 0, 
      resetTime: Date.now() + this.config.windowMs,
      blocked: false 
    });
  }
}

// Helper function to create rate limiters
export function rateLimit(config: RateLimitConfig): RateLimit {
  return new RateLimit(config);
}

// Pre-configured rate limiters for common use cases
export const authRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  maxAttempts: 5, // 5 attempts per window
  skipSuccessfulRequests: false, // Count all attempts
});

export const apiRateLimit = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  maxAttempts: 60, // 60 requests per minute
});

export const strictRateLimit = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  maxAttempts: 10, // 10 requests per minute
});

export const uploadRateLimit = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  maxAttempts: 3, // 3 uploads per minute
});

// Cleanup function for graceful shutdown
export function cleanup() {
  store.destroy();
}