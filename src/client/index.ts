import * as StellarSdk from '@stellar/stellar-sdk';
import { AnchorKitConfig, AnchorInfo, DepositParams, DepositResult, WithdrawParams, WithdrawResult, Sep31SendParams, Sep31SendResult, HealthStatus, Transaction } from '../types';
import { discoverAnchors, fetchAnchorInfo } from '../discovery';
import { getToken } from '../sep10';
import { sep6Deposit, sep6Withdraw, sep6Transaction, sep6Transactions } from '../sep6';
import { sep24Deposit, sep24Withdraw, sep24Transaction, sep24Transactions } from '../sep24';
import { sep31Send, sep31Transaction } from '../sep31';
import { checkAllHealth, pickHealthyAnchor } from '../health';
import { Cache } from '../cache';

export class AnchorKit {
  private config: AnchorKitConfig;
  private cache: Cache;
  private anchors: AnchorInfo[] = [];

  constructor(config: AnchorKitConfig) {
    this.config = config;
    this.cache = new Cache(config.redisUrl, config.cacheTtlSeconds ?? 300);
  }

  /** Load and cache anchor info for all configured home domains */
  async getAnchors(): Promise<AnchorInfo[]> {
    const cacheKey = `anchors:${this.config.network}`;
    const cached = await this.cache.get<AnchorInfo[]>(cacheKey);
    if (cached) {
      this.anchors = cached;
      return cached;
    }

    const domains = this.config.homeDomains ?? [];
    this.anchors = await discoverAnchors(domains, this.config.network);
    await this.cache.set(cacheKey, this.anchors);
    return this.anchors;
  }

  /** Fetch a single anchor by home domain */
  async getAnchor(homeDomain: string): Promise<AnchorInfo> {
    const cacheKey = `anchor:${homeDomain}`;
    const cached = await this.cache.get<AnchorInfo>(cacheKey);
    if (cached) return cached;

    const info = await fetchAnchorInfo(homeDomain, this.config.network);
    await this.cache.set(cacheKey, info);
    return info;
  }

  /** Get a SEP-10 JWT for the given account/keypair against an anchor */
  async auth(anchor: AnchorInfo, keypair: StellarSdk.Keypair): Promise<string> {
    if (!anchor.sep10Url) throw new Error(`${anchor.homeDomain} does not support SEP-10`);
    return getToken(anchor.sep10Url, keypair.publicKey(), keypair, anchor.networkPassphrase);
  }

  // ── SEP-6 ──────────────────────────────────────────────────────────────────

  async sep6Deposit(anchor: AnchorInfo, params: DepositParams, token?: string): Promise<DepositResult> {
    if (!anchor.sep6Url) throw new Error(`${anchor.homeDomain} does not support SEP-6`);
    return sep6Deposit(anchor.sep6Url, params, token);
  }

  async sep6Withdraw(anchor: AnchorInfo, params: WithdrawParams, token?: string): Promise<WithdrawResult> {
    if (!anchor.sep6Url) throw new Error(`${anchor.homeDomain} does not support SEP-6`);
    return sep6Withdraw(anchor.sep6Url, params, token);
  }

  async sep6Transaction(anchor: AnchorInfo, id: string, token?: string): Promise<Transaction> {
    if (!anchor.sep6Url) throw new Error(`${anchor.homeDomain} does not support SEP-6`);
    return sep6Transaction(anchor.sep6Url, id, token);
  }

  async sep6Transactions(anchor: AnchorInfo, assetCode: string, token?: string): Promise<Transaction[]> {
    if (!anchor.sep6Url) throw new Error(`${anchor.homeDomain} does not support SEP-6`);
    return sep6Transactions(anchor.sep6Url, assetCode, token);
  }

  // ── SEP-24 ─────────────────────────────────────────────────────────────────

  async sep24Deposit(anchor: AnchorInfo, params: DepositParams, token: string): Promise<DepositResult> {
    if (!anchor.sep24Url) throw new Error(`${anchor.homeDomain} does not support SEP-24`);
    return sep24Deposit(anchor.sep24Url, params, token);
  }

  async sep24Withdraw(anchor: AnchorInfo, params: WithdrawParams, token: string): Promise<WithdrawResult> {
    if (!anchor.sep24Url) throw new Error(`${anchor.homeDomain} does not support SEP-24`);
    return sep24Withdraw(anchor.sep24Url, params, token);
  }

  async sep24Transaction(anchor: AnchorInfo, id: string, token: string): Promise<Transaction> {
    if (!anchor.sep24Url) throw new Error(`${anchor.homeDomain} does not support SEP-24`);
    return sep24Transaction(anchor.sep24Url, id, token);
  }

  async sep24Transactions(anchor: AnchorInfo, assetCode: string, token: string): Promise<Transaction[]> {
    if (!anchor.sep24Url) throw new Error(`${anchor.homeDomain} does not support SEP-24`);
    return sep24Transactions(anchor.sep24Url, assetCode, token);
  }

  // ── SEP-31 ─────────────────────────────────────────────────────────────────

  async sep31Send(anchor: AnchorInfo, params: Sep31SendParams, token: string): Promise<Sep31SendResult> {
    if (!anchor.sep31Url) throw new Error(`${anchor.homeDomain} does not support SEP-31`);
    return sep31Send(anchor.sep31Url, params, token);
  }

  async sep31Transaction(anchor: AnchorInfo, id: string, token: string): Promise<Transaction> {
    if (!anchor.sep31Url) throw new Error(`${anchor.homeDomain} does not support SEP-31`);
    return sep31Transaction(anchor.sep31Url, id, token);
  }

  // ── Unified deposit (SEP-24 preferred, fallback to SEP-6) ──────────────────

  async deposit(anchor: AnchorInfo, params: DepositParams, token: string): Promise<DepositResult> {
    if (anchor.sep24Url) return this.sep24Deposit(anchor, params, token);
    if (anchor.sep6Url) return this.sep6Deposit(anchor, params, token);
    throw new Error(`${anchor.homeDomain} supports neither SEP-6 nor SEP-24`);
  }

  async withdraw(anchor: AnchorInfo, params: WithdrawParams, token: string): Promise<WithdrawResult> {
    if (anchor.sep24Url) return this.sep24Withdraw(anchor, params, token);
    if (anchor.sep6Url) return this.sep6Withdraw(anchor, params, token);
    throw new Error(`${anchor.homeDomain} supports neither SEP-6 nor SEP-24`);
  }

  // ── Health ─────────────────────────────────────────────────────────────────

  async health(): Promise<HealthStatus[]> {
    const anchors = this.anchors.length ? this.anchors : await this.getAnchors();
    return checkAllHealth(anchors, this.config.timeoutMs);
  }

  async pickHealthyAnchor(): Promise<AnchorInfo> {
    const anchors = this.anchors.length ? this.anchors : await this.getAnchors();
    return pickHealthyAnchor(anchors, this.config.timeoutMs);
  }

  async disconnect(): Promise<void> {
    await this.cache.disconnect();
  }
}
