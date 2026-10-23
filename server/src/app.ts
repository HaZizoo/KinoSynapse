import express, { type Express } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { env, isTest } from './config/env.js';
import { getDatabaseMode } from './config/db.js';
import { errorHandler, notFoundHandler } from './lib/errors.js';
import { isTmdbOffline } from './lib/tmdb.js';
import authRoutes from './routes/auth.routes.js';
import movieRoutes from './routes/movies.routes.js';
import searchRoutes from './routes/search.routes.js';
import watchlistRoutes from './routes/watchlist.routes.js';

function allowedOrigins(value: string): string | string[] {
  const origins = value
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);
  if (origins.length === 0 || origins.includes('*')) return '*';
  return origins;
}

export function createApp(): Express {
  const app = express();

  app.disable('x-powered-by');
  app.set('json escape', true);
  if (env.TRUST_PROXY) app.set('trust proxy', 1);

  app.use(helmet());
  app.use(cors({ origin: allowedOrigins(env.CLIENT_ORIGIN), maxAge: 86_400 }));
  app.use(express.json({ limit: '100kb', strict: true }));

  // Authenticated payloads must never be stored by a browser or shared proxy.
  app.use(['/api/auth', '/api/watchlist'], (_req, res, next) => {
    res.set('Cache-Control', 'no-store');
    next();
  });

  if (!isTest) {
    app.use(morgan('dev'));
  }

  app.get('/api/health', (_req, res) => {
    res.json({
      status: 'ok',
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
      mode: {
        database: getDatabaseMode(),
        tmdb: isTmdbOffline() ? 'catalog' : 'live',
      },
    });
  });

  app.use('/api/auth', authRoutes);
  app.use('/api/movies', movieRoutes);
  app.use('/api/watchlist', watchlistRoutes);
  app.use('/api/search', searchRoutes);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
