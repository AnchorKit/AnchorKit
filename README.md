# AnchorKit

> "The Stripe SDK for Stellar anchors."

Unified TypeScript SDK for Stellar anchors and SEP standards. Abstracts SEP-6, SEP-24, and SEP-31 into one clean interface with built-in auth, health monitoring, auto-fallback, and Redis caching.

## Features

- **`getAnchors()`** — Discover anchors via SEP-1 `stellar.toml` parsing
- **`deposit()`** — Unified deposit (SEP-24 preferred, auto-falls back to SEP-6)
- **`withdraw()`** — Unified withdrawal (SEP-24 preferred, auto-falls back to SEP-6)
- **SEP-10 auth** — Stellar Web Authentication with in-memory token caching
- **Health monitoring** — Per-anchor health checks with `checkAllHealth()`
- **Auto-fallback** — `pickHealthyAnchor()` selects the first healthy anchor from your list
- **Redis caching** — Anchor info cached via Redis (gracefully degrades without it)
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

const kit = new AnchorKit({
  network: 'mainnet',
  homeDomains: ['anchor.example.com'],
  redisUrl: process.env.REDIS_URL, // optional
});

// Discover anchors
const anchors = await kit.getAnchors();

// Authenticate (SEP-10)
const keypair = Keypair.fromSecret(process.env.SECRET_KEY);
const token = await kit.auth(anchors[0], keypair);

// Deposit (SEP-24 preferred, falls back to SEP-6)
const result = await kit.deposit(anchors[0], {
  assetCode: 'USDC',
  account: keypair.publicKey(),
  amount: '100',
}, token);

// Withdraw
const withdraw = await kit.withdraw(anchors[0], {
  assetCode: 'USDC',
  account: keypair.publicKey(),
}, token);

// Health check
const health = await kit.health();
```

## SEP Support

| SEP | Description | Method |
|-----|-------------|--------|
| SEP-1 | Anchor discovery via `stellar.toml` | `getAnchors()`, `getAnchor()` |
| SEP-6 | Non-interactive deposit/withdraw | `sep6Deposit()`, `sep6Withdraw()` |
| SEP-10 | Stellar Web Authentication | `auth()` |
| SEP-24 | Interactive deposit/withdraw | `sep24Deposit()`, `sep24Withdraw()` |
| SEP-31 | Cross-border payments | `sep31Send()` |

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

## License

MIT
