import type { Request, Response } from 'express';
import * as tmdb from '../lib/tmdb.js';
import {
  parseOptionalQuery,
  parseOptionalRating,
  parseOptionalYear,
  parsePage,
  parsePositiveId,
  parseSearchQuery,
} from '../lib/validation.js';
import { parseTvSortBy, resolveTvGenre } from '../lib/discover.js';
import { catalogFilterTv } from '../services/fallbackCatalog.js';
import type { QueryInterpretation, TvDiscoverFilters } from '../types.js';

/**
 * Series feed: TMDB `/discover/tv` sorted by popularity, with the bundled
 * series catalog served whenever TMDB is unavailable.
 */
export async function listTvShows(req: Request, res: Response): Promise<void> {
  const page = parsePage(req.query.page);
  const result = await tmdb.getTvFeed({ page });
  res.json({
    source: tmdb.tmdbMode() === 'catalog' ? 'catalog' : 'discover',
    ...result,
  });
}

export async function searchTvShows(req: Request, res: Response): Promise<void> {
  const query = parseSearchQuery(req.query.query);
  const page = parsePage(req.query.page);

  const result = await tmdb.searchTv(query, { page });
  res.json({
    query,
    source: tmdb.tmdbMode() === 'catalog' ? 'catalog' : 'search',
    ...result,
  });
}

/**
 * Genre/year/rating discovery against TMDB `/discover/tv`. Year filters use the
 * series first-air-date fields, and genre names resolve against TMDB's TV genre
 * list (its ids differ from the film list).
 */
export async function discoverTvShows(req: Request, res: Response): Promise<void> {
  const page = parsePage(req.query.page);
  const sortBy = parseTvSortBy(req.query.sortBy);
  const year = parseOptionalYear(req.query.year);
  const minRating = parseOptionalRating(req.query.minRating);
  const genre = await resolveTvGenre(parseOptionalQuery(req.query.genre, 'genre'));

  if (!tmdb.isTmdbOffline()) {
    const filters: TvDiscoverFilters = { sort_by: sortBy };
    if (genre) filters.with_genres = String(genre.id);
    if (year !== null) {
      filters['first_air_date.gte'] = `${year}-01-01`;
      filters['first_air_date.lte'] = `${year}-12-31`;
    }
    if (minRating !== null) filters['vote_average.gte'] = minRating;
    if (sortBy === 'vote_average.desc') filters['vote_count.gte'] = 50;

    try {
      const result = await tmdb.discoverTv(filters, { page });
      res.json({ source: 'discover', ...result });
      return;
    } catch (err) {
      // `request` already flipped the process to catalog mode when appropriate.
      console.warn('[tv] live discover failed, using the offline catalog:', (err as Error).message);
    }
  }

  const interpretation: QueryInterpretation = {
    genres: genre ? [genre.name] : [],
    keywords: [],
    yearFrom: year,
    yearTo: year,
    minRating,
    sortBy,
    explanation: 'Filtering the offline series catalog.',
  };

  res.json({
    source: 'catalog',
    ...catalogFilterTv('', interpretation, page),
  });
}

export async function getTvShowDetails(req: Request, res: Response): Promise<void> {
  const showId = parsePositiveId(req.params.id, 'Series');
  const show = await tmdb.getTvDetails(showId);
  res.json(show);
}
