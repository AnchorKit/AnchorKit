# AnchorKit

> "The Stripe SDK for Stellar anchors."

Unified TypeScript SDK for Stellar anchors and SEP standards. Abstracts SEP-6, SEP-24, SEP-31, and SEP-38 into one clean interface with built-in auth, transaction polling, health monitoring, auto-fallback, and caching.

[![CI](https://github.com/Realericky/AnchorKit/actions/workflows/ci.yml/badge.svg)](https://github.com/Realericky/AnchorKit/actions/workflows/ci.yml)

## Features

- **`getAnchors()`** — Discover anchors via SEP-1 `stellar.toml` parsing
- **`deposit()`** — Unified deposit (SEP-24 preferred, auto-falls back to SEP-6)
- **`withdraw()`** — Unified withdrawal (SEP-24 preferred, auto-falls back to SEP-6)
- **`pollTransaction()`** — Poll a transaction until it reaches a terminal state
- **SEP-10 auth** — Stellar Web Authentication with token caching
- **SEP-38 quotes** — Get prices and create firm quotes via the Quote API
- **Health monitoring** — Per-anchor health checks with `checkAllHealth()`
- **Auto-fallback** — `pickHealthyAnchor()` selects the first healthy anchor
- **Typed errors** — `UnsupportedSepError`, `Sep10AuthError`, `TransactionPollTimeoutError`, etc.
- **Caching** — In-memory by default; Redis when configured (graceful degradation)
- **Express server** — Drop-in HTTP API wrapping the SDK

## Stack

- TypeScript SDK
- Express backend
- Redis caching (optional)
- `@stellar/stellar-sdk`

## Installation

```bash
npm install anchorkit
```

## Quick Start

```ts
import { AnchorKit } from 'anchorkit';
import { Keypair } from '@stellar/stellar-sdk';

const kit = new AnchorKit({
  network: 'mainnet',
  homeDomains: ['anchor.example.com'],
  redisUrl: process.env.REDIS_URL, // optional
});

// Discover anchors
const anchors = await kit.getAnchors();

// Authenticate (SEP-10)
const keypair = Keypair.fromSecret(process.env.SECRET_KEY!);
const token = await kit.auth(anchors[0], keypair);

// Deposit (SEP-24 preferred, falls back to SEP-6)
const result = await kit.deposit(anchors[0], {
  assetCode: 'USDC',
  account: keypair.publicKey(),
  amount: '100',
}, token);

// Poll until completed (or timeout)
const tx = await kit.pollTransaction(anchors[0], result.id!, token, '24', {
  intervalMs: 5000,
  timeoutMs: 300_000,
  onStatusChange: (status) => console.log('status:', status),
});

// Withdraw
const withdraw = await kit.withdraw(anchors[0], {
  assetCode: 'USDC',
  account: keypair.publicKey(),
}, token);

// Health check
const health = await kit.health();
```

## SEP Support

| SEP | Description | Methods |
|-----|-------------|---------|
| SEP-1 | Anchor discovery via `stellar.toml` | `getAnchors()`, `getAnchor()` |
| SEP-6 | Non-interactive deposit/withdraw | `sep6Deposit()`, `sep6Withdraw()`, `sep6Transaction()`, `sep6Transactions()` |
| SEP-10 | Stellar Web Authentication | `auth()` |
| SEP-24 | Interactive deposit/withdraw | `sep24Deposit()`, `sep24Withdraw()`, `sep24Transaction()`, `sep24Transactions()` |
| SEP-31 | Cross-border payments | `sep31Send()`, `sep31Transaction()` |
| SEP-38 | Quote API | `sep38Info()`, `sep38GetPrice()`, `sep38PostQuote()`, `sep38GetQuote()` |

## Transaction Polling

```ts
const tx = await kit.pollTransaction(anchor, transactionId, token, '24', {
  intervalMs: 5000,       // poll every 5s (default)
  timeoutMs: 300_000,     // give up after 5min (default)
  onStatusChange: (status, tx) => {
    console.log(`Transaction ${tx.id} → ${status}`);
  },
});
// tx.status is guaranteed to be a terminal status
```

Terminal statuses: `completed`, `refunded`, `expired`, `error`, `no_market`, `too_small`, `too_large`.

## SEP-38 Quotes

```ts
// Get indicative price
const price = await kit.sep38GetPrice(anchor, {
  sellAsset: 'stellar:USDC:GBBD...',
  buyAsset: 'iso4217:USD',
  sellAmount: '100',
});

// Create a firm, expiring quote
const quote = await kit.sep38PostQuote(anchor, {
  sellAsset: 'stellar:USDC:GBBD...',
  buyAsset: 'iso4217:USD',
  sellAmount: '100',
}, token);

console.log(quote.id, quote.expires_at);
```

## Error Handling

```ts
import {
  UnsupportedSepError,
  Sep10AuthError,
  TransactionPollTimeoutError,
  NoHealthyAnchorError,
} from 'anchorkit';

try {
  await kit.deposit(anchor, params, token);
} catch (err) {
  if (err instanceof UnsupportedSepError) {
    // anchor doesn't support SEP-6 or SEP-24
  }
  if (err instanceof TransactionPollTimeoutError) {
    // polling timed out
  }
}
```

## Express Server

```bash
PORT=3000 NETWORK=testnet HOME_DOMAINS=testanchor.stellar.org npm run dev
```

| Endpoint | Description |
|----------|-------------|
| `GET /anchors` | List all configured anchors |
| `GET /anchors/:domain` | Fetch a single anchor |
| `GET /health` | Health status of all anchors |
| `POST /deposit` | Unified deposit |
| `POST /withdraw` | Unified withdrawal |
| `POST /sep31/send` | SEP-31 cross-border send |
| `GET /transaction/:id` | Fetch transaction by ID |

## Development

```bash
npm run build   # compile TypeScript
npm test        # run tests
npm run dev     # start Express server with ts-node
```

See [CONTRIBUTING.md](CONTRIBUTING.md) for how to add new SEPs or contribute fixes.

## License

MIT
