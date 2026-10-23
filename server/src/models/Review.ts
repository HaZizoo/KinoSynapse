import mongoose, { Schema, type Model, type Types } from 'mongoose';

export interface ReviewDocument {
  user: Types.ObjectId;
  /** Snapshot of the author's display name so review lists need no extra query. */
  userName: string;
  tmdbMovieId: number;
  rating: number;
  title: string;
  body: string;
  createdAt: Date;
  updatedAt: Date;
}

const reviewSchema = new Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    userName: { type: String, required: true, trim: true, maxlength: 80 },
    tmdbMovieId: { type: Number, required: true, index: true },
    rating: {
      type: Number,
      required: true,
      min: 1,
      max: 10,
      validate: {
        validator: Number.isInteger,
        message: 'Rating must be a whole number between 1 and 10.',
      },
    },
    title: { type: String, trim: true, maxlength: 120, default: '' },
    body: { type: String, required: true, trim: true, minlength: 1, maxlength: 5000 },
  },
  { timestamps: true },
);

// One review per user per movie; posting again updates the existing review.
reviewSchema.index({ user: 1, tmdbMovieId: 1 }, { unique: true });
// Serves the public per-movie review feed without a full collection scan.
reviewSchema.index({ tmdbMovieId: 1, createdAt: -1 });

export const ReviewModel: Model<ReviewDocument> = mongoose.model<ReviewDocument>('Review', reviewSchema);
