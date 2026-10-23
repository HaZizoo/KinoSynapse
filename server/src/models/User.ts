import mongoose, { Schema, type Model } from 'mongoose';
import { env } from '../config/env.js';
import type { WatchlistItem } from '../types.js';

export const MAX_WATCHLIST_ITEMS = env.MAX_WATCHLIST_ITEMS;

export interface UserDocument {
  name: string;
  email: string;
  passwordHash: string;
  watchlist: WatchlistItem[];
  createdAt: Date;
  updatedAt: Date;
}

const watchlistItemSchema = new Schema(
  {
    movieId: {
      type: Number,
      required: true,
      min: 1,
      validate: {
        validator: Number.isInteger,
        message: 'movieId must be an integer.',
      },
    },
    title: { type: String, required: true, trim: true, maxlength: 300 },
    posterPath: { type: String, default: null },
    releaseDate: { type: String, default: null },
    voteAverage: { type: Number, default: 0, min: 0, max: 10 },
    addedAt: { type: Date, default: Date.now },
  },
  { _id: false },
);

const userSchema = new Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 80 },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      maxlength: 254,
    },
    passwordHash: { type: String, required: true, select: false },
    watchlist: {
      type: [watchlistItemSchema],
      default: [],
      validate: {
        validator: (items: WatchlistItem[]) => items.length <= MAX_WATCHLIST_ITEMS,
        message: `A watchlist can contain at most ${MAX_WATCHLIST_ITEMS} movies.`,
      },
    },
  },
  { timestamps: true },
);

export const UserModel: Model<UserDocument> = mongoose.model<UserDocument>('User', userSchema);
