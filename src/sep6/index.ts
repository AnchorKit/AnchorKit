import axios from 'axios';
import { DepositParams, DepositResult, WithdrawParams, WithdrawResult, Transaction } from '../types';

function authHeaders(token?: string) {
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export async function sep6Deposit(
  sep6Url: string,
  params: DepositParams,
  token?: string
): Promise<DepositResult> {
  const { data } = await axios.get<DepositResult>(`${sep6Url}/deposit`, {
    params: {
      asset_code: params.assetCode,
      account: params.account,
      amount: params.amount,
      memo: params.memo,
      memo_type: params.memoType,
      email_address: params.emailAddress,
      type: params.type,
      lang: params.lang,
    },
    headers: authHeaders(token),
  });
  return data;
}

export async function sep6Withdraw(
  sep6Url: string,
  params: WithdrawParams,
  token?: string
): Promise<WithdrawResult> {
  const { data } = await axios.get<WithdrawResult>(`${sep6Url}/withdraw`, {
    params: {
      asset_code: params.assetCode,
      account: params.account,
      amount: params.amount,
      dest: params.dest,
      dest_extra: params.destExtra,
      memo: params.memo,
      memo_type: params.memoType,
      type: params.type,
      lang: params.lang,
    },
    headers: authHeaders(token),
  });
  return data;
}

export async function sep6Transaction(
  sep6Url: string,
  id: string,
  token?: string
): Promise<Transaction> {
  const { data } = await axios.get<{ transaction: Transaction }>(`${sep6Url}/transaction`, {
    params: { id },
    headers: authHeaders(token),
  });
  return data.transaction;
}

export async function sep6Transactions(
  sep6Url: string,
  assetCode: string,
  token?: string
): Promise<Transaction[]> {
  const { data } = await axios.get<{ transactions: Transaction[] }>(`${sep6Url}/transactions`, {
    params: { asset_code: assetCode },
    headers: authHeaders(token),
  });
  return data.transactions;
}
