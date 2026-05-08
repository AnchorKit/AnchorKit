"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.checkHealth = checkHealth;
exports.checkAllHealth = checkAllHealth;
exports.pickHealthyAnchor = pickHealthyAnchor;
const axios_1 = __importDefault(require("axios"));
async function checkHealth(anchor, timeoutMs = 5000) {
    const start = Date.now();
    const url = anchor.sep24Url ?? anchor.sep6Url ?? anchor.sep31Url;
    if (!url) {
        return {
            homeDomain: anchor.homeDomain,
            healthy: false,
            error: 'No service URL available',
            checkedAt: new Date().toISOString(),
        };
    }
    try {
        await axios_1.default.get(`${url}/info`, { timeout: timeoutMs });
        return {
            homeDomain: anchor.homeDomain,
            healthy: true,
            latencyMs: Date.now() - start,
            checkedAt: new Date().toISOString(),
        };
    }
    catch (err) {
        return {
            homeDomain: anchor.homeDomain,
            healthy: false,
            latencyMs: Date.now() - start,
            error: err instanceof Error ? err.message : String(err),
            checkedAt: new Date().toISOString(),
        };
    }
}
async function checkAllHealth(anchors, timeoutMs = 5000) {
    return Promise.all(anchors.map((a) => checkHealth(a, timeoutMs)));
}
/**
 * Returns the first healthy anchor from the list, or throws if none are healthy.
 * Anchors are checked in parallel; the fastest healthy one wins.
 */
async function pickHealthyAnchor(anchors, timeoutMs = 5000) {
    const statuses = await checkAllHealth(anchors, timeoutMs);
    const healthyIndex = statuses.findIndex((s) => s.healthy);
    if (healthyIndex === -1) {
        throw new Error('No healthy anchors available');
    }
    return anchors[healthyIndex];
}
//# sourceMappingURL=index.js.map