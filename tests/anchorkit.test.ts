import axios from 'axios';
import { AnchorKit } from '../src/client';
import { AnchorInfo } from '../src/types';
import { Cache } from '../src/cache';
import { checkHealth } from '../src/health';

const mockAnchor: AnchorInfo = {
  homeDomain: 'testanchor.stellar.org',
  networkPassphrase: 'Test SDF Network ; September 2015',
  signingKey: 'GCEZWKCA5VLDNRLN3RPRJMRZOX3Z6G5CHCGZS4BPQC4SPIN1ZF7QDNR',
  sep6Url: 'https://testanchor.stellar.org/sep6',
  sep24Url: 'https://testanchor.stellar.org/sep24',
  sep31Url: 'https://testanchor.stellar.org/sep31',
  sep10Url: 'https://testanchor.stellar.org/auth',
  currencies: [{ code: 'USDC', depositEnabled: true, withdrawEnabled: true }],
};

describe('Cache', () => {
  it('returns null when no Redis configured', async () => {
    const cache = new Cache();
    expect(await cache.get('key')).toBeNull();
    await expect(cache.set('key', { foo: 1 })).resolves.toBeUndefined();
  });
});

describe('AnchorKit — getAnchor', () => {
  it('fetches and returns anchor info', async () => {
    const tomlContent = `
NETWORK_PASSPHRASE = "Test SDF Network ; September 2015"
SIGNING_KEY = "GCEZWKCA5VLDNRLN3RPRJMRZOX3Z6G5CHCGZS4BPQC4SPIN1ZF7QDNR"
TRANSFER_SERVER = "https://testanchor.stellar.org/sep6"
TRANSFER_SERVER_SEP0024 = "https://testanchor.stellar.org/sep24"
WEB_AUTH_ENDPOINT = "https://testanchor.stellar.org/auth"

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
    expect(anchor.currencies[0].code).toBe('USDC');
    getSpy.mockRestore();
  });
});

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
});

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
});

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
});

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
});

describe('AnchorKit — errors', () => {
  it('throws when anchor does not support SEP-24 or SEP-6', async () => {
    const noSepAnchor: AnchorInfo = { ...mockAnchor, sep24Url: undefined, sep6Url: undefined };
    const kit = new AnchorKit({ network: 'testnet' });
    await expect(
      kit.deposit(noSepAnchor, { assetCode: 'USDC', account: 'GABC' }, 'jwt')
    ).rejects.toThrow('supports neither SEP-6 nor SEP-24');
  });
});
