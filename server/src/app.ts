import path from 'node:path';
import fs from 'node:fs';
import express, { type NextFunction, type Request, type Response } from 'express';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import { config } from './config.js';
import { loadUser } from './middleware/auth.js';
import { authRouter } from './routes/auth.js';
import { itemsRouter } from './routes/items.js';
import { ordersRouter } from './routes/orders.js';

export function createApp() {
  const app = express();
  app.set('trust proxy', 1); // Render sits behind a proxy
  app.use(helmet({ contentSecurityPolicy: false, crossOriginResourcePolicy: false }));
  app.use(express.json());
  app.use(cookieParser());
  app.use(loadUser);

  app.get('/api/health', (_req, res) => res.json({ ok: true }));
  app.use('/api/auth', authRouter);
  app.use('/api/items', itemsRouter);
  app.use('/api/orders', ordersRouter);
  app.use('/api', (_req, res) => res.status(404).json({ error: 'Not found.' }));

  // In production the same server also serves the built React app
  const clientDist = path.resolve(process.cwd(), '../client/dist');
  if (config.isProduction && fs.existsSync(clientDist)) {
    app.use(express.static(clientDist));
    app.get('*', (_req, res) => res.sendFile(path.join(clientDist, 'index.html')));
  }

  // Express 4 does not catch errors from async handlers by itself: see the
  // `express-async-errors` import in index.ts and tests/setup.ts.
  app.use((err: unknown, _req: Request, res: Response, _next: NextFunction) => {
    console.error(err);
    res.status(500).json({ error: 'Something went wrong on our side.' });
  });

  return app;
}
