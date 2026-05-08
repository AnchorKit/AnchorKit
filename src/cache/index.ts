import Redis from 'ioredis';

export class Cache {
  private client: Redis | null = null;
  private readonly ttl: number;

  constructor(redisUrl?: string, ttlSeconds = 300) {
    this.ttl = ttlSeconds;
    if (redisUrl) {
      this.client = new Redis(redisUrl, { lazyConnect: true, enableOfflineQueue: false });
      this.client.on('error', () => {
        // Silently degrade to no-cache on Redis errors
      });
    }
  }

  async get<T>(key: string): Promise<T | null> {
    if (!this.client) return null;
    try {
      const val = await this.client.get(key);
      return val ? (JSON.parse(val) as T) : null;
    } catch {
      return null;
    }
  }

  async set(key: string, value: unknown, ttlSeconds?: number): Promise<void> {
    if (!this.client) return;
    try {
      await this.client.set(key, JSON.stringify(value), 'EX', ttlSeconds ?? this.ttl);
    } catch {
      // Degrade gracefully
    }
  }

  async del(key: string): Promise<void> {
    if (!this.client) return;
    try {
      await this.client.del(key);
    } catch {
      // Degrade gracefully
    }
  }

  async disconnect(): Promise<void> {
    if (this.client) {
      await this.client.quit();
      this.client = null;
    }
  }
}
