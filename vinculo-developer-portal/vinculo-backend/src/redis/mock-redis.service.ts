import { Injectable, Logger, OnModuleInit, OnModuleDestroy } from '@nestjs/common';

/**
 * In-memory mock of RedisService for local development without Redis.
 * Simulates get/set/del/ttl with automatic TTL expiration.
 */

interface StoreEntry {
  value: string;
  expiresAt: number | null; // timestamp in ms, null = no expiry
}

@Injectable()
export class MockRedisService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger('MockRedisService');
  private store = new Map<string, StoreEntry>();
  private cleanupInterval: ReturnType<typeof setInterval> | null = null;

  async onModuleInit(): Promise<void> {
    this.logger.warn('⚠️  Using IN-MEMORY mock Redis (no Redis server)');
    // Clean up expired keys every 10 seconds
    this.cleanupInterval = setInterval(() => this.cleanup(), 10_000);
  }

  async onModuleDestroy(): Promise<void> {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }
    this.store.clear();
  }

  private cleanup(): void {
    const now = Date.now();
    for (const [key, entry] of this.store) {
      if (entry.expiresAt && entry.expiresAt <= now) {
        this.store.delete(key);
      }
    }
  }

  private isExpired(entry: StoreEntry): boolean {
    return entry.expiresAt !== null && entry.expiresAt <= Date.now();
  }

  // ─── Redis-compatible API ────────────────────────────────

  async get(key: string): Promise<string | null> {
    const entry = this.store.get(key);
    if (!entry || this.isExpired(entry)) {
      this.store.delete(key);
      return null;
    }
    return entry.value;
  }

  async set(key: string, value: string, mode?: string, ttlSeconds?: number): Promise<string> {
    let expiresAt: number | null = null;
    if (mode === 'EX' && ttlSeconds) {
      expiresAt = Date.now() + ttlSeconds * 1000;
    }
    this.store.set(key, { value, expiresAt });
    return 'OK';
  }

  async del(key: string): Promise<number> {
    const existed = this.store.has(key);
    this.store.delete(key);
    return existed ? 1 : 0;
  }

  async ttl(key: string): Promise<number> {
    const entry = this.store.get(key);
    if (!entry || this.isExpired(entry)) {
      return -2; // key does not exist
    }
    if (entry.expiresAt === null) {
      return -1; // no expiry
    }
    return Math.max(0, Math.ceil((entry.expiresAt - Date.now()) / 1000));
  }

  async incr(key: string): Promise<number> {
    const entry = this.store.get(key);
    const current = entry && !this.isExpired(entry) ? parseInt(entry.value, 10) || 0 : 0;
    const newVal = current + 1;
    if (entry && !this.isExpired(entry)) {
      entry.value = String(newVal);
    } else {
      this.store.set(key, { value: String(newVal), expiresAt: null });
    }
    return newVal;
  }

  // ioredis status property
  get status(): string {
    return 'ready';
  }
}
