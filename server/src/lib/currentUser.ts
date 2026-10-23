import type { Request } from 'express';
import { ApiError } from './errors.js';
import type { UserRecord } from '../types.js';

/** Narrow `req.user` for handlers that run behind `requireAuth`. */
export function currentUser(req: Request): UserRecord {
  if (!req.user) {
    throw new ApiError(401, 'Authentication required.');
  }
  return req.user;
}
