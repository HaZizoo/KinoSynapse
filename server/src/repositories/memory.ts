import { randomBytes } from 'node:crypto';
import { ApiError } from '../lib/errors.js';
import type { AddWatchlistResult, ReviewRepository, UserRepository } from './contracts.js';
import type { MovieSnapshot, ReviewInput, ReviewRecord, UserRecord } from '../types.js';

/**
 * In-memory fallback used when MongoDB is not running (and by the test suite).
 * Data lives for the lifetime of the process, which keeps a fresh clone fully
 * usable without any external service.
 */

const users = new Map<string, UserRecord>();

interface StoredReview {
  id: string;
  movieId: number;
  rating: number;
  title: string;
  body: string;
  userId: string;
  userName: string;
  createdAt: Date;
  updatedAt: Date;
}

const reviews = new Map<string, StoredReview>();

function newId(): string {
  return randomBytes(12).toString('hex');
}

function cloneUser(user: UserRecord): UserRecord {
  return {
    ...user,
    watchlist: user.watchlist.map((item) => ({ ...item })),
  };
}

function toReviewRecord(review: StoredReview): ReviewRecord {
  return {
    id: review.id,
    movieId: review.movieId,
    rating: review.rating,
    title: review.title,
    body: review.body,
    user: { id: review.userId, name: review.userName },
    createdAt: review.createdAt,
    updatedAt: review.updatedAt,
  };
}

export const memoryUsers: UserRepository = {
  async create({ name, email, passwordHash }) {
    const normalized = email.trim().toLowerCase();
    if ([...users.values()].some((user) => user.email === normalized)) {
      throw new ApiError(409, 'An account with that email already exists.');
    }

    const user: UserRecord = {
      id: newId(),
      name,
      email: normalized,
      passwordHash,
      watchlist: [],
      createdAt: new Date(),
    };

    users.set(user.id, user);
    return cloneUser(user);
  },

  async findById(id) {
    const user = users.get(id);
    return user ? cloneUser(user) : null;
  },

  async findByEmail(email) {
    const normalized = email.trim().toLowerCase();
    const user = [...users.values()].find((entry) => entry.email === normalized);
    return user ? cloneUser(user) : null;
  },

  async existsByEmail(email) {
    const normalized = email.trim().toLowerCase();
    return [...users.values()].some((entry) => entry.email === normalized);
  },

  async addWatchlistItem(userId, item: MovieSnapshot, max: number): Promise<AddWatchlistResult> {
    const user = users.get(userId);
    if (!user) return { status: 'missing' };
    if (user.watchlist.some((entry) => entry.movieId === item.movieId)) {
      return { status: 'duplicate' };
    }
    if (user.watchlist.length >= max) return { status: 'full' };

    user.watchlist.push({ ...item, addedAt: new Date() });
    return { status: 'added', user: cloneUser(user) };
  },

  async removeWatchlistItem(userId, movieId) {
    const user = users.get(userId);
    if (!user) return false;

    const before = user.watchlist.length;
    user.watchlist = user.watchlist.filter((entry) => entry.movieId !== movieId);
    return user.watchlist.length < before;
  },
};

export const memoryReviews: ReviewRepository = {
  async listByMovie(movieId, { skip, limit }) {
    const matching = [...reviews.values()]
      .filter((review) => review.movieId === movieId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

    const average =
      matching.length === 0
        ? null
        : Math.round((matching.reduce((total, review) => total + review.rating, 0) / matching.length) * 10) / 10;

    return {
      count: matching.length,
      averageRating: average,
      results: matching.slice(skip, skip + limit).map(toReviewRecord),
    };
  },

  async upsert(userId, userName, movieId, input: ReviewInput) {
    const existing = [...reviews.values()].find(
      (review) => review.movieId === movieId && review.userId === userId,
    );

    const now = new Date();
    if (existing) {
      existing.rating = input.rating;
      existing.title = input.title;
      existing.body = input.body;
      existing.userName = userName;
      existing.updatedAt = now;
      return toReviewRecord(existing);
    }

    const review: StoredReview = {
      id: newId(),
      movieId,
      rating: input.rating,
      title: input.title,
      body: input.body,
      userId,
      userName,
      createdAt: now,
      updatedAt: now,
    };

    reviews.set(review.id, review);
    return toReviewRecord(review);
  },

  async deleteOwned(reviewId, movieId, userId) {
    const review = reviews.get(reviewId);
    if (!review || review.movieId !== movieId || review.userId !== userId) return false;
    return reviews.delete(reviewId);
  },
};

/** Test hook: guarantees isolation between cases without a database. */
export function resetMemoryStore(): void {
  users.clear();
  reviews.clear();
}
