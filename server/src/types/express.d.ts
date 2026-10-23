import type { UserRecord } from '../types.js';

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace -- Express merges its request type through this namespace.
  namespace Express {
    interface Request {
      user?: UserRecord;
    }
  }
}

export {};
