import { Injectable } from '@nestjs/common';

interface CacheEntry<T> {
  value: T;
  expiresAt: number;
}

@Injectable()
export class CacheService {
  private cache = new Map<string, CacheEntry<any>>();

  /**
   * Clean expired entries periodically
   */
  constructor() {
    setInterval(() => this.cleanExpired(), 60000); // Clean every minute
  }

  /**
   * Generate cache key for duplicate transaction check
   */
  private getDuplicateTransactionKey(amount: number, userId?: number): string {
    return `duplicate_txn:${userId || 'guest'}:${amount}`;
  }

  /**
   * Check if a duplicate transaction exists in cache
   */
  async checkDuplicateTransaction(
    amount: number,
    userId?: number,
  ): Promise<{ reference: string; authorization_url: string } | null> {
    const key = this.getDuplicateTransactionKey(amount, userId);
    return this.get<{ reference: string; authorization_url: string }>(key);
  }

  /**
   * Cache a pending transaction for 5 minutes to prevent duplicates
   */
  async cachePendingTransaction(
    amount: number,
    reference: string,
    authorizationUrl: string,
    userId?: number,
  ): Promise<void> {
    const key = this.getDuplicateTransactionKey(amount, userId);
    const value = {
      reference,
      authorization_url: authorizationUrl,
    };

    // Cache for 5 minutes
    this.set(key, value, 300000);
  }

  /**
   * Invalidate duplicate transaction cache
   */
  async invalidateDuplicateTransaction(
    amount: number,
    userId?: number,
  ): Promise<void> {
    const key = this.getDuplicateTransactionKey(amount, userId);
    this.delete(key);
  }

  /**
   * Cache user data for faster access
   */
  async cacheUser(userId: number, userData: any, ttl = 3600000): Promise<void> {
    const key = `user:${userId}`;
    this.set(key, userData, ttl);
  }

  /**
   * Get cached user data
   */
  async getCachedUser(userId: number): Promise<any> {
    const key = `user:${userId}`;
    return this.get(key);
  }

  /**
   * Invalidate user cache
   */
  async invalidateUser(userId: number): Promise<void> {
    const key = `user:${userId}`;
    this.delete(key);
  }

  /**
   * Generic get method
   */
  private get<T>(key: string): T | null {
    const entry = this.cache.get(key);

    if (!entry) return null;

    // Check if expired
    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      return null;
    }

    return entry.value;
  }

  /**
   * Generic set method with TTL
   */
  private set(key: string, value: any, ttl: number): void {
    const expiresAt = Date.now() + ttl;
    this.cache.set(key, { value, expiresAt });
  }

  /**
   * Generic delete method
   */
  private delete(key: string): void {
    this.cache.delete(key);
  }

  /**
   * Clean expired entries
   */
  private cleanExpired(): void {
    const now = Date.now();
    for (const [key, entry] of this.cache.entries()) {
      if (now > entry.expiresAt) {
        this.cache.delete(key);
      }
    }
  }
}
