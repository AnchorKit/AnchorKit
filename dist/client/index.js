"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AnchorKit = void 0;
const discovery_1 = require("../discovery");
const sep10_1 = require("../sep10");
const sep6_1 = require("../sep6");
const sep24_1 = require("../sep24");
const sep31_1 = require("../sep31");
const health_1 = require("../health");
const cache_1 = require("../cache");
class AnchorKit {
    constructor(config) {
        this.anchors = [];
        this.config = config;
        this.cache = new cache_1.Cache(config.redisUrl, config.cacheTtlSeconds ?? 300);
    }
    /** Load and cache anchor info for all configured home domains */
    async getAnchors() {
        const cacheKey = `anchors:${this.config.network}`;
        const cached = await this.cache.get(cacheKey);
        if (cached) {
            this.anchors = cached;
            return cached;
        }
        const domains = this.config.homeDomains ?? [];
        this.anchors = await (0, discovery_1.discoverAnchors)(domains, this.config.network);
        await this.cache.set(cacheKey, this.anchors);
        return this.anchors;
    }
    /** Fetch a single anchor by home domain */
    async getAnchor(homeDomain) {
        const cacheKey = `anchor:${homeDomain}`;
        const cached = await this.cache.get(cacheKey);
        if (cached)
            return cached;
        const info = await (0, discovery_1.fetchAnchorInfo)(homeDomain, this.config.network);
        await this.cache.set(cacheKey, info);
        return info;
    }
    /** Get a SEP-10 JWT for the given account/keypair against an anchor */
    async auth(anchor, keypair) {
        if (!anchor.sep10Url)
            throw new Error(`${anchor.homeDomain} does not support SEP-10`);
        return (0, sep10_1.getToken)(anchor.sep10Url, keypair.publicKey(), keypair, anchor.networkPassphrase);
    }
    // ── SEP-6 ──────────────────────────────────────────────────────────────────
    async sep6Deposit(anchor, params, token) {
        if (!anchor.sep6Url)
            throw new Error(`${anchor.homeDomain} does not support SEP-6`);
        return (0, sep6_1.sep6Deposit)(anchor.sep6Url, params, token);
    }
    async sep6Withdraw(anchor, params, token) {
        if (!anchor.sep6Url)
            throw new Error(`${anchor.homeDomain} does not support SEP-6`);
        return (0, sep6_1.sep6Withdraw)(anchor.sep6Url, params, token);
    }
    async sep6Transaction(anchor, id, token) {
        if (!anchor.sep6Url)
            throw new Error(`${anchor.homeDomain} does not support SEP-6`);
        return (0, sep6_1.sep6Transaction)(anchor.sep6Url, id, token);
    }
    async sep6Transactions(anchor, assetCode, token) {
        if (!anchor.sep6Url)
            throw new Error(`${anchor.homeDomain} does not support SEP-6`);
        return (0, sep6_1.sep6Transactions)(anchor.sep6Url, assetCode, token);
    }
    // ── SEP-24 ─────────────────────────────────────────────────────────────────
    async sep24Deposit(anchor, params, token) {
        if (!anchor.sep24Url)
            throw new Error(`${anchor.homeDomain} does not support SEP-24`);
        return (0, sep24_1.sep24Deposit)(anchor.sep24Url, params, token);
    }
    async sep24Withdraw(anchor, params, token) {
        if (!anchor.sep24Url)
            throw new Error(`${anchor.homeDomain} does not support SEP-24`);
        return (0, sep24_1.sep24Withdraw)(anchor.sep24Url, params, token);
    }
    async sep24Transaction(anchor, id, token) {
        if (!anchor.sep24Url)
            throw new Error(`${anchor.homeDomain} does not support SEP-24`);
        return (0, sep24_1.sep24Transaction)(anchor.sep24Url, id, token);
    }
    async sep24Transactions(anchor, assetCode, token) {
        if (!anchor.sep24Url)
            throw new Error(`${anchor.homeDomain} does not support SEP-24`);
        return (0, sep24_1.sep24Transactions)(anchor.sep24Url, assetCode, token);
    }
    // ── SEP-31 ─────────────────────────────────────────────────────────────────
    async sep31Send(anchor, params, token) {
        if (!anchor.sep31Url)
            throw new Error(`${anchor.homeDomain} does not support SEP-31`);
        return (0, sep31_1.sep31Send)(anchor.sep31Url, params, token);
    }
    async sep31Transaction(anchor, id, token) {
        if (!anchor.sep31Url)
            throw new Error(`${anchor.homeDomain} does not support SEP-31`);
        return (0, sep31_1.sep31Transaction)(anchor.sep31Url, id, token);
    }
    // ── Unified deposit (SEP-24 preferred, fallback to SEP-6) ──────────────────
    async deposit(anchor, params, token) {
        if (anchor.sep24Url)
            return this.sep24Deposit(anchor, params, token);
        if (anchor.sep6Url)
            return this.sep6Deposit(anchor, params, token);
        throw new Error(`${anchor.homeDomain} supports neither SEP-6 nor SEP-24`);
    }
    async withdraw(anchor, params, token) {
        if (anchor.sep24Url)
            return this.sep24Withdraw(anchor, params, token);
        if (anchor.sep6Url)
            return this.sep6Withdraw(anchor, params, token);
        throw new Error(`${anchor.homeDomain} supports neither SEP-6 nor SEP-24`);
    }
    // ── Health ─────────────────────────────────────────────────────────────────
    async health() {
        const anchors = this.anchors.length ? this.anchors : await this.getAnchors();
        return (0, health_1.checkAllHealth)(anchors, this.config.timeoutMs);
    }
    async pickHealthyAnchor() {
        const anchors = this.anchors.length ? this.anchors : await this.getAnchors();
        return (0, health_1.pickHealthyAnchor)(anchors, this.config.timeoutMs);
    }
    async disconnect() {
        await this.cache.disconnect();
    }
}
exports.AnchorKit = AnchorKit;
//# sourceMappingURL=index.js.map