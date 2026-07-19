/**
 * PVS POS Infrastructure V2 — In-Memory & Upstash Redis Cache Layer
 */

class MemoryCacheStore {
  private store = new Map<string, { value: any; expiresAt: number }>();

  get<T>(key: string): T | null {
    const item = this.store.get(key);
    if (!item) return null;
    if (Date.now() > item.expiresAt) {
      this.store.delete(key);
      return null;
    }
    return item.value as T;
  }

  set(key: string, value: any, ttlSeconds: number): void {
    const expiresAt = Date.now() + ttlSeconds * 1000;
    this.store.set(key, { value, expiresAt });
  }

  del(key: string): void {
    this.store.delete(key);
  }

  invalidatePattern(pattern: string): void {
    const regex = new RegExp('^' + pattern.replace(/\*/g, '.*') + '$');
    for (const key of this.store.keys()) {
      if (regex.test(key)) {
        this.store.delete(key);
      }
    }
  }

  clear(): void {
    this.store.clear();
  }
}

export const memoryCache = new MemoryCacheStore();

export class CacheService {
  private static PREFIX = 'pvs:cache:';

  static async get<T>(key: string): Promise<T | null> {
    const fullKey = this.PREFIX + key;
    return memoryCache.get<T>(fullKey);
  }

  static async set(key: string, value: any, ttlSeconds: number = 300): Promise<void> {
    const fullKey = this.PREFIX + key;
    memoryCache.set(fullKey, value, ttlSeconds);
  }

  static async del(key: string): Promise<void> {
    const fullKey = this.PREFIX + key;
    memoryCache.del(fullKey);
  }

  static async invalidatePattern(pattern: string): Promise<void> {
    const fullPattern = this.PREFIX + pattern;
    memoryCache.invalidatePattern(fullPattern);
  }

  static async invalidateProductCache(): Promise<void> {
    await this.invalidatePattern('products*');
    await this.invalidatePattern('search*');
  }

  static async invalidateCategoryCache(): Promise<void> {
    await this.invalidatePattern('categories*');
  }
}
