import axios from 'axios';
import * as StellarSdk from '@stellar/stellar-sdk';

export interface Sep10Token {
  token: string;
  expiresAt: number; // unix ms
}

/**
 * Performs SEP-10 Web Authentication against an anchor's auth endpoint.
 * Returns a JWT token for use in subsequent SEP-6/24/31 requests.
 */
export async function authenticate(
  sep10Url: string,
  account: string,
  keypair: StellarSdk.Keypair,
  networkPassphrase: string
): Promise<Sep10Token> {
  // Step 1: GET challenge transaction
  const { data } = await axios.get<{ transaction: string; network_passphrase: string }>(
    sep10Url,
    { params: { account } }
  );

  const serverPassphrase = data.network_passphrase ?? networkPassphrase;

  // Step 2: Parse and sign the challenge transaction
  const tx = StellarSdk.TransactionBuilder.fromXDR(data.transaction, serverPassphrase);
  if (!(tx instanceof StellarSdk.Transaction)) {
    throw new Error('SEP-10: expected a Transaction, got FeeBumpTransaction');
  }
  tx.sign(keypair);

  // Step 3: POST signed transaction to get JWT
  const { data: tokenData } = await axios.post<{ token: string }>(sep10Url, {
    transaction: tx.toXDR(),
  });

  // Decode expiry from JWT payload (no verification needed client-side)
  const payload = JSON.parse(Buffer.from(tokenData.token.split('.')[1], 'base64').toString());
  const expiresAt = (payload.exp ?? Math.floor(Date.now() / 1000) + 86400) * 1000;

  return { token: tokenData.token, expiresAt };
}

/** Simple in-memory token cache keyed by `${sep10Url}:${account}` */
const tokenCache = new Map<string, Sep10Token>();

export async function getToken(
  sep10Url: string,
  account: string,
  keypair: StellarSdk.Keypair,
  networkPassphrase: string
): Promise<string> {
  const key = `${sep10Url}:${account}`;
  const cached = tokenCache.get(key);
  if (cached && cached.expiresAt > Date.now() + 60_000) {
    return cached.token;
  }
  const token = await authenticate(sep10Url, account, keypair, networkPassphrase);
  tokenCache.set(key, token);
  return token.token;
}
