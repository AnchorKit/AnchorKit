import * as StellarSdk from '@stellar/stellar-sdk';
export interface Sep10Token {
    token: string;
    expiresAt: number;
}
/**
 * Performs SEP-10 Web Authentication against an anchor's auth endpoint.
 * Returns a JWT token for use in subsequent SEP-6/24/31 requests.
 */
export declare function authenticate(sep10Url: string, account: string, keypair: StellarSdk.Keypair, networkPassphrase: string): Promise<Sep10Token>;
export declare function getToken(sep10Url: string, account: string, keypair: StellarSdk.Keypair, networkPassphrase: string): Promise<string>;
//# sourceMappingURL=index.d.ts.map