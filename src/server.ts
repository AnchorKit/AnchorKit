import express, { Request, Response, NextFunction } from 'express';
import { AnchorKit } from './client';
import { AnchorKitConfig } from './types';

export function createServer(config: AnchorKitConfig): express.Application {
  const app = express();
  app.use(express.json());

  const kit = new AnchorKit(config);

  // GET /anchors — discover all configured anchors
  app.get('/anchors', async (_req: Request, res: Response, next: NextFunction) => {
    try {
      const anchors = await kit.getAnchors();
      res.json({ anchors });
    } catch (err) {
      next(err);
    }
  });

  // GET /anchors/:domain — fetch a single anchor
  app.get('/anchors/:domain', async (req: Request, res: Response, next: NextFunction) => {
    try {
      const anchor = await kit.getAnchor(req.params['domain']);
      res.json({ anchor });
    } catch (err) {
      next(err);
    }
  });

  // GET /health — health check all anchors
  app.get('/health', async (_req: Request, res: Response, next: NextFunction) => {
    try {
      const statuses = await kit.health();
      res.json({ statuses });
    } catch (err) {
      next(err);
    }
  });

  // POST /deposit — unified deposit (SEP-24 preferred, fallback SEP-6)
  // Body: { homeDomain, token, ...DepositParams }
  app.post('/deposit', async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { homeDomain, token, ...params } = req.body as {
        homeDomain: string;
        token: string;
        assetCode: string;
        account: string;
        amount?: string;
      };
      const anchor = await kit.getAnchor(homeDomain);
      const result = await kit.deposit(anchor, params, token);
      res.json(result);
    } catch (err) {
      next(err);
    }
  });

  // POST /withdraw — unified withdraw
  app.post('/withdraw', async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { homeDomain, token, ...params } = req.body as {
        homeDomain: string;
        token: string;
        assetCode: string;
        account: string;
        amount?: string;
      };
      const anchor = await kit.getAnchor(homeDomain);
      const result = await kit.withdraw(anchor, params, token);
      res.json(result);
    } catch (err) {
      next(err);
    }
  });

  // POST /sep31/send — SEP-31 cross-border payment
  app.post('/sep31/send', async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { homeDomain, token, ...params } = req.body;
      const anchor = await kit.getAnchor(homeDomain as string);
      const result = await kit.sep31Send(anchor, params, token as string);
      res.json(result);
    } catch (err) {
      next(err);
    }
  });

  // GET /transaction/:id?homeDomain=&sep=6|24|31&token=
  app.get('/transaction/:id', async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { homeDomain, sep, token } = req.query as Record<string, string>;
      const anchor = await kit.getAnchor(homeDomain);
      let tx;
      if (sep === '31') tx = await kit.sep31Transaction(anchor, req.params['id'], token);
      else if (sep === '6') tx = await kit.sep6Transaction(anchor, req.params['id'], token);
      else tx = await kit.sep24Transaction(anchor, req.params['id'], token);
      res.json({ transaction: tx });
    } catch (err) {
      next(err);
    }
  });

  // Error handler
  app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
    res.status(500).json({ error: err.message });
  });

  return app;
}

// Standalone entry point
if (require.main === module) {
  const config: AnchorKitConfig = {
    network: (process.env['NETWORK'] as 'mainnet' | 'testnet') ?? 'testnet',
    homeDomains: process.env['HOME_DOMAINS']?.split(',') ?? [],
    redisUrl: process.env['REDIS_URL'],
    cacheTtlSeconds: Number(process.env['CACHE_TTL'] ?? 300),
    timeoutMs: Number(process.env['TIMEOUT_MS'] ?? 5000),
  };

  const app = createServer(config);
  const port = Number(process.env['PORT'] ?? 3000);
  app.listen(port, () => console.log(`AnchorKit server running on port ${port}`));
}
