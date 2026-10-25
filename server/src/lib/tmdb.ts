import axios from 'axios';
import { env } from '../config/env.js';
import { ApiError } from './errors.js';
import { imageUrl } from './images.js';
import {
  CATALOG_GENRES,
  catalogDetails,
  catalogLatest,
  catalogSnapshot,
  catalogTextSearch,
  FALLBACK_CATALOG,
} from '../services/fallbackCatalog.js';
import type {
  DiscoverFilters,
  Genre,
  MovieDetails,
  MovieSnapshot,
  MovieSummary,
  PaginatedMovies,
} from '../types.js';

interface TmdbMovie {
  id: number;
  title: string;
  overview?: string;
  release_date?: string;
  poster_path?: string | null;
  backdrop_path?: string | null;
  vote_average?: number;
  vote_count?: number;
  popularity?: number;
}

interface TmdbPerson {
  id: number;
  name: string;
  character?: string;
  job?: string;
  profile_path?: string | null;
}

interface TmdbDetails extends TmdbMovie {
  original_title?: string;
  tagline?: string;
  status?: string;
  runtime?: number;
  genres?: Array<{ id: number; name: string }>;
  homepage?: string;
  budget?: number;
  revenue?: number;
  credits?: {
    cast?: TmdbPerson[];
    crew?: TmdbPerson[];
  };
  release_dates?: {
    results?: Array<{
      iso_3166_1?: string;
      release_dates?: Array<{ certification?: string }>;
    }>;
  };
  videos?: {
    results?: Array<{ key: string; name: string; site: string; type: string }>;
  };
}

interface TmdbPaginated<T> {
  page?: number;
  total_pages?: number;
  total_results?: number;
  results?: T[];
}

const http = axios.create({
  baseURL: env.TMDB_BASE_URL,
  timeout: 8_000,
  headers: { Accept: 'application/json' },
});

const PLACEHOLDER_KEY = /^(demo|dummy|test|fake|sample|placeholder|your|replace|changeme|xxx)/i;

/**
 * A TMDB v3 key is 32 hex characters. Anything empty, short or clearly a
 * placeholder means "run from the local catalog" instead of failing requests.
 */
export function isTmdbKeyUsable(key: string): boolean {
  const value = key.trim();
  if (value.length < 16) return false;
  if (PLACEHOLDER_KEY.test(value)) return false;
  if (value.toLowerCase().includes('offline')) return false;
  return true;
}

let offline = !isTmdbKeyUsable(env.TMDB_API_KEY);

export function isTmdbOffline(): boolean {
  return offline;
}

export function tmdbMode(): 'live' | 'catalog' {
  return offline ? 'catalog' : 'live';
}

function markOffline(reason: unknown): void {
  if (offline) return;
  const message = reason instanceof Error ? reason.message : String(reason);
  console.warn(`[tmdb] live API unavailable (${message}). Serving the offline catalog.`);
  offline = true;
}

async function request<T>(path: string, params: Record<string, unknown> = {}): Promise<T> {
  try {
    const { data } = await http.get<T>(path, {
      params: {
        api_key: env.TMDB_API_KEY,
        language: env.TMDB_LANGUAGE,
        ...params,
      },
    });
    return data;
  } catch (err) {
    if (axios.isAxiosError(err) && err.response) {
      const status = err.response.status;
      if (status === 404) {
        throw new ApiError(404, 'Movie not found.');
      }
      if (status === 401 || status === 403) {
        markOffline(`status ${status} (check TMDB_API_KEY)`);
        throw new ApiError(502, 'TMDB rejected the API key. Set a valid TMDB_API_KEY in server/.env.');
      }
      if (status === 429) {
        markOffline('rate limited');
        throw new ApiError(503, 'TMDB is rate limiting requests. Please try again shortly.');
      }
      markOffline(`status ${status}`);
      throw new ApiError(502, `TMDB request failed with status ${status}.`);
    }
    if (axios.isAxiosError(err) && (err.code === 'ECONNABORTED' || err.code === 'ETIMEDOUT')) {
      markOffline('request timed out');
      throw new ApiError(504, 'TMDB request timed out.');
    }
    markOffline(err instanceof Error ? err.message : 'network error');
    throw new ApiError(502, 'Could not reach TMDB.');
  }
}

function roundRating(value: number | undefined): number {
  return Math.round((Number(value) || 0) * 10) / 10;
}

export function toMovieSummary(movie: TmdbMovie): MovieSummary {
  return {
    id: movie.id,
    title: movie.title,
    overview: movie.overview ?? '',
    releaseDate: movie.release_date || null,
    posterUrl: imageUrl(movie.poster_path),
    backdropUrl: imageUrl(movie.backdrop_path, 'w1280'),
    rating: {
      average: roundRating(movie.vote_average),
      count: movie.vote_count ?? 0,
    },
    popularity: movie.popularity ?? null,
  };
}

function toPaginatedMovies(data: TmdbPaginated<TmdbMovie>): PaginatedMovies {
  return {
    page: data.page ?? 1,
    totalPages: Math.min(data.total_pages ?? 0, 500),
    totalResults: data.total_results ?? 0,
    results: (data.results ?? []).map(toMovieSummary),
  };
}

function pickCertification(releaseDates: TmdbDetails['release_dates']): string | null {
  const releases = releaseDates?.results ?? [];
  const us = releases.find((entry) => entry.iso_3166_1 === 'US');
  const usCertification = us?.release_dates?.find((entry) => entry.certification)?.certification;
  if (usCertification) return usCertification;
  return (
    releases
      .flatMap((entry) => entry.release_dates ?? [])
      .find((entry) => entry.certification)?.certification ?? null
  );
}

export function toMovieDetails(movie: TmdbDetails): MovieDetails {
  const crew = movie.credits?.crew ?? [];
  const director = crew.find((person) => person.job === 'Director');
  const trailer = (movie.videos?.results ?? []).find(
    (video) => video.site === 'YouTube' && video.type === 'Trailer',
  );

  return {
    id: movie.id,
    title: movie.title,
    originalTitle: movie.original_title ?? null,
    tagline: movie.tagline || null,
    overview: movie.overview ?? '',
    status: movie.status ?? null,
    releaseDate: movie.release_date || null,
    runtime: movie.runtime ?? null,
    genres: (movie.genres ?? []).map((genre) => ({ id: genre.id, name: genre.name })),
    rating: {
      average: roundRating(movie.vote_average),
      count: movie.vote_count ?? 0,
    },
    certification: pickCertification(movie.release_dates),
    posterUrl: imageUrl(movie.poster_path),
    backdropUrl: imageUrl(movie.backdrop_path, 'w1280'),
    homepage: movie.homepage || null,
    director: director ? { id: director.id, name: director.name } : null,
    cast: (movie.credits?.cast ?? []).slice(0, 20).map((person) => ({
      id: person.id,
      name: person.name,
      character: person.character || null,
      profileUrl: imageUrl(person.profile_path, 'w185'),
    })),
    trailer: trailer ? { key: trailer.key, name: trailer.name, site: trailer.site } : null,
    budget: movie.budget ?? null,
    revenue: movie.revenue ?? null,
    popularity: movie.popularity ?? null,
  };
}

function todayIsoDate(): string {
  return new Date().toISOString().slice(0, 10);
}

function catalogOrThrow<T>(value: T | null): T {
  if (value === null) throw new ApiError(404, 'Movie not found.');
  return value;
}

/**
 * Latest releases, newest first. Paginated so the home page can infinite-scroll.
 */
export async function getLatestMovies({ page = 1 }: { page?: number } = {}): Promise<PaginatedMovies> {
  if (offline) return catalogLatest(page);

  try {
    const data = await request<TmdbPaginated<TmdbMovie>>('/discover/movie', {
      sort_by: 'primary_release_date.desc',
      'primary_release_date.lte': todayIsoDate(),
      'vote_count.gte': 10,
      include_adult: false,
      include_video: false,
      page,
    });
    return toPaginatedMovies(data);
  } catch (err) {
    if (err instanceof ApiError && err.status === 404) throw err;
    markOffline(err instanceof Error ? err.message : 'request failed');
    return catalogLatest(page);
  }
}

/**
 * Full details including cast, crew director, ratings/certification and trailer.
 */
export async function getMovieDetails(movieId: number): Promise<MovieDetails> {
  if (offline) return catalogOrThrow(catalogDetails(movieId));

  try {
    const data = await request<TmdbDetails>(`/movie/${movieId}`, {
      append_to_response: 'credits,release_dates,videos',
    });
    return toMovieDetails(data);
  } catch (err) {
    if (err instanceof ApiError && err.status === 404) throw err;
    markOffline(err instanceof Error ? err.message : 'request failed');
    return catalogOrThrow(catalogDetails(movieId));
  }
}

/**
 * Small snapshot used when saving a movie into a watchlist.
 */
export async function getMovieSnapshot(movieId: number): Promise<MovieSnapshot> {
  if (offline) return catalogOrThrow(catalogSnapshot(movieId));

  try {
    const data = await request<TmdbMovie>(`/movie/${movieId}`);
    return {
      movieId: data.id,
      title: data.title,
      posterPath: data.poster_path ?? null,
      releaseDate: data.release_date || null,
      voteAverage: roundRating(data.vote_average),
    };
  } catch (err) {
    if (err instanceof ApiError && err.status === 404) throw err;
    markOffline(err instanceof Error ? err.message : 'request failed');
    return catalogOrThrow(catalogSnapshot(movieId));
  }
}

export async function searchMovies(query: string, { page = 1 }: { page?: number } = {}): Promise<PaginatedMovies> {
  if (offline) return catalogTextSearch(query, page);

  try {
    const data = await request<TmdbPaginated<TmdbMovie>>('/search/movie', {
      query,
      include_adult: false,
      page,
    });
    return toPaginatedMovies(data);
  } catch (err) {
    // A rejected key, rate limit or outage must never empty the search page.
    markOffline(err instanceof Error ? err.message : 'search request failed');
    return catalogTextSearch(query, page);
  }
}

export async function discoverMovies(
  filters: DiscoverFilters,
  { page = 1 }: { page?: number } = {},
): Promise<PaginatedMovies> {
  if (offline) {
    throw new ApiError(503, 'The live TMDB catalog is unavailable.');
  }

  const data = await request<TmdbPaginated<TmdbMovie>>('/discover/movie', {
    include_adult: false,
    ...filters,
    page,
  });
  return toPaginatedMovies(data);
}

let genreCache: Promise<Map<string, Genre>> | undefined;

function catalogGenreMap(): Map<string, Genre> {
  return new Map(CATALOG_GENRES.map((genre) => [genre.name.toLowerCase(), genre]));
}

/**
 * Map of lowercased TMDB genre name -> genre id, cached for the process lifetime.
 * Offline it is derived from the local catalog so the interpreter still has
 * valid genre names to work with.
 */
export async function getGenreMap(): Promise<Map<string, Genre>> {
  if (offline) return catalogGenreMap();

  if (!genreCache) {
    genreCache = request<{ genres?: Genre[] }>('/genre/movie/list')
      .then((data) => new Map((data.genres ?? []).map((genre) => [genre.name.toLowerCase(), genre])))
      .catch((err: unknown) => {
        genreCache = undefined;
        markOffline(err instanceof Error ? err.message : 'genre lookup failed');
        return catalogGenreMap();
      });
  }

  return genreCache;
}

/**
 * Resolve free-text keywords to TMDB keyword ids (best-effort per keyword).
 */
export async function resolveKeywordIds(keywords: readonly string[]): Promise<number[]> {
  if (offline || keywords.length === 0) return [];

  const ids = await Promise.all(
    keywords.slice(0, 4).map(async (keyword) => {
      try {
        const data = await request<TmdbPaginated<{ id: number }>>('/search/keyword', {
          query: keyword,
          page: 1,
        });
        return data.results?.[0]?.id ?? null;
      } catch {
        return null;
      }
    }),
  );

  return [...new Set(ids.filter((id): id is number => id !== null))];
}

/** Exposed for diagnostics and health reporting. */
export const CATALOG_SIZE = FALLBACK_CATALOG.length;
