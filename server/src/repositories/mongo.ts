import mongoose from 'mongoose';
import { ApiError } from '../lib/errors.js';
import { ReviewModel, type ReviewDocument } from '../models/Review.js';
import { UserModel, type UserDocument } from '../models/User.js';
import type { AddWatchlistResult, ReviewRepository, UserRepository } from './contracts.js';
import type { MovieSnapshot, ReviewInput, ReviewRecord, UserRecord } from '../types.js';

function isValidId(id: string): boolean {
  return mongoose.isValidObjectId(id);
}

function toUserRecord(doc: UserDocument & { _id: unknown }): UserRecord {
  return {
    id: String(doc._id),
    name: doc.name,
    email: doc.email,
    passwordHash: doc.passwordHash,
    watchlist: (doc.watchlist ?? []).map((item) => ({
      movieId: item.movieId,
      title: item.title,
      posterPath: item.posterPath ?? null,
      releaseDate: item.releaseDate ?? null,
      voteAverage: item.voteAverage ?? 0,
      addedAt: item.addedAt ?? new Date(),
    })),
    createdAt: doc.createdAt,
  };
}

function toReviewRecord(doc: ReviewDocument & { _id: unknown }): ReviewRecord {
  return {
    id: String(doc._id),
    movieId: doc.tmdbMovieId,
    rating: doc.rating,
    title: doc.title,
    body: doc.body,
    user: { id: String(doc.user), name: doc.userName },
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
  };
}

async function findUserById(id: string): Promise<UserRecord | null> {
  if (!isValidId(id)) return null;
  const doc = await UserModel.findById(id).select('+passwordHash').exec();
  return doc ? toUserRecord(doc) : null;
}

export const mongoUsers: UserRepository = {
  async create({ name, email, passwordHash }) {
    const doc = await UserModel.create({
      name,
      email: email.trim().toLowerCase(),
      passwordHash,
    });
    const user = await findUserById(String(doc._id));
    if (!user) throw new ApiError(500, 'Could not create the account.');
    return user;
  },

  findById: findUserById,

  async findByEmail(email) {
    const doc = await UserModel.findOne({ email: email.trim().toLowerCase() })
      .select('+passwordHash')
      .exec();
    return doc ? toUserRecord(doc) : null;
  },

  async existsByEmail(email) {
    const existing = await UserModel.exists({ email: email.trim().toLowerCase() });
    return existing !== null;
  },

  async addWatchlistItem(userId, item: MovieSnapshot, max: number): Promise<AddWatchlistResult> {
    if (!isValidId(userId)) return { status: 'missing' };

    // Atomic guard against two concurrent adds of the same movie, and against
    // concurrent adds pushing the embedded array past its cap.
    const result = await UserModel.updateOne(
      {
        _id: new mongoose.Types.ObjectId(userId),
        'watchlist.movieId': { $ne: item.movieId },
        $expr: { $lt: [{ $size: '$watchlist' }, max] },
      },
      { $push: { watchlist: { ...item, addedAt: new Date() } } },
    ).exec();

    if (result.matchedCount > 0) {
      const user = await findUserById(userId);
      if (!user) return { status: 'missing' };
      return { status: 'added', user };
    }

    const current = await findUserById(userId);
    if (!current) return { status: 'missing' };
    if (current.watchlist.some((entry) => entry.movieId === item.movieId)) {
      return { status: 'duplicate' };
    }
    return { status: 'full' };
  },

  async removeWatchlistItem(userId, movieId) {
    if (!isValidId(userId)) return false;
    const result = await UserModel.updateOne(
      { _id: new mongoose.Types.ObjectId(userId), 'watchlist.movieId': movieId },
      { $pull: { watchlist: { movieId } } },
    ).exec();
    return result.matchedCount > 0;
  },
};

export const mongoReviews: ReviewRepository = {
  async listByMovie(movieId, { skip, limit }) {
    const filter = { tmdbMovieId: movieId };

    const [docs, count, aggregate] = await Promise.all([
      ReviewModel.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).exec(),
      ReviewModel.countDocuments(filter).exec(),
      ReviewModel.aggregate<{ _id: null; average: number }>([
        { $match: filter },
        { $group: { _id: null, average: { $avg: '$rating' } } },
      ]).exec(),
    ]);

    const average = aggregate[0]?.average;
    return {
      count,
      averageRating: typeof average === 'number' ? Math.round(average * 10) / 10 : null,
      results: docs.map(toReviewRecord),
    };
  },

  async upsert(userId, userName, movieId, input: ReviewInput) {
    if (!isValidId(userId)) {
      throw new ApiError(401, 'This account no longer exists.');
    }

    const doc = await ReviewModel.findOneAndUpdate(
      { user: new mongoose.Types.ObjectId(userId), tmdbMovieId: movieId },
      { $set: { rating: input.rating, title: input.title, body: input.body, userName } },
      { returnDocument: 'after', upsert: true, runValidators: true, setDefaultsOnInsert: true },
    ).exec();

    if (!doc) throw new ApiError(500, 'Could not save the review.');
    return toReviewRecord(doc);
  },

  async deleteOwned(reviewId, movieId, userId) {
    if (!isValidId(reviewId) || !isValidId(userId)) return false;

    const doc = await ReviewModel.findOneAndDelete({
      _id: new mongoose.Types.ObjectId(reviewId),
      tmdbMovieId: movieId,
      user: new mongoose.Types.ObjectId(userId),
    }).exec();

    return doc !== null;
  },
};
