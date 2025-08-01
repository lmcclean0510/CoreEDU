
interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number; // Time to live in milliseconds
}

class DataCache {
  private cache = new Map<string, CacheEntry<any>>();
  private isClient = typeof window !== 'undefined';
  
  set<T>(key: string, data: T, ttl: number = 5 * 60 * 1000) { // Default 5 minutes
    const entry = {
      data,
      timestamp: Date.now(),
      ttl
    };
    
    // Set in memory cache
    this.cache.set(key, entry);
    
    // Set in persistent storage (browser only)
    if (this.isClient) {
      try {
        localStorage.setItem(`cache-${key}`, JSON.stringify(entry));
      } catch (error) {
        // Silently fail if localStorage is full or unavailable
        console.warn('Failed to cache to localStorage:', error);
      }
    }
  }
  
  get<T>(key: string): T | null {
    // Try memory cache first
    let entry = this.cache.get(key);
    
    // If not in memory and we're in browser, try localStorage
    if (!entry && this.isClient) {
      try {
        const stored = localStorage.getItem(`cache-${key}`);
        if (stored) {
          const parsed = JSON.parse(stored);
          // Restore to memory cache if still valid
          if (Date.now() - parsed.timestamp <= parsed.ttl) {
            entry = parsed;
            this.cache.set(key, parsed);
          } else {
            // Clean up expired item
            localStorage.removeItem(`cache-${key}`);
          }
        }
      } catch (error) {
        // Silently fail and clean up corrupted data
        try {
          localStorage.removeItem(`cache-${key}`);
        } catch {}
      }
    }
    
    if (!entry) return null;
    
    // Check if expired
    if (Date.now() - entry.timestamp > entry.ttl) {
      this.cache.delete(key);
      if (this.isClient) {
        try {
          localStorage.removeItem(`cache-${key}`);
        } catch {}
      }
      return null;
    }
    
    return entry.data;
  }
  
  clear() {
    this.cache.clear();
    
    // Clear localStorage cache items
    if (this.isClient) {
      try {
        const keysToRemove = [];
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (key?.startsWith('cache-')) {
            keysToRemove.push(key);
          }
        }
        keysToRemove.forEach(key => localStorage.removeItem(key));
      } catch (error) {
        console.warn('Failed to clear localStorage cache:', error);
      }
    }
  }
  
  invalidate(pattern: string) {
    // Clear from memory cache
    for (const key of this.cache.keys()) {
      if (key.includes(pattern)) {
        this.cache.delete(key);
      }
    }
    
    // Clear from localStorage
    if (this.isClient) {
      try {
        const keysToRemove = [];
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (key?.startsWith('cache-') && key.includes(pattern)) {
            keysToRemove.push(key);
          }
        }
        keysToRemove.forEach(key => localStorage.removeItem(key));
      } catch (error) {
        console.warn('Failed to invalidate localStorage cache:', error);
      }
    }
  }
}

// Global singleton cache instance
export const dataCache = new DataCache();
