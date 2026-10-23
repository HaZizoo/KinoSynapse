import { getDatabaseMode } from '../config/db.js';
import { memoryReviews, memoryUsers } from './memory.js';
import { mongoReviews, mongoUsers } from './mongo.js';
import type { ReviewRepository, UserRepository } from './contracts.js';

export type { AddWatchlistResult, ReviewRepository, UserRepository } from './contracts.js';

/** Both backends implement the same contract, so controllers stay storage-agnostic. */
export function userRepository(): UserRepository {
  return getDatabaseMode() === 'mongo' ? mongoUsers : memoryUsers;
}

export function reviewRepository(): ReviewRepository {
  return getDatabaseMode() === 'mongo' ? mongoReviews : memoryReviews;
}
