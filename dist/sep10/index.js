"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authenticate = authenticate;
exports.getToken = getToken;
const axios_1 = __importDefault(require("axios"));
const StellarSdk = __importStar(require("@stellar/stellar-sdk"));
/**
 * Performs SEP-10 Web Authentication against an anchor's auth endpoint.
 * Returns a JWT token for use in subsequent SEP-6/24/31 requests.
 */
async function authenticate(sep10Url, account, keypair, networkPassphrase) {
    // Step 1: GET challenge transaction
    const { data } = await axios_1.default.get(sep10Url, { params: { account } });
    const serverPassphrase = data.network_passphrase ?? networkPassphrase;
    // Step 2: Parse and sign the challenge transaction
    const tx = StellarSdk.TransactionBuilder.fromXDR(data.transaction, serverPassphrase);
    if (!(tx instanceof StellarSdk.Transaction)) {
        throw new Error('SEP-10: expected a Transaction, got FeeBumpTransaction');
    }
    tx.sign(keypair);
    // Step 3: POST signed transaction to get JWT
    const { data: tokenData } = await axios_1.default.post(sep10Url, {
        transaction: tx.toXDR(),
    });
    // Decode expiry from JWT payload (no verification needed client-side)
    const payload = JSON.parse(Buffer.from(tokenData.token.split('.')[1], 'base64').toString());
    const expiresAt = (payload.exp ?? Math.floor(Date.now() / 1000) + 86400) * 1000;
    return { token: tokenData.token, expiresAt };
}
/** Simple in-memory token cache keyed by `${sep10Url}:${account}` */
const tokenCache = new Map();
async function getToken(sep10Url, account, keypair, networkPassphrase) {
    const key = `${sep10Url}:${account}`;
    const cached = tokenCache.get(key);
    if (cached && cached.expiresAt > Date.now() + 60000) {
        return cached.token;
    }
    const token = await authenticate(sep10Url, account, keypair, networkPassphrase);
    tokenCache.set(key, token);
    return token.token;
}
//# sourceMappingURL=index.js.map