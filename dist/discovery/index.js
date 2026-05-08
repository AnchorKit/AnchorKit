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
exports.fetchAnchorInfo = fetchAnchorInfo;
exports.discoverAnchors = discoverAnchors;
const axios_1 = __importDefault(require("axios"));
const TOML = __importStar(require("toml"));
const MAINNET_PASSPHRASE = 'Public Global Stellar Network ; September 2015';
const TESTNET_PASSPHRASE = 'Test SDF Network ; September 2015';
async function fetchAnchorInfo(homeDomain, network = 'mainnet') {
    const url = `https://${homeDomain}/.well-known/stellar.toml`;
    const { data: raw } = await axios_1.default.get(url, {
        headers: { Accept: 'text/plain' },
        responseType: 'text',
    });
    const toml = TOML.parse(raw);
    const currencies = (toml['CURRENCIES'] ?? []).map((c) => ({
        code: c['code'],
        issuer: c['issuer'],
        depositEnabled: c['deposit_enabled'],
        withdrawEnabled: c['withdrawal_enabled'],
        sendEnabled: c['send_enabled'],
    }));
    return {
        homeDomain,
        networkPassphrase: toml['NETWORK_PASSPHRASE'] ??
            (network === 'testnet' ? TESTNET_PASSPHRASE : MAINNET_PASSPHRASE),
        signingKey: toml['SIGNING_KEY'],
        sep6Url: toml['TRANSFER_SERVER'],
        sep24Url: toml['TRANSFER_SERVER_SEP0024'],
        sep31Url: toml['DIRECT_PAYMENT_SERVER'],
        sep10Url: toml['WEB_AUTH_ENDPOINT'],
        currencies,
    };
}
async function discoverAnchors(homeDomains, network = 'mainnet') {
    const results = await Promise.allSettled(homeDomains.map((d) => fetchAnchorInfo(d, network)));
    return results
        .filter((r) => r.status === 'fulfilled')
        .map((r) => r.value);
}
//# sourceMappingURL=index.js.map