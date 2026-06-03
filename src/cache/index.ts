import Redis from 'ioredis';

interface MemEntry {
  value: string;
  expiresAt: number;
}

export class Cache {
  private client: Redis | null = null;
  private readonly ttl: number;
  private readonly mem = new Map<string, MemEntry>();

  constructor(redisUrl?: string, ttlSeconds = 300) {
    this.ttl = ttlSeconds;
    if (redisUrl) {
      this.client = new Redis(redisUrl, { lazyConnect: true, enableOfflineQueue: false });
      this.client.on('error', () => {
        // Silently degrade to in-memory cache on Redis errors
      });
    }
  }

  async get<T>(key: string): Promise<T | null> {
    if (this.client) {
      try {
        const val = await this.client.get(key);
        if (val) return JSON.parse(val) as T;
      } catch {
        // Fall through to in-memory
      }
    }
    const entry = this.mem.get(key);
    if (entry && entry.expiresAt > Date.now()) {
      return JSON.parse(entry.value) as T;
    }
    if (entry) this.mem.delete(key);
    return null;
  }

  async set(key: string, value: unknown, ttlSeconds?: number): Promise<void> {
    const ttl = ttlSeconds ?? this.ttl;
    const serialized = JSON.stringify(value);
    this.mem.set(key, { value: serialized, expiresAt: Date.now() + ttl * 1000 });
    if (this.client) {
      try {
        await this.client.set(key, serialized, 'EX', ttl);
      } catch {
        // Degrade gracefully
      }
    }
  }

  async del(key: string): Promise<void> {
    this.mem.delete(key);
    if (this.client) {
      try {
        await this.client.del(key);
      } catch {
        // Degrade gracefully
      }
    }
  }

  async disconnect(): Promise<void> {
    this.mem.clear();
    if (this.client) {
      await this.client.quit();
      this.client = null;
    }
  }
}
