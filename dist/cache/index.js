"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Cache = void 0;
const ioredis_1 = __importDefault(require("ioredis"));
class Cache {
    constructor(redisUrl, ttlSeconds = 300) {
        this.client = null;
        this.ttl = ttlSeconds;
        if (redisUrl) {
            this.client = new ioredis_1.default(redisUrl, { lazyConnect: true, enableOfflineQueue: false });
            this.client.on('error', () => {
                // Silently degrade to no-cache on Redis errors
            });
        }
    }
    async get(key) {
        if (!this.client)
            return null;
        try {
            const val = await this.client.get(key);
            return val ? JSON.parse(val) : null;
        }
        catch {
            return null;
        }
    }
    async set(key, value, ttlSeconds) {
        if (!this.client)
            return;
        try {
            await this.client.set(key, JSON.stringify(value), 'EX', ttlSeconds ?? this.ttl);
        }
        catch {
            // Degrade gracefully
        }
    }
    async del(key) {
        if (!this.client)
            return;
        try {
            await this.client.del(key);
        }
        catch {
            // Degrade gracefully
        }
    }
    async disconnect() {
        if (this.client) {
            await this.client.quit();
            this.client = null;
        }
    }
}
exports.Cache = Cache;
//# sourceMappingURL=index.js.map