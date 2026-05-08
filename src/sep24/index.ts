import axios from 'axios';
import { DepositParams, DepositResult, WithdrawParams, WithdrawResult, Transaction } from '../types';

function authHeaders(token: string) {
  return { Authorization: `Bearer ${token}` };
}

export async function sep24Deposit(
  sep24Url: string,
  params: DepositParams,
  token: string
): Promise<DepositResult> {
  const { data } = await axios.post<DepositResult>(
    `${sep24Url}/transactions/deposit/interactive`,
    {
      asset_code: params.assetCode,
      account: params.account,
      amount: params.amount,
      memo: params.memo,
      memo_type: params.memoType,
      lang: params.lang,
    },
    { headers: authHeaders(token) }
  );
  return data;
}

export async function sep24Withdraw(
  sep24Url: string,
  params: WithdrawParams,
  token: string
): Promise<WithdrawResult> {
  const { data } = await axios.post<WithdrawResult>(
    `${sep24Url}/transactions/withdraw/interactive`,
    {
      asset_code: params.assetCode,
      account: params.account,
      amount: params.amount,
      lang: params.lang,
    },
    { headers: authHeaders(token) }
  );
  return data;
}

export async function sep24Transaction(
  sep24Url: string,
  id: string,
  token: string
): Promise<Transaction> {
  const { data } = await axios.get<{ transaction: Transaction }>(
    `${sep24Url}/transaction`,
    { params: { id }, headers: authHeaders(token) }
  );
  return data.transaction;
}

export async function sep24Transactions(
  sep24Url: string,
  assetCode: string,
  token: string
): Promise<Transaction[]> {
  const { data } = await axios.get<{ transactions: Transaction[] }>(
    `${sep24Url}/transactions`,
    { params: { asset_code: assetCode }, headers: authHeaders(token) }
  );
  return data.transactions;
}
