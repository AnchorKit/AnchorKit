export declare class Cache {
    private client;
    private readonly ttl;
    constructor(redisUrl?: string, ttlSeconds?: number);
    get<T>(key: string): Promise<T | null>;
    set(key: string, value: unknown, ttlSeconds?: number): Promise<void>;
    del(key: string): Promise<void>;
    disconnect(): Promise<void>;
}
//# sourceMappingURL=index.d.ts.map