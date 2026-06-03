// Core types for AnchorKit

export interface AnchorInfo {
  homeDomain: string;
  networkPassphrase: string;
  signingKey: string;
  sep6Url?: string;
  sep24Url?: string;
  sep31Url?: string;
  sep38Url?: string;
  sep10Url?: string;
  currencies: Currency[];
}

export interface Currency {
  code: string;
  issuer?: string;
  depositEnabled?: boolean;
  withdrawEnabled?: boolean;
  sendEnabled?: boolean;
}

export type TransactionStatus =
  | 'pending_external'
  | 'pending_anchor'
  | 'pending_stellar'
  | 'pending_trust'
  | 'pending_user'
  | 'pending_user_transfer_start'
  | 'completed'
  | 'refunded'
  | 'expired'
  | 'error'
  | 'incomplete'
  | 'no_market'
  | 'too_small'
  | 'too_large';

export interface Transaction {
  id: string;
  kind: 'deposit' | 'withdrawal' | 'send';
  status: TransactionStatus;
  amount_in?: string;
  amount_out?: string;
  amount_fee?: string;
  asset_code: string;
  stellar_transaction_id?: string;
  external_transaction_id?: string;
  message?: string;
  refunded?: boolean;
  started_at: string;
  completed_at?: string;
  // SEP-24 interactive
  more_info_url?: string;
  // SEP-31
  stellar_account_id?: string;
  stellar_memo?: string;
  stellar_memo_type?: string;
}

export interface DepositParams {
  assetCode: string;
  account: string;
  amount?: string;
  memo?: string;
  memoType?: string;
  emailAddress?: string;
  type?: string;
  // SEP-31
  fields?: Record<string, string>;
  lang?: string;
}

export interface WithdrawParams {
  assetCode: string;
  account: string;
  amount?: string;
  dest?: string;
  destExtra?: string;
  memo?: string;
  memoType?: string;
  type?: string;
  lang?: string;
}

export interface DepositResult {
  how?: string;
  instructions?: Record<string, { value: string; description: string }>;
  id?: string;
  eta?: number;
  min_amount?: number;
  max_amount?: number;
  fee_fixed?: number;
  fee_percent?: number;
  extra_info?: { message?: string };
  // SEP-24
  type?: string;
  url?: string;
}

export interface WithdrawResult {
  account_id: string;
  memo_type?: string;
  memo?: string;
  id?: string;
  eta?: number;
  min_amount?: number;
  max_amount?: number;
  fee_fixed?: number;
  fee_percent?: number;
  extra_info?: { message?: string };
  // SEP-24
  type?: string;
  url?: string;
}

export interface Sep31SendParams {
  assetCode: string;
  assetIssuer: string;
  amount: string;
  destinationAccount: string;
  destinationMemo?: string;
  destinationMemoType?: string;
  fields?: {
    transaction?: Record<string, string>;
    sender?: Record<string, string>;
    receiver?: Record<string, string>;
  };
  lang?: string;
}

export interface Sep31SendResult {
  id: string;
  stellar_account_id: string;
  stellar_memo: string;
  stellar_memo_type: string;
}

export interface HealthStatus {
  homeDomain: string;
  healthy: boolean;
  latencyMs?: number;
  error?: string;
  checkedAt: string;
}

export interface AnchorKitConfig {
  network: 'mainnet' | 'testnet';
  homeDomains?: string[];
  redisUrl?: string;
  cacheTtlSeconds?: number;
  timeoutMs?: number;
}
