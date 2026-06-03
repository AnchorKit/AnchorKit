import * as StellarSdk from '@stellar/stellar-sdk';
import { AnchorKitConfig, AnchorInfo, DepositParams, DepositResult, WithdrawParams, WithdrawResult, Sep31SendParams, Sep31SendResult, HealthStatus, Transaction } from '../types';
import { UnsupportedSepError, NoHealthyAnchorError } from '../errors';
import { discoverAnchors, fetchAnchorInfo } from '../discovery';
import { getToken } from '../sep10';
import { sep6Deposit, sep6Withdraw, sep6Transaction, sep6Transactions } from '../sep6';
import { sep24Deposit, sep24Withdraw, sep24Transaction, sep24Transactions } from '../sep24';
import { sep31Send, sep31Transaction } from '../sep31';
import { sep38Info, sep38GetPrice, sep38PostQuote, sep38GetQuote, Sep38Info, Sep38PriceParams, Sep38QuoteParams, Sep38Price, Sep38Quote } from '../sep38';
import { pollTransaction, PollOptions } from '../poll';
import { checkAllHealth, pickHealthyAnchor } from '../health';
import { Cache } from '../cache';

/** Unified client for discovering anchors and calling supported Stellar SEP flows. */
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

  /** Starts a SEP-6 deposit flow for `anchor` using the provided deposit parameters. */
  async sep6Deposit(anchor: AnchorInfo, params: DepositParams, token?: string): Promise<DepositResult> {
    if (!anchor.sep6Url) throw new UnsupportedSepError(anchor.homeDomain, 'SEP-6');
    return sep6Deposit(anchor.sep6Url, params, token);
  }

  /** Starts a SEP-6 withdrawal flow for `anchor` using the provided withdrawal parameters. */
  async sep6Withdraw(anchor: AnchorInfo, params: WithdrawParams, token?: string): Promise<WithdrawResult> {
    if (!anchor.sep6Url) throw new UnsupportedSepError(anchor.homeDomain, 'SEP-6');
    return sep6Withdraw(anchor.sep6Url, params, token);
  }

  /** Fetches a single SEP-6 transaction by anchor transaction ID. */
  async sep6Transaction(anchor: AnchorInfo, id: string, token?: string): Promise<Transaction> {
    if (!anchor.sep6Url) throw new UnsupportedSepError(anchor.homeDomain, 'SEP-6');
    return sep6Transaction(anchor.sep6Url, id, token);
  }

  /** Lists SEP-6 transactions for an asset code on the selected anchor. */
  async sep6Transactions(anchor: AnchorInfo, assetCode: string, token?: string): Promise<Transaction[]> {
    if (!anchor.sep6Url) throw new UnsupportedSepError(anchor.homeDomain, 'SEP-6');
    return sep6Transactions(anchor.sep6Url, assetCode, token);
  }

  // ── SEP-24 ─────────────────────────────────────────────────────────────────

  /** Starts an interactive SEP-24 deposit flow for `anchor`. */
  async sep24Deposit(anchor: AnchorInfo, params: DepositParams, token: string): Promise<DepositResult> {
    if (!anchor.sep24Url) throw new UnsupportedSepError(anchor.homeDomain, 'SEP-24');
    return sep24Deposit(anchor.sep24Url, params, token);
  }

  /** Starts an interactive SEP-24 withdrawal flow for `anchor`. */
  async sep24Withdraw(anchor: AnchorInfo, params: WithdrawParams, token: string): Promise<WithdrawResult> {
    if (!anchor.sep24Url) throw new UnsupportedSepError(anchor.homeDomain, 'SEP-24');
    return sep24Withdraw(anchor.sep24Url, params, token);
  }

  /** Fetches a single SEP-24 transaction by anchor transaction ID. */
  async sep24Transaction(anchor: AnchorInfo, id: string, token: string): Promise<Transaction> {
    if (!anchor.sep24Url) throw new UnsupportedSepError(anchor.homeDomain, 'SEP-24');
    return sep24Transaction(anchor.sep24Url, id, token);
  }

  /** Lists SEP-24 transactions for an asset code on the selected anchor. */
  async sep24Transactions(anchor: AnchorInfo, assetCode: string, token: string): Promise<Transaction[]> {
    if (!anchor.sep24Url) throw new UnsupportedSepError(anchor.homeDomain, 'SEP-24');
    return sep24Transactions(anchor.sep24Url, assetCode, token);
  }

  // ── SEP-31 ─────────────────────────────────────────────────────────────────

  /** Starts a SEP-31 receiver-driven payment flow for `anchor`. */
  async sep31Send(anchor: AnchorInfo, params: Sep31SendParams, token: string): Promise<Sep31SendResult> {
    if (!anchor.sep31Url) throw new UnsupportedSepError(anchor.homeDomain, 'SEP-31');
    return sep31Send(anchor.sep31Url, params, token);
  }

  /** Fetches a single SEP-31 transaction by anchor transaction ID. */
  async sep31Transaction(anchor: AnchorInfo, id: string, token: string): Promise<Transaction> {
    if (!anchor.sep31Url) throw new UnsupportedSepError(anchor.homeDomain, 'SEP-31');
    return sep31Transaction(anchor.sep31Url, id, token);
  }

  // ── SEP-38 ─────────────────────────────────────────────────────────────────

  /** Fetches SEP-38 exchange metadata for the selected anchor. */
  async sep38Info(anchor: AnchorInfo, token?: string): Promise<Sep38Info> {
    if (!anchor.sep38Url) throw new UnsupportedSepError(anchor.homeDomain, 'SEP-38');
    return sep38Info(anchor.sep38Url, token);
  }

  /** Requests an indicative SEP-38 exchange price from the selected anchor. */
  async sep38GetPrice(anchor: AnchorInfo, params: Sep38PriceParams, token?: string): Promise<Sep38Price> {
    if (!anchor.sep38Url) throw new UnsupportedSepError(anchor.homeDomain, 'SEP-38');
    return sep38GetPrice(anchor.sep38Url, params, token);
  }

  /** Creates a firm SEP-38 quote from the selected anchor. */
  async sep38PostQuote(anchor: AnchorInfo, params: Sep38QuoteParams, token: string): Promise<Sep38Quote> {
    if (!anchor.sep38Url) throw new UnsupportedSepError(anchor.homeDomain, 'SEP-38');
    return sep38PostQuote(anchor.sep38Url, params, token);
  }

  /** Fetches an existing SEP-38 quote by quote ID. */
  async sep38GetQuote(anchor: AnchorInfo, id: string, token: string): Promise<Sep38Quote> {
    if (!anchor.sep38Url) throw new UnsupportedSepError(anchor.homeDomain, 'SEP-38');
    return sep38GetQuote(anchor.sep38Url, id, token);
  }

  // ── Unified deposit (SEP-24 preferred, fallback to SEP-6) ──────────────────

  /** Starts a deposit flow, preferring SEP-24 and falling back to SEP-6. */
  async deposit(anchor: AnchorInfo, params: DepositParams, token: string): Promise<DepositResult> {
    if (anchor.sep24Url) return this.sep24Deposit(anchor, params, token);
    if (anchor.sep6Url) return this.sep6Deposit(anchor, params, token);
    throw new UnsupportedSepError(anchor.homeDomain, 'SEP-6 nor SEP-24');
  }

  /** Starts a withdrawal flow, preferring SEP-24 and falling back to SEP-6. */
  async withdraw(anchor: AnchorInfo, params: WithdrawParams, token: string): Promise<WithdrawResult> {
    if (anchor.sep24Url) return this.sep24Withdraw(anchor, params, token);
    if (anchor.sep6Url) return this.sep6Withdraw(anchor, params, token);
    throw new UnsupportedSepError(anchor.homeDomain, 'SEP-6 nor SEP-24');
  }

  // ── Transaction polling ────────────────────────────────────────────────────

  /** Polls a SEP transaction until it reaches a terminal status. */
  async pollTransaction(
    anchor: AnchorInfo,
    id: string,
    token: string,
    sep: '6' | '24' | '31' = '24',
    options?: PollOptions
  ): Promise<Transaction> {
    return pollTransaction(anchor, id, token, sep, options);
  }

  // ── Health ─────────────────────────────────────────────────────────────────

  /** Checks health for all configured anchors, loading anchor metadata if needed. */
  async health(): Promise<HealthStatus[]> {
    const anchors = this.anchors.length ? this.anchors : await this.getAnchors();
    return checkAllHealth(anchors, this.config.timeoutMs);
  }

  /** Returns the first healthy configured anchor or throws when none are available. */
  async pickHealthyAnchor(): Promise<AnchorInfo> {
    const anchors = this.anchors.length ? this.anchors : await this.getAnchors();
    const result = await pickHealthyAnchor(anchors, this.config.timeoutMs).catch(() => {
      throw new NoHealthyAnchorError();
    });
    return result;
  }

  /** Closes the underlying cache connection used by the client. */
  async disconnect(): Promise<void> {
    await this.cache.disconnect();
  }
}
