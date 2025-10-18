// src/lib/utils/subscription-manager.ts - NEW FILE

import { type Unsubscribe } from 'firebase/firestore';

/**
 * Memory-safe subscription manager for Firebase Firestore listeners
 * Prevents memory leaks and connection issues
 */
export class SubscriptionManager {
  private subscriptions: Map<string, Unsubscribe> = new Map();
  private isDestroyed = false;
  private debugName: string;

  constructor(debugName: string = 'Unknown') {
    this.debugName = debugName;
  }

  /**
   * Add a subscription with an optional key for tracking
   */
  add(key: string, unsubscribe: Unsubscribe): void {
    if (this.isDestroyed) {
      console.warn(`[${this.debugName}] Attempted to add subscription after destruction`);
      // Immediately unsubscribe if manager is destroyed
      unsubscribe();
      return;
    }

    // Clean up existing subscription with same key
    const existing = this.subscriptions.get(key);
    if (existing) {
      existing();
    }

    this.subscriptions.set(key, unsubscribe);
  }

  /**
   * Remove a specific subscription by key
   */
  remove(key: string): boolean {
    const unsubscribe = this.subscriptions.get(key);
    if (unsubscribe) {
      unsubscribe();
      this.subscriptions.delete(key);
      return true;
    }
    return false;
  }

  /**
   * Check if a subscription exists
   */
  has(key: string): boolean {
    return this.subscriptions.has(key);
  }

  /**
   * Get count of active subscriptions
   */
  count(): number {
    return this.subscriptions.size;
  }

  /**
   * Clean up all subscriptions
   */
  cleanup(): void {
    
    for (const [key, unsubscribe] of this.subscriptions) {
      try {
        unsubscribe();
      } catch (error) {
        console.error(`[${this.debugName}] Error cleaning up subscription ${key}:`, error);
      }
    }
    
    this.subscriptions.clear();
  }

  /**
   * Destroy the manager - no new subscriptions can be added
   */
  destroy(): void {
    if (this.isDestroyed) return;
    
    this.cleanup();
    this.isDestroyed = true;
  }

  /**
   * Check if manager is destroyed
   */
  get destroyed(): boolean {
    return this.isDestroyed;
  }
}

/**
 * React hook for managing subscriptions with automatic cleanup
 */
import { useEffect, useRef } from 'react';

export function useSubscriptionManager(debugName?: string): SubscriptionManager {
  const managerRef = useRef<SubscriptionManager | null>(null);

  // Initialize manager
  if (!managerRef.current) {
    managerRef.current = new SubscriptionManager(debugName || 'React Component');
  }

  // Cleanup on unmount
  useEffect(() => {
    const manager = managerRef.current;
    
    return () => {
      if (manager) {
        manager.destroy();
      }
    };
  }, []);

  return managerRef.current;
}

/**
 * Utility function to create a subscription manager for class components
 */
export function createSubscriptionManager(debugName?: string): SubscriptionManager {
  return new SubscriptionManager(debugName);
}

/**
 * Global subscription manager for app-level subscriptions
 */
class GlobalSubscriptionManager {
  private managers: Map<string, SubscriptionManager> = new Map();

  getOrCreate(key: string): SubscriptionManager {
    let manager = this.managers.get(key);
    if (!manager) {
      manager = new SubscriptionManager(`Global-${key}`);
      this.managers.set(key, manager);
    }
    return manager;
  }

  cleanup(key: string): void {
    const manager = this.managers.get(key);
    if (manager) {
      manager.destroy();
      this.managers.delete(key);
    }
  }

  cleanupAll(): void {
    for (const [key, manager] of this.managers) {
      manager.destroy();
    }
    this.managers.clear();
  }
}

export const globalSubscriptionManager = new GlobalSubscriptionManager();

// Cleanup on app shutdown (browser close, etc.)
if (typeof window !== 'undefined') {
  window.addEventListener('beforeunload', () => {
    globalSubscriptionManager.cleanupAll();
  });
}