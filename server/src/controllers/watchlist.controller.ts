import type { Request, Response } from 'express';
import * as tmdb from '../lib/tmdb.js';
import { ApiError } from '../lib/errors.js';
import { parseBody, parseMovieId, movieIdBodySchema } from '../lib/validation.js';
import { currentUser } from '../lib/currentUser.js';
import { toPublicUser } from '../lib/serializers.js';
import { userRepository } from '../repositories/index.js';
import { MAX_WATCHLIST_ITEMS } from '../models/User.js';

export function getWatchlist(req: Request, res: Response): void {
  const user = toPublicUser(currentUser(req));
  res.json({ count: user.watchlist.length, watchlist: user.watchlist });
}

export async function addToWatchlist(req: Request, res: Response): Promise<void> {
  const { movieId } = parseBody(movieIdBodySchema, req.body);
  const user = currentUser(req);

  if (user.watchlist.some((item) => item.movieId === movieId)) {
    throw new ApiError(409, 'Movie is already in your watchlist.');
  }

  if (user.watchlist.length >= MAX_WATCHLIST_ITEMS) {
    throw new ApiError(400, `Your watchlist can hold at most ${MAX_WATCHLIST_ITEMS} movies.`);
  }

  const movie = await tmdb.getMovieSnapshot(movieId);
  const result = await userRepository().addWatchlistItem(user.id, movie, MAX_WATCHLIST_ITEMS);

  if (result.status === 'missing') {
    throw new ApiError(401, 'This account no longer exists.');
  }
  if (result.status === 'duplicate') {
    throw new ApiError(409, 'Movie is already in your watchlist.');
  }
  if (result.status === 'full') {
    throw new ApiError(400, `Your watchlist can hold at most ${MAX_WATCHLIST_ITEMS} movies.`);
  }

  const safeUser = toPublicUser(result.user);
  const added = safeUser.watchlist.find((item) => item.movieId === movie.movieId);

  res.status(201).json({ item: added, count: safeUser.watchlist.length, watchlist: safeUser.watchlist });
}

export function checkWatchlistItem(req: Request, res: Response): void {
  const movieId = parseMovieId(req.params.movieId);
  res.json({
    movieId,
    inWatchlist: currentUser(req).watchlist.some((item) => item.movieId === movieId),
  });
}

export async function removeFromWatchlist(req: Request, res: Response): Promise<void> {
  const movieId = parseMovieId(req.params.movieId);
  const removed = await userRepository().removeWatchlistItem(currentUser(req).id, movieId);

  if (!removed) {
    throw new ApiError(404, 'Movie is not in your watchlist.');
  }

  res.status(204).end();
}
