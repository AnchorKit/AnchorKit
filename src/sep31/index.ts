import axios from 'axios';
import { Sep31SendParams, Sep31SendResult, Transaction } from '../types';

function authHeaders(token: string) {
  return { Authorization: `Bearer ${token}` };
}

export interface Sep31Info {
  receive: Record<
    string,
    {
      enabled: boolean;
      fee_fixed?: number;
      fee_percent?: number;
      min_amount?: number;
      max_amount?: number;
      fields?: {
        transaction?: Record<string, { description: string; optional?: boolean }>;
        sender?: Record<string, { description: string; optional?: boolean }>;
        receiver?: Record<string, { description: string; optional?: boolean }>;
      };
    }
  >;
}

export async function sep31Info(sep31Url: string, token: string): Promise<Sep31Info> {
  const { data } = await axios.get<Sep31Info>(`${sep31Url}/info`, {
    headers: authHeaders(token),
  });
  return data;
}

export async function sep31Send(
  sep31Url: string,
  params: Sep31SendParams,
  token: string
): Promise<Sep31SendResult> {
  const { data } = await axios.post<Sep31SendResult>(
    `${sep31Url}/transactions`,
    {
      amount: params.amount,
      asset_code: params.assetCode,
      asset_issuer: params.assetIssuer,
      destination_account: params.destinationAccount,
      destination_memo: params.destinationMemo,
      destination_memo_type: params.destinationMemoType,
      fields: params.fields,
      lang: params.lang,
    },
    { headers: authHeaders(token) }
  );
  return data;
}

export async function sep31Transaction(
  sep31Url: string,
  id: string,
  token: string
): Promise<Transaction> {
  const { data } = await axios.get<{ transaction: Transaction }>(
    `${sep31Url}/transactions/${id}`,
    { headers: authHeaders(token) }
  );
  return data.transaction;
}
