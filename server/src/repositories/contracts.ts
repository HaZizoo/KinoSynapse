import type {
  MovieSnapshot,
  PaginatedReviews,
  ReviewInput,
  ReviewRecord,
  UserRecord,
} from '../types.js';

export type AddWatchlistResult =
  | { status: 'added'; user: UserRecord }
  | { status: 'duplicate' }
  | { status: 'full' }
  | { status: 'missing' };

export interface UserRepository {
  create(input: { name: string; email: string; passwordHash: string }): Promise<UserRecord>;
  findById(id: string): Promise<UserRecord | null>;
  findByEmail(email: string): Promise<UserRecord | null>;
  existsByEmail(email: string): Promise<boolean>;
  addWatchlistItem(userId: string, item: MovieSnapshot, max: number): Promise<AddWatchlistResult>;
  removeWatchlistItem(userId: string, movieId: number): Promise<boolean>;
}

export interface ReviewRepository {
  listByMovie(movieId: number, options: { skip: number; limit: number }): Promise<PaginatedReviews>;
  upsert(
    userId: string,
    userName: string,
    movieId: number,
    input: ReviewInput,
  ): Promise<ReviewRecord>;
  deleteOwned(reviewId: string, movieId: number, userId: string): Promise<boolean>;
}
