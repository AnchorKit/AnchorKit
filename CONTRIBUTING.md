# Contributing to AnchorKit

AnchorKit is an open-source TypeScript SDK for Stellar anchors and SEP standards. Contributions of all kinds are welcome — bug fixes, new SEP support, documentation, and tests.

## Getting started

```bash
git clone https://github.com/Realericky/AnchorKit.git
cd AnchorKit
npm install
npm run build
npm test
```

## Development workflow

1. Fork the repository and create a feature branch from `main`.
2. Make your changes. Keep commits focused and atomic.
3. Add or update tests to cover your change.
4. Run `npm run build && npm test` — all tests must pass.
5. Open a pull request against `main` with a clear description.

## Project structure

```
src/
  client/       AnchorKit class (main entry point)
  discovery/    stellar.toml parsing and anchor discovery
  sep6/         SEP-6 non-interactive deposit/withdraw
  sep10/        SEP-10 Stellar Web Authentication
  sep24/        SEP-24 interactive deposit/withdraw
  sep31/        SEP-31 cross-border payments
  sep38/        SEP-38 Quote API
  poll/         pollTransaction utility
  health/       health checks and anchor selection
  cache/        Redis + in-memory caching layer
  errors/       typed error classes
  types/        shared TypeScript interfaces
tests/          Jest test suite
```

## Adding a new SEP

1. Create `src/sep<N>/index.ts` with the protocol functions.
2. Add new type interfaces to `src/types/index.ts`.
3. Wire up methods on `AnchorKit` in `src/client/index.ts`.
4. Export from `src/index.ts`.
5. Parse the relevant `stellar.toml` key in `src/discovery/index.ts`.
6. Write tests in `tests/anchorkit.test.ts`.

## Code style

- TypeScript strict mode. No `any` unless unavoidable.
- No unnecessary comments — name things clearly instead.
- Errors must use the typed classes in `src/errors/index.ts`.
- New network calls must degrade gracefully (handle missing URLs with `UnsupportedSepError`).

## Opening issues

Use the bug report or feature request templates. For SEP-related features, link to the relevant [Stellar Ecosystem Proposal](https://github.com/stellar/stellar-protocol/tree/master/ecosystem).

## License

By contributing, you agree that your contributions will be licensed under the [MIT License](LICENSE).
