import axios from 'axios';
import * as TOML from 'toml';
import { AnchorInfo, Currency } from '../types';

const MAINNET_PASSPHRASE = 'Public Global Stellar Network ; September 2015';
const TESTNET_PASSPHRASE = 'Test SDF Network ; September 2015';

export async function fetchAnchorInfo(
  homeDomain: string,
  network: 'mainnet' | 'testnet' = 'mainnet'
): Promise<AnchorInfo> {
  const url = `https://${homeDomain}/.well-known/stellar.toml`;
  const { data: raw } = await axios.get<string>(url, {
    headers: { Accept: 'text/plain' },
    responseType: 'text',
  });

  const toml = TOML.parse(raw);

  const currencies: Currency[] = ((toml['CURRENCIES'] as Record<string, unknown>[] | undefined) ?? []).map(
    (c: Record<string, unknown>) => ({
      code: c['code'] as string,
      issuer: c['issuer'] as string | undefined,
      depositEnabled: c['deposit_enabled'] as boolean | undefined,
      withdrawEnabled: c['withdrawal_enabled'] as boolean | undefined,
      sendEnabled: c['send_enabled'] as boolean | undefined,
    })
  );

  return {
    homeDomain,
    networkPassphrase:
      (toml['NETWORK_PASSPHRASE'] as string | undefined) ??
      (network === 'testnet' ? TESTNET_PASSPHRASE : MAINNET_PASSPHRASE),
    signingKey: toml['SIGNING_KEY'] as string,
    sep6Url: toml['TRANSFER_SERVER'] as string | undefined,
    sep24Url: toml['TRANSFER_SERVER_SEP0024'] as string | undefined,
    sep31Url: toml['DIRECT_PAYMENT_SERVER'] as string | undefined,
    sep10Url: toml['WEB_AUTH_ENDPOINT'] as string | undefined,
    currencies,
  };
}

export async function discoverAnchors(
  homeDomains: string[],
  network: 'mainnet' | 'testnet' = 'mainnet'
): Promise<AnchorInfo[]> {
  const results = await Promise.allSettled(
    homeDomains.map((d) => fetchAnchorInfo(d, network))
  );
  return results
    .filter((r): r is PromiseFulfilledResult<AnchorInfo> => r.status === 'fulfilled')
    .map((r) => r.value);
}
