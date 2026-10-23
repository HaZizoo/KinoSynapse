import { createApp } from './app.js';
import { env } from './config/env.js';
import { connectDatabase, disconnectDatabase } from './config/db.js';
import { isTmdbOffline } from './lib/tmdb.js';

async function main(): Promise<void> {
  const database = await connectDatabase(env.MONGODB_URI);
  console.log(
    database === 'mongo'
      ? '[db] connected to MongoDB'
      : '[db] MongoDB unavailable — using the in-memory store (data resets when the server stops)',
  );

  console.log(
    isTmdbOffline()
      ? '[tmdb] no usable TMDB_API_KEY — serving the bundled offline catalog'
      : '[tmdb] live TMDB API enabled',
  );

  const app = createApp();
  const server = app.listen(env.PORT, () => {
    console.log(`[api] listening on http://localhost:${env.PORT} (${env.NODE_ENV})`);
  });

  server.on('error', (err) => {
    console.error('[api] failed to start:', err.message);
    process.exit(1);
  });

  let shuttingDown = false;
  async function shutdown(signal: string): Promise<void> {
    if (shuttingDown) return;
    shuttingDown = true;
    console.log(`\n[api] ${signal} received, shutting down`);

    const forceExit = setTimeout(() => process.exit(1), 10_000);
    forceExit.unref();

    // Stop accepting connections, then close keep-alive sockets that would
    // otherwise hold the process open until their timeout.
    const closeConnections = setTimeout(() => server.closeAllConnections?.(), 5_000);
    closeConnections.unref();

    await new Promise<void>((resolve) => server.close(() => resolve()));
    clearTimeout(closeConnections);
    await disconnectDatabase();
    process.exit(0);
  }

  process.on('SIGINT', () => void shutdown('SIGINT'));
  process.on('SIGTERM', () => void shutdown('SIGTERM'));
  process.on('unhandledRejection', (reason) => {
    console.error('[api] unhandled rejection:', reason);
    void shutdown('unhandledRejection');
  });
  process.on('uncaughtException', (err) => {
    console.error('[api] uncaught exception:', err);
    void shutdown('uncaughtException');
  });
}

main().catch((err: unknown) => {
  console.error('[api] startup failed:', err instanceof Error ? err.message : err);
  process.exit(1);
});
