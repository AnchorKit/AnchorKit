import axios from 'axios';

function authHeaders(token?: string) {
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export interface Sep38Asset {
  asset: string;
  country_codes?: string[];
  sell_delivery_methods?: { name: string; description: string }[];
  buy_delivery_methods?: { name: string; description: string }[];
}

export interface Sep38Info {
  assets: Sep38Asset[];
}

export interface Sep38PriceParams {
  sellAsset: string;
  buyAsset: string;
  sellAmount?: string;
  buyAmount?: string;
  sellDeliveryMethod?: string;
  buyDeliveryMethod?: string;
  countryCode?: string;
}

export interface Sep38Price {
  total_price: string;
  price: string;
  sell_amount: string;
  buy_amount: string;
  fee: {
    total: string;
    asset: string;
    details?: { name: string; description?: string; amount: string }[];
  };
}

export interface Sep38QuoteParams extends Sep38PriceParams {
  expireAfter?: string;
}

export interface Sep38Quote extends Sep38Price {
  id: string;
  expires_at: string;
}

export async function sep38Info(sep38Url: string, token?: string): Promise<Sep38Info> {
  const { data } = await axios.get<Sep38Info>(`${sep38Url}/info`, {
    headers: authHeaders(token),
  });
  return data;
}

export async function sep38GetPrice(
  sep38Url: string,
  params: Sep38PriceParams,
  token?: string
): Promise<Sep38Price> {
  const { data } = await axios.get<Sep38Price>(`${sep38Url}/price`, {
    params: {
      sell_asset: params.sellAsset,
      buy_asset: params.buyAsset,
      sell_amount: params.sellAmount,
      buy_amount: params.buyAmount,
      sell_delivery_method: params.sellDeliveryMethod,
      buy_delivery_method: params.buyDeliveryMethod,
      country_code: params.countryCode,
    },
    headers: authHeaders(token),
  });
  return data;
}

export async function sep38PostQuote(
  sep38Url: string,
  params: Sep38QuoteParams,
  token: string
): Promise<Sep38Quote> {
  const { data } = await axios.post<Sep38Quote>(
    `${sep38Url}/quote`,
    {
      sell_asset: params.sellAsset,
      buy_asset: params.buyAsset,
      sell_amount: params.sellAmount,
      buy_amount: params.buyAmount,
      sell_delivery_method: params.sellDeliveryMethod,
      buy_delivery_method: params.buyDeliveryMethod,
      country_code: params.countryCode,
      expire_after: params.expireAfter,
    },
    { headers: { Authorization: `Bearer ${token}` } }
  );
  return data;
}

export async function sep38GetQuote(
  sep38Url: string,
  id: string,
  token: string
): Promise<Sep38Quote> {
  const { data } = await axios.get<Sep38Quote>(`${sep38Url}/quote/${id}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return data;
}
