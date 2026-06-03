import { AnchorInfo, Transaction, TransactionStatus } from '../types';
import { sep6Transaction } from '../sep6';
import { sep24Transaction } from '../sep24';
import { sep31Transaction } from '../sep31';
import { TransactionPollTimeoutError } from '../errors';

const TERMINAL_STATUSES: TransactionStatus[] = [
  'completed',
  'refunded',
  'expired',
  'error',
  'no_market',
  'too_small',
  'too_large',
];

export interface PollOptions {
  intervalMs?: number;
  timeoutMs?: number;
  onStatusChange?: (status: TransactionStatus, tx: Transaction) => void;
}

/**
 * Polls a transaction until it reaches a terminal state (completed, error, refunded, etc.)
 * or the timeout is exceeded.
 */
export async function pollTransaction(
  anchor: AnchorInfo,
  id: string,
  token: string,
  sep: '6' | '24' | '31' = '24',
  options: PollOptions = {}
): Promise<Transaction> {
  const intervalMs = options.intervalMs ?? 5000;
  const timeoutMs = options.timeoutMs ?? 300_000;
  const deadline = Date.now() + timeoutMs;
  let lastStatus: TransactionStatus | undefined;

  const fetchTx = (): Promise<Transaction> => {
    if (sep === '6') {
      if (!anchor.sep6Url) throw new Error(`${anchor.homeDomain} does not support SEP-6`);
      return sep6Transaction(anchor.sep6Url, id, token);
    }
    if (sep === '31') {
      if (!anchor.sep31Url) throw new Error(`${anchor.homeDomain} does not support SEP-31`);
      return sep31Transaction(anchor.sep31Url, id, token);
    }
    if (!anchor.sep24Url) throw new Error(`${anchor.homeDomain} does not support SEP-24`);
    return sep24Transaction(anchor.sep24Url, id, token);
  };

  while (Date.now() < deadline) {
    const tx = await fetchTx();

    if (tx.status !== lastStatus) {
      lastStatus = tx.status;
      options.onStatusChange?.(tx.status, tx);
    }

    if (TERMINAL_STATUSES.includes(tx.status)) {
      return tx;
    }

    const remaining = deadline - Date.now();
    if (remaining <= 0) break;
    await new Promise<void>((resolve) => setTimeout(resolve, Math.min(intervalMs, remaining)));
  }

  throw new TransactionPollTimeoutError(id, timeoutMs);
}
