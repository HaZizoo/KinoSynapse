import mongoose from 'mongoose';

export type DatabaseMode = 'mongo' | 'memory';

/**
 * The app starts in memory mode. A successful connection upgrades it to Mongo;
 * a failed or absent local MongoDB keeps the in-memory repository so accounts,
 * watchlists and reviews work with zero external setup.
 */
let mode: DatabaseMode = 'memory';

const CONNECT_TIMEOUT_MS = 1_500;

export function getDatabaseMode(): DatabaseMode {
  return mode;
}

export async function connectDatabase(uri: string): Promise<DatabaseMode> {
  if (mode === 'mongo' && mongoose.connection.readyState === 1) return mode;

  try {
    await mongoose.connect(uri, {
      serverSelectionTimeoutMS: CONNECT_TIMEOUT_MS,
      connectTimeoutMS: CONNECT_TIMEOUT_MS,
    });
    mode = 'mongo';
  } catch (error) {
    mode = 'memory';
    await mongoose.disconnect().catch(() => undefined);
    const message = error instanceof Error ? error.message : String(error);
    console.warn(`[db] MongoDB unavailable (${message}). Using the in-memory store.`);
  }

  return mode;
}

export async function disconnectDatabase(): Promise<void> {
  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
  }
  mode = 'memory';
}
