import { z } from 'zod';
import type { Request, Response } from 'express';
import * as tmdb from '../lib/tmdb.js';
import { ApiError } from '../lib/errors.js';
import { parseBody, parseMovieId, parseObjectId, parsePage } from '../lib/validation.js';
import { currentUser } from '../lib/currentUser.js';
import { reviewRepository } from '../repositories/index.js';

export async function listLatestMovies(req: Request, res: Response): Promise<void> {
  const page = parsePage(req.query.page);
  const result = await tmdb.getLatestMovies({ page });
  res.json(result);
}

export async function getMovieDetails(req: Request, res: Response): Promise<void> {
  const movieId = parseMovieId(req.params.id);
  const movie = await tmdb.getMovieDetails(movieId);
  res.json(movie);
}

const REVIEW_PAGE_SIZE = 50;

export async function listMovieReviews(req: Request, res: Response): Promise<void> {
  const movieId = parseMovieId(req.params.id);
  const page = parsePage(req.query.page);

  const { count, averageRating, results } = await reviewRepository().listByMovie(movieId, {
    skip: (page - 1) * REVIEW_PAGE_SIZE,
    limit: REVIEW_PAGE_SIZE,
  });

  res.json({
    movieId,
    page,
    totalPages: Math.ceil(count / REVIEW_PAGE_SIZE),
    count,
    averageRating,
    results,
  });
}

const reviewInputSchema = z.object({
  rating: z.coerce
    .number()
    .int('Rating must be a whole number between 1 and 10.')
    .min(1, 'Rating must be between 1 and 10.')
    .max(10, 'Rating must be between 1 and 10.'),
  title: z.string().trim().max(120).optional().default(''),
  body: z.string().trim().min(1, 'Review text is required.').max(5000),
});

export async function upsertMovieReview(req: Request, res: Response): Promise<void> {
  const movieId = parseMovieId(req.params.id);
  const input = parseBody(reviewInputSchema, req.body);
  const user = currentUser(req);

  // Only reviews for movies the catalog knows about are accepted.
  await tmdb.getMovieSnapshot(movieId);

  const review = await reviewRepository().upsert(user.id, user.name, movieId, input);
  res.json({ review });
}

export async function deleteMovieReview(req: Request, res: Response): Promise<void> {
  const movieId = parseMovieId(req.params.id);
  const reviewId = parseObjectId(req.params.reviewId, 'Review id');
  const user = currentUser(req);

  const removed = await reviewRepository().deleteOwned(reviewId, movieId, user.id);
  if (!removed) {
    throw new ApiError(404, 'Review not found.');
  }

  res.status(204).end();
}
