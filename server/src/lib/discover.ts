import { ApiError } from './errors.js';
import * as tmdb from './tmdb.js';
import type { Genre, SortOption } from '../types.js';

/**
 * Shared parsing for `/discover` style endpoints. Films and series use separate
 * TMDB sort keys and genre lists, so each gets its own alias table.
 */

const MOVIE_SORT_ALIASES: Record<string, SortOption> = {
  popularity: 'popularity.desc',
  'popularity.desc': 'popularity.desc',
  rating: 'vote_average.desc',
  'vote_average.desc': 'vote_average.desc',
  newest: 'primary_release_date.desc',
  release_date: 'primary_release_date.desc',
  'primary_release_date.desc': 'primary_release_date.desc',
};

const TV_SORT_ALIASES: Record<string, SortOption> = {
  popularity: 'popularity.desc',
  'popularity.desc': 'popularity.desc',
  rating: 'vote_average.desc',
  'vote_average.desc': 'vote_average.desc',
  newest: 'first_air_date.desc',
  first_air_date: 'first_air_date.desc',
  'first_air_date.desc': 'first_air_date.desc',
};

function parseSort(
  value: unknown,
  aliases: Record<string, SortOption>,
  message: string,
): SortOption {
  if (value === undefined || value === null || value === '') return 'popularity.desc';
  if (typeof value !== 'string') {
    throw new ApiError(400, 'Query parameter "sortBy" must be a string.');
  }

  const sort = aliases[value.trim().toLowerCase()];
  if (!sort) throw new ApiError(400, message);
  return sort;
}

export function parseMovieSortBy(value: unknown): SortOption {
  return parseSort(
    value,
    MOVIE_SORT_ALIASES,
    'Query parameter "sortBy" must be one of popularity, rating, newest, popularity.desc, vote_average.desc or primary_release_date.desc.',
  );
}

export function parseTvSortBy(value: unknown): SortOption {
  return parseSort(
    value,
    TV_SORT_ALIASES,
    'Query parameter "sortBy" must be one of popularity, rating, newest, popularity.desc, vote_average.desc or first_air_date.desc.',
  );
}

/** Accept either a TMDB genre id or a genre name (case-insensitive). */
async function resolveGenreFrom(
  value: string | null,
  genreMap: Map<string, Genre>,
): Promise<Genre | null> {
  if (!value) return null;

  const byName = genreMap.get(value.toLowerCase());
  if (byName) return byName;

  if (/^\d+$/.test(value)) {
    const id = Number(value);
    const byId = [...genreMap.values()].find((genre) => genre.id === id);
    if (byId) return byId;
  }

  throw new ApiError(400, `Unknown genre "${value}".`);
}

export function resolveGenre(value: string | null): Promise<Genre | null> {
  return tmdb.getGenreMap().then((genreMap) => resolveGenreFrom(value, genreMap));
}

export function resolveTvGenre(value: string | null): Promise<Genre | null> {
  return tmdb.getTvGenreMap().then((genreMap) => resolveGenreFrom(value, genreMap));
}
