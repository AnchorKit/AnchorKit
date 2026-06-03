import axios from 'axios';
import { AnchorKit } from '../src/client';
import { AnchorInfo } from '../src/types';
import { Cache } from '../src/cache';
import { checkHealth } from '../src/health';
import { pollTransaction } from '../src/poll';
import {
  AnchorKitError,
  UnsupportedSepError,
  Sep10AuthError,
  TransactionPollTimeoutError,
} from '../src/errors';

const mockAnchor: AnchorInfo = {
  homeDomain: 'testanchor.stellar.org',
  networkPassphrase: 'Test SDF Network ; September 2015',
  signingKey: 'GCEZWKCA5VLDNRLN3RPRJMRZOX3Z6G5CHCGZS4BPQC4SPIN1ZF7QDNR',
  sep6Url: 'https://testanchor.stellar.org/sep6',
  sep24Url: 'https://testanchor.stellar.org/sep24',
  sep31Url: 'https://testanchor.stellar.org/sep31',
  sep38Url: 'https://testanchor.stellar.org/sep38',
  sep10Url: 'https://testanchor.stellar.org/auth',
  currencies: [{ code: 'USDC', depositEnabled: true, withdrawEnabled: true }],
};

// ── Cache ─────────────────────────────────────────────────────────────────────

describe('Cache', () => {
  it('returns null when no Redis configured', async () => {
    const cache = new Cache();
    expect(await cache.get('key')).toBeNull();
    await expect(cache.set('key', { foo: 1 })).resolves.toBeUndefined();
  });

  it('del is a no-op when no Redis configured', async () => {
    const cache = new Cache();
    await expect(cache.del('key')).resolves.toBeUndefined();
  });

  it('disconnect is a no-op when no Redis configured', async () => {
    const cache = new Cache();
    await expect(cache.disconnect()).resolves.toBeUndefined();
  });
});

// ── Anchor discovery ──────────────────────────────────────────────────────────

describe('AnchorKit — getAnchor', () => {
  it('fetches and returns anchor info', async () => {
    const tomlContent = `
NETWORK_PASSPHRASE = "Test SDF Network ; September 2015"
SIGNING_KEY = "GCEZWKCA5VLDNRLN3RPRJMRZOX3Z6G5CHCGZS4BPQC4SPIN1ZF7QDNR"
TRANSFER_SERVER = "https://testanchor.stellar.org/sep6"
TRANSFER_SERVER_SEP0024 = "https://testanchor.stellar.org/sep24"
WEB_AUTH_ENDPOINT = "https://testanchor.stellar.org/auth"
ANCHOR_QUOTE_SERVER = "https://testanchor.stellar.org/sep38"

[[CURRENCIES]]
code = "USDC"
issuer = "GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5"
deposit_enabled = true
withdrawal_enabled = true
`;
    const getSpy = jest.spyOn(axios, 'get').mockResolvedValueOnce({ data: tomlContent });

    const kit = new AnchorKit({ network: 'testnet' });
    const anchor = await kit.getAnchor('testanchor.stellar.org');

    expect(anchor.homeDomain).toBe('testanchor.stellar.org');
    expect(anchor.sep6Url).toBe('https://testanchor.stellar.org/sep6');
    expect(anchor.sep38Url).toBe('https://testanchor.stellar.org/sep38');
    expect(anchor.currencies[0].code).toBe('USDC');
    getSpy.mockRestore();
  });

  it('caches anchor info on repeated calls', async () => {
    const tomlContent = `
NETWORK_PASSPHRASE = "Test SDF Network ; September 2015"
SIGNING_KEY = "GCEZWKCA5VLDNRLN3RPRJMRZOX3Z6G5CHCGZS4BPQC4SPIN1ZF7QDNR"
[[CURRENCIES]]
code = "USDC"
`;
    const getSpy = jest.spyOn(axios, 'get').mockResolvedValue({ data: tomlContent });
    const kit = new AnchorKit({ network: 'testnet' });
    await kit.getAnchor('testanchor.stellar.org');
    await kit.getAnchor('testanchor.stellar.org');
    // Second call should use in-process cache, still only 1 HTTP call
    expect(getSpy).toHaveBeenCalledTimes(1);
    getSpy.mockRestore();
  });
});

// ── SEP-24 deposit ────────────────────────────────────────────────────────────

describe('AnchorKit — deposit (SEP-24 preferred)', () => {
  it('calls SEP-24 when sep24Url is present', async () => {
    const postSpy = jest.spyOn(axios, 'post').mockResolvedValueOnce({
      data: { type: 'interactive_customer_info_needed', url: 'https://example.com/kyc', id: 'tx1' },
    });

    const kit = new AnchorKit({ network: 'testnet' });
    const result = await kit.deposit(
      mockAnchor,
      { assetCode: 'USDC', account: 'GABC' },
      'jwt-token'
    );

    expect(postSpy).toHaveBeenCalledWith(
      expect.stringContaining('sep24'),
      expect.objectContaining({ asset_code: 'USDC' }),
      expect.objectContaining({ headers: { Authorization: 'Bearer jwt-token' } })
    );
    expect(result.url).toBe('https://example.com/kyc');
    postSpy.mockRestore();
  });
});

// ── SEP-6 fallback ────────────────────────────────────────────────────────────

describe('AnchorKit — deposit (SEP-6 fallback)', () => {
  it('falls back to SEP-6 when no sep24Url', async () => {
    const sep6OnlyAnchor: AnchorInfo = { ...mockAnchor, sep24Url: undefined };
    const getSpy = jest.spyOn(axios, 'get').mockResolvedValueOnce({
      data: { how: 'wire transfer', id: 'tx2' },
    });

    const kit = new AnchorKit({ network: 'testnet' });
    const result = await kit.deposit(sep6OnlyAnchor, { assetCode: 'USDC', account: 'GABC' }, 'jwt');

    expect(getSpy).toHaveBeenCalledWith(
      expect.stringContaining('sep6/deposit'),
      expect.any(Object)
    );
    expect(result.how).toBe('wire transfer');
    getSpy.mockRestore();
  });

  it('fetches transactions list via SEP-6', async () => {
    const getSpy = jest.spyOn(axios, 'get').mockResolvedValueOnce({
      data: {
        transactions: [
          { id: 'tx1', kind: 'deposit', status: 'completed', asset_code: 'USDC', started_at: '2024-01-01T00:00:00Z' },
        ],
      },
    });

    const kit = new AnchorKit({ network: 'testnet' });
    const txs = await kit.sep6Transactions(mockAnchor, 'USDC', 'jwt');
    expect(txs).toHaveLength(1);
    expect(txs[0].id).toBe('tx1');
    getSpy.mockRestore();
  });

  it('fetches a single transaction via SEP-6', async () => {
    const getSpy = jest.spyOn(axios, 'get').mockResolvedValueOnce({
      data: { transaction: { id: 'tx1', kind: 'deposit', status: 'completed', asset_code: 'USDC', started_at: '2024-01-01T00:00:00Z' } },
    });

    const kit = new AnchorKit({ network: 'testnet' });
    const tx = await kit.sep6Transaction(mockAnchor, 'tx1', 'jwt');
    expect(tx.id).toBe('tx1');
    getSpy.mockRestore();
  });
});

// ── SEP-24 withdraw ───────────────────────────────────────────────────────────

describe('AnchorKit — withdraw', () => {
  it('calls SEP-24 withdraw', async () => {
    const postSpy = jest.spyOn(axios, 'post').mockResolvedValueOnce({
      data: { type: 'interactive_customer_info_needed', url: 'https://example.com/withdraw', id: 'tx3', account_id: 'GABC' },
    });

    const kit = new AnchorKit({ network: 'testnet' });
    const result = await kit.withdraw(mockAnchor, { assetCode: 'USDC', account: 'GABC' }, 'jwt');
    expect(result.url).toBe('https://example.com/withdraw');
    postSpy.mockRestore();
  });

  it('fetches transactions list via SEP-24', async () => {
    const getSpy = jest.spyOn(axios, 'get').mockResolvedValueOnce({
      data: {
        transactions: [
          { id: 'tx2', kind: 'withdrawal', status: 'pending_anchor', asset_code: 'USDC', started_at: '2024-01-01T00:00:00Z' },
        ],
      },
    });

    const kit = new AnchorKit({ network: 'testnet' });
    const txs = await kit.sep24Transactions(mockAnchor, 'USDC', 'jwt');
    expect(txs[0].status).toBe('pending_anchor');
    getSpy.mockRestore();
  });

  it('fetches a single transaction via SEP-24', async () => {
    const getSpy = jest.spyOn(axios, 'get').mockResolvedValueOnce({
      data: { transaction: { id: 'tx2', kind: 'withdrawal', status: 'completed', asset_code: 'USDC', started_at: '2024-01-01T00:00:00Z' } },
    });

    const kit = new AnchorKit({ network: 'testnet' });
    const tx = await kit.sep24Transaction(mockAnchor, 'tx2', 'jwt');
    expect(tx.status).toBe('completed');
    getSpy.mockRestore();
  });
});

// ── Health ────────────────────────────────────────────────────────────────────

describe('AnchorKit — health', () => {
  it('returns healthy status when /info responds 200', async () => {
    const getSpy = jest.spyOn(axios, 'get').mockResolvedValueOnce({ status: 200, data: {} });

    const status = await checkHealth(mockAnchor, 3000);
    expect(status.healthy).toBe(true);
    expect(status.homeDomain).toBe('testanchor.stellar.org');
    getSpy.mockRestore();
  });

  it('returns unhealthy status on network error', async () => {
    const getSpy = jest.spyOn(axios, 'get').mockRejectedValueOnce(new Error('ECONNREFUSED'));

    const status = await checkHealth(mockAnchor, 3000);
    expect(status.healthy).toBe(false);
    expect(status.error).toContain('ECONNREFUSED');
    getSpy.mockRestore();
  });

  it('returns unhealthy when anchor has no service URL', async () => {
    const noUrlAnchor: AnchorInfo = { ...mockAnchor, sep6Url: undefined, sep24Url: undefined, sep31Url: undefined };
    const status = await checkHealth(noUrlAnchor, 3000);
    expect(status.healthy).toBe(false);
    expect(status.error).toContain('No service URL');
  });

  it('includes latencyMs on healthy response', async () => {
    const getSpy = jest.spyOn(axios, 'get').mockResolvedValueOnce({ status: 200, data: {} });
    const status = await checkHealth(mockAnchor, 3000);
    expect(status.latencyMs).toBeGreaterThanOrEqual(0);
    getSpy.mockRestore();
  });
});

// ── SEP-31 ────────────────────────────────────────────────────────────────────

describe('AnchorKit — sep31Send', () => {
  it('posts to sep31 transactions endpoint', async () => {
    const postSpy = jest.spyOn(axios, 'post').mockResolvedValueOnce({
      data: {
        id: 'sep31-tx1',
        stellar_account_id: 'GABC',
        stellar_memo: '12345',
        stellar_memo_type: 'id',
      },
    });

    const kit = new AnchorKit({ network: 'testnet' });
    const result = await kit.sep31Send(
      mockAnchor,
      {
        assetCode: 'USDC',
        assetIssuer: 'GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5',
        amount: '100',
        destinationAccount: 'GDEST',
      },
      'jwt'
    );

    expect(result.id).toBe('sep31-tx1');
    expect(result.stellar_memo).toBe('12345');
    postSpy.mockRestore();
  });

  it('fetches a sep31 transaction by id', async () => {
    const getSpy = jest.spyOn(axios, 'get').mockResolvedValueOnce({
      data: { transaction: { id: 'sep31-tx1', kind: 'send', status: 'completed', asset_code: 'USDC', started_at: '2024-01-01T00:00:00Z' } },
    });

    const kit = new AnchorKit({ network: 'testnet' });
    const tx = await kit.sep31Transaction(mockAnchor, 'sep31-tx1', 'jwt');
    expect(tx.id).toBe('sep31-tx1');
    getSpy.mockRestore();
  });
});

// ── SEP-38 ────────────────────────────────────────────────────────────────────

describe('AnchorKit — sep38 (Quote API)', () => {
  it('fetches sep38 info', async () => {
    const getSpy = jest.spyOn(axios, 'get').mockResolvedValueOnce({
      data: {
        assets: [
          { asset: 'stellar:USDC:GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5' },
          { asset: 'iso4217:USD' },
        ],
      },
    });

    const kit = new AnchorKit({ network: 'testnet' });
    const info = await kit.sep38Info(mockAnchor);
    expect(info.assets).toHaveLength(2);
    getSpy.mockRestore();
  });

  it('gets a price quote', async () => {
    const getSpy = jest.spyOn(axios, 'get').mockResolvedValueOnce({
      data: {
        total_price: '1.05',
        price: '1.04',
        sell_amount: '100',
        buy_amount: '96.15',
        fee: { total: '4', asset: 'iso4217:USD' },
      },
    });

    const kit = new AnchorKit({ network: 'testnet' });
    const price = await kit.sep38GetPrice(mockAnchor, {
      sellAsset: 'stellar:USDC:GBBD47...',
      buyAsset: 'iso4217:USD',
      sellAmount: '100',
    });
    expect(price.total_price).toBe('1.05');
    getSpy.mockRestore();
  });

  it('creates a firm quote', async () => {
    const postSpy = jest.spyOn(axios, 'post').mockResolvedValueOnce({
      data: {
        id: 'quote-1',
        expires_at: '2024-12-31T00:00:00Z',
        total_price: '1.05',
        price: '1.04',
        sell_amount: '100',
        buy_amount: '96.15',
        fee: { total: '4', asset: 'iso4217:USD' },
      },
    });

    const kit = new AnchorKit({ network: 'testnet' });
    const quote = await kit.sep38PostQuote(
      mockAnchor,
      { sellAsset: 'stellar:USDC:GBBD47...', buyAsset: 'iso4217:USD', sellAmount: '100' },
      'jwt'
    );
    expect(quote.id).toBe('quote-1');
    expect(quote.expires_at).toBe('2024-12-31T00:00:00Z');
    postSpy.mockRestore();
  });

  it('fetches an existing quote by id', async () => {
    const getSpy = jest.spyOn(axios, 'get').mockResolvedValueOnce({
      data: {
        id: 'quote-1',
        expires_at: '2024-12-31T00:00:00Z',
        total_price: '1.05',
        price: '1.04',
        sell_amount: '100',
        buy_amount: '96.15',
        fee: { total: '4', asset: 'iso4217:USD' },
      },
    });

    const kit = new AnchorKit({ network: 'testnet' });
    const quote = await kit.sep38GetQuote(mockAnchor, 'quote-1', 'jwt');
    expect(quote.id).toBe('quote-1');
    getSpy.mockRestore();
  });

  it('throws UnsupportedSepError when sep38Url is missing', async () => {
    const noSep38: AnchorInfo = { ...mockAnchor, sep38Url: undefined };
    const kit = new AnchorKit({ network: 'testnet' });
    await expect(kit.sep38Info(noSep38)).rejects.toThrow(UnsupportedSepError);
  });
});

// ── pollTransaction ───────────────────────────────────────────────────────────

describe('pollTransaction', () => {
  it('resolves immediately on a terminal status', async () => {
    const getSpy = jest.spyOn(axios, 'get').mockResolvedValueOnce({
      data: { transaction: { id: 'tx1', kind: 'deposit', status: 'completed', asset_code: 'USDC', started_at: '2024-01-01T00:00:00Z' } },
    });

    const tx = await pollTransaction(mockAnchor, 'tx1', 'jwt', '24', { intervalMs: 50 });
    expect(tx.status).toBe('completed');
    getSpy.mockRestore();
  });

  it('polls until terminal status is reached', async () => {
    const getSpy = jest.spyOn(axios, 'get')
      .mockResolvedValueOnce({ data: { transaction: { id: 'tx1', kind: 'deposit', status: 'pending_anchor', asset_code: 'USDC', started_at: '2024-01-01T00:00:00Z' } } })
      .mockResolvedValueOnce({ data: { transaction: { id: 'tx1', kind: 'deposit', status: 'pending_stellar', asset_code: 'USDC', started_at: '2024-01-01T00:00:00Z' } } })
      .mockResolvedValueOnce({ data: { transaction: { id: 'tx1', kind: 'deposit', status: 'completed', asset_code: 'USDC', started_at: '2024-01-01T00:00:00Z' } } });

    const statusChanges: string[] = [];
    const tx = await pollTransaction(mockAnchor, 'tx1', 'jwt', '24', {
      intervalMs: 10,
      onStatusChange: (s) => statusChanges.push(s),
    });
    expect(tx.status).toBe('completed');
    expect(statusChanges).toEqual(['pending_anchor', 'pending_stellar', 'completed']);
    getSpy.mockRestore();
  });

  it('throws TransactionPollTimeoutError when timeout exceeded', async () => {
    jest.spyOn(axios, 'get').mockResolvedValue({
      data: { transaction: { id: 'tx1', kind: 'deposit', status: 'pending_anchor', asset_code: 'USDC', started_at: '2024-01-01T00:00:00Z' } },
    });

    await expect(
      pollTransaction(mockAnchor, 'tx1', 'jwt', '24', { intervalMs: 10, timeoutMs: 50 })
    ).rejects.toThrow(TransactionPollTimeoutError);

    jest.restoreAllMocks();
  });

  it('polls SEP-6 transaction', async () => {
    const getSpy = jest.spyOn(axios, 'get').mockResolvedValueOnce({
      data: { transaction: { id: 'tx1', kind: 'deposit', status: 'refunded', asset_code: 'USDC', started_at: '2024-01-01T00:00:00Z' } },
    });

    const tx = await pollTransaction(mockAnchor, 'tx1', 'jwt', '6', { intervalMs: 10 });
    expect(tx.status).toBe('refunded');
    getSpy.mockRestore();
  });

  it('polls SEP-31 transaction', async () => {
    const getSpy = jest.spyOn(axios, 'get').mockResolvedValueOnce({
      data: { transaction: { id: 'tx1', kind: 'send', status: 'error', asset_code: 'USDC', started_at: '2024-01-01T00:00:00Z' } },
    });

    const tx = await pollTransaction(mockAnchor, 'tx1', 'jwt', '31', { intervalMs: 10 });
    expect(tx.status).toBe('error');
    getSpy.mockRestore();
  });
});

// ── Error types ───────────────────────────────────────────────────────────────

describe('AnchorKit — errors', () => {
  it('throws UnsupportedSepError when anchor does not support SEP-24 or SEP-6', async () => {
    const noSepAnchor: AnchorInfo = { ...mockAnchor, sep24Url: undefined, sep6Url: undefined };
    const kit = new AnchorKit({ network: 'testnet' });
    await expect(
      kit.deposit(noSepAnchor, { assetCode: 'USDC', account: 'GABC' }, 'jwt')
    ).rejects.toThrow(UnsupportedSepError);
  });

  it('UnsupportedSepError is an instance of AnchorKitError', () => {
    const err = new UnsupportedSepError('example.com', 'SEP-10');
    expect(err).toBeInstanceOf(AnchorKitError);
    expect(err).toBeInstanceOf(UnsupportedSepError);
    expect(err.name).toBe('UnsupportedSepError');
  });

  it('Sep10AuthError is an instance of AnchorKitError', () => {
    const err = new Sep10AuthError('invalid challenge');
    expect(err).toBeInstanceOf(AnchorKitError);
    expect(err.message).toContain('SEP-10 authentication failed');
  });

  it('TransactionPollTimeoutError is an instance of AnchorKitError', () => {
    const err = new TransactionPollTimeoutError('tx1', 5000);
    expect(err).toBeInstanceOf(AnchorKitError);
    expect(err.message).toContain('tx1');
  });

  it('throws UnsupportedSepError for sep6 when sep6Url is missing', async () => {
    const noSep6: AnchorInfo = { ...mockAnchor, sep6Url: undefined };
    const kit = new AnchorKit({ network: 'testnet' });
    await expect(kit.sep6Deposit(noSep6, { assetCode: 'USDC', account: 'GABC' }))
      .rejects.toThrow(UnsupportedSepError);
  });

  it('throws UnsupportedSepError for sep31 when sep31Url is missing', async () => {
    const noSep31: AnchorInfo = { ...mockAnchor, sep31Url: undefined };
    const kit = new AnchorKit({ network: 'testnet' });
    await expect(kit.sep31Send(noSep31, {
      assetCode: 'USDC', assetIssuer: 'GBBD...', amount: '10', destinationAccount: 'GDEST',
    }, 'jwt')).rejects.toThrow(UnsupportedSepError);
  });
});
