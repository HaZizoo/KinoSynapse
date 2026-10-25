import { z } from 'zod';
import type { Request, Response } from 'express';
import * as tmdb from '../lib/tmdb.js';
import { ApiError } from '../lib/errors.js';
import {
  parseBody,
  parseMovieId,
  parseObjectId,
  parseOptionalQuery,
  parseOptionalRating,
  parseOptionalYear,
  parsePage,
  parseSearchQuery,
} from '../lib/validation.js';
import { currentUser } from '../lib/currentUser.js';
import { reviewRepository } from '../repositories/index.js';
import { catalogFilterMovies } from '../services/fallbackCatalog.js';
import type { DiscoverFilters, Genre, QueryInterpretation, SortOption } from '../types.js';

export async function listLatestMovies(req: Request, res: Response): Promise<void> {
  const page = parsePage(req.query.page);
  const result = await tmdb.getLatestMovies({ page });
  res.json(result);
}

/**
 * Text search against TMDB `/search/movie`. When the key is missing, rejected
 * or rate limited, `tmdb.searchMovies` transparently serves the bundled
 * catalog so the endpoint never fails for an external-service reason.
 */
export async function searchMovies(req: Request, res: Response): Promise<void> {
  const query = parseSearchQuery(req.query.query);
  const page = parsePage(req.query.page);

  const result = await tmdb.searchMovies(query, { page });
  res.json({
    query,
    source: tmdb.tmdbMode() === 'catalog' ? 'catalog' : 'search',
    ...result,
  });
}

const SORT_ALIASES: Record<string, SortOption> = {
  popularity: 'popularity.desc',
  'popularity.desc': 'popularity.desc',
  rating: 'vote_average.desc',
  'vote_average.desc': 'vote_average.desc',
  newest: 'primary_release_date.desc',
  release_date: 'primary_release_date.desc',
  'primary_release_date.desc': 'primary_release_date.desc',
};

function parseSortBy(value: unknown): SortOption {
  if (value === undefined || value === null || value === '') return 'popularity.desc';
  if (typeof value !== 'string') {
    throw new ApiError(400, 'Query parameter "sortBy" must be a string.');
  }

  const sort = SORT_ALIASES[value.trim().toLowerCase()];
  if (!sort) {
    throw new ApiError(
      400,
      'Query parameter "sortBy" must be one of popularity, rating, newest, popularity.desc, vote_average.desc or primary_release_date.desc.',
    );
  }
  return sort;
}

/** Accept either a TMDB genre id or a genre name (case-insensitive). */
async function resolveGenre(value: string | null): Promise<Genre | null> {
  if (!value) return null;

  const genreMap = await tmdb.getGenreMap();
  const byName = genreMap.get(value.toLowerCase());
  if (byName) return byName;

  if (/^\d+$/.test(value)) {
    const id = Number(value);
    const byId = [...genreMap.values()].find((genre) => genre.id === id);
    if (byId) return byId;
  }

  throw new ApiError(400, `Unknown genre "${value}".`);
}

/**
 * Genre/year/rating discovery against TMDB `/discover/movie`, with the same
 * deterministic catalog fallback used by the rest of the API.
 */
export async function discoverMovies(req: Request, res: Response): Promise<void> {
  const page = parsePage(req.query.page);
  const sortBy = parseSortBy(req.query.sortBy);
  const year = parseOptionalYear(req.query.year);
  const minRating = parseOptionalRating(req.query.minRating);
  const genre = await resolveGenre(parseOptionalQuery(req.query.genre, 'genre'));

  if (!tmdb.isTmdbOffline()) {
    const filters: DiscoverFilters = { sort_by: sortBy };
    if (genre) filters.with_genres = String(genre.id);
    if (year !== null) {
      filters['primary_release_date.gte'] = `${year}-01-01`;
      filters['primary_release_date.lte'] = `${year}-12-31`;
    }
    if (minRating !== null) filters['vote_average.gte'] = minRating;
    if (sortBy === 'vote_average.desc') filters['vote_count.gte'] = 50;

    try {
      const result = await tmdb.discoverMovies(filters, { page });
      res.json({ source: 'discover', ...result });
      return;
    } catch (err) {
      // `request` already flipped the process to catalog mode when appropriate.
      console.warn('[movies] live discover failed, using the offline catalog:', (err as Error).message);
    }
  }

  const interpretation: QueryInterpretation = {
    genres: genre ? [genre.name] : [],
    keywords: [],
    yearFrom: year,
    yearTo: year,
    minRating,
    sortBy,
    explanation: 'Filtering the offline catalog.',
  };

  res.json({
    source: 'catalog',
    ...catalogFilterMovies('', interpretation, page),
  });
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
