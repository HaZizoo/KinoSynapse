import { z } from 'zod';
import type { Request, Response } from 'express';
import * as tmdb from '../lib/tmdb.js';
import { interpretMovieQuery, isLlmConfigured } from '../lib/llm.js';
import { interpretLocally } from '../lib/interpret.js';
import { parseBody, parsePage } from '../lib/validation.js';
import { catalogFilterMovies } from '../services/fallbackCatalog.js';
import type {
  DiscoverFilters,
  Genre,
  InterpretationStrategy,
  PaginatedMovies,
  QueryInterpretation,
} from '../types.js';

const semanticSearchSchema = z.object({
  query: z.string().trim().min(2, 'Describe what you want to watch in at least 2 characters.').max(300),
});

interface InterpretationEntry {
  interpretation: QueryInterpretation;
  strategy: InterpretationStrategy;
}

// Pagination asks the same question repeatedly. Cache the interpretation so page
// 2+ does not spend another LLM call (or silently change the filters mid-scroll).
const INTERPRETATION_TTL_MS = 5 * 60 * 1000;
const INTERPRETATION_CACHE_LIMIT = 200;
const interpretationCache = new Map<string, { value: InterpretationEntry; expiresAt: number }>();

function cacheKey(query: string): string {
  return query.toLowerCase().replace(/\s+/g, ' ').trim();
}

function readCachedInterpretation(query: string): InterpretationEntry | null {
  const key = cacheKey(query);
  const entry = interpretationCache.get(key);
  if (!entry) return null;

  if (entry.expiresAt <= Date.now()) {
    interpretationCache.delete(key);
    return null;
  }

  // Refresh insertion order so the oldest entry is evicted first.
  interpretationCache.delete(key);
  interpretationCache.set(key, entry);
  return entry.value;
}

function writeCachedInterpretation(query: string, value: InterpretationEntry): void {
  const key = cacheKey(query);
  interpretationCache.set(key, { value, expiresAt: Date.now() + INTERPRETATION_TTL_MS });

  while (interpretationCache.size > INTERPRETATION_CACHE_LIMIT) {
    const oldest = interpretationCache.keys().next().value;
    if (oldest === undefined) break;
    interpretationCache.delete(oldest);
  }
}

function clampYear(value: number | null): number | null {
  if (value === null) return null;
  const year = Math.trunc(value);
  if (!Number.isFinite(year) || year < 1900 || year > 2100) return null;
  return year;
}

function buildFilters(
  interpretation: QueryInterpretation,
  genreIds: readonly number[],
): { filters: DiscoverFilters } {
  const filters: DiscoverFilters = {
    sort_by: interpretation.sortBy,
  };

  if (genreIds.length > 0) filters.with_genres = genreIds.join(',');

  const yearFrom = clampYear(interpretation.yearFrom);
  const yearTo = clampYear(interpretation.yearTo);
  if (yearFrom !== null) filters['primary_release_date.gte'] = `${yearFrom}-01-01`;
  if (yearTo !== null) filters['primary_release_date.lte'] = `${yearTo}-12-31`;

  if (
    typeof interpretation.minRating === 'number' &&
    interpretation.minRating > 0 &&
    interpretation.minRating <= 10
  ) {
    filters['vote_average.gte'] = interpretation.minRating;
  }

  // Best-rated sorting surfaces obscure titles without a vote floor.
  if (filters.sort_by === 'vote_average.desc') filters['vote_count.gte'] = 100;

  return { filters };
}

function hasDiscoverFilters(filters: DiscoverFilters): boolean {
  return Boolean(
    filters.with_genres ||
      filters.with_keywords ||
      filters['primary_release_date.gte'] ||
      filters['primary_release_date.lte'] ||
      filters['vote_average.gte'],
  );
}

interface LiveSearchResult {
  result: PaginatedMovies;
  source: 'discover' | 'search';
  keywordIds: number[];
}

async function runLiveSearch(
  query: string,
  page: number,
  interpretation: QueryInterpretation,
  matchedGenres: readonly Genre[],
): Promise<LiveSearchResult> {
  const keywordIds = await tmdb.resolveKeywordIds(interpretation.keywords);

  const { filters } = buildFilters(interpretation, matchedGenres.map((genre) => genre.id));
  if (keywordIds.length > 0) filters.with_keywords = keywordIds.join('|');

  let result: PaginatedMovies;
  let source: 'discover' | 'search';

  if (hasDiscoverFilters(filters)) {
    try {
      result = await tmdb.discoverMovies(filters, { page });
      source = 'discover';
    } catch (err) {
      // A rejected discover request should still get one text-search attempt.
      console.error('[search] discover failed, falling back to text search:', (err as Error).message);
      result = await tmdb.searchMovies(query, { page });
      source = 'search';
    }

    // If the structured filters were valid but too narrow, try the raw text.
    if (source === 'discover' && result.totalResults === 0) {
      result = await tmdb.searchMovies(query, { page });
      source = 'search';
    }
  } else {
    result = await tmdb.searchMovies(query, { page });
    source = 'search';
  }

  return { result, source, keywordIds };
}

export async function semanticSearch(req: Request, res: Response): Promise<void> {
  const { query } = parseBody(semanticSearchSchema, req.body);
  const page = parsePage(req.query.page);

  // A failure of the genre list alone should not take down semantic search.
  let genreMap = new Map<string, Genre>();
  try {
    genreMap = await tmdb.getGenreMap();
  } catch (err) {
    console.error('[search] genre lookup failed:', (err as Error).message);
  }

  const genreNames = [...genreMap.values()].map((genre) => genre.name);

  let entry = readCachedInterpretation(query);
  if (!entry) {
    let interpretation: QueryInterpretation;
    let strategy: InterpretationStrategy = 'heuristic';

    if (isLlmConfigured()) {
      try {
        interpretation = await interpretMovieQuery(query, genreNames);
        strategy = 'llm';
      } catch (err) {
        // A missing or failing provider must not break search: fall back to the
        // deterministic interpreter rather than returning an error.
        console.warn('[search] LLM interpretation unavailable:', (err as Error).message);
        interpretation = interpretLocally(query);
      }
    } else {
      interpretation = interpretLocally(query);
    }

    entry = { interpretation, strategy };
    writeCachedInterpretation(query, entry);
  }

  const { interpretation, strategy } = entry;

  const matchedGenres = interpretation.genres
    .map((name) => genreMap.get(name.trim().toLowerCase()))
    .filter((genre): genre is Genre => Boolean(genre));

  const interpretationPayload = {
    ...interpretation,
    strategy,
    matchedGenres: matchedGenres.map((genre) => genre.name),
    matchedKeywordIds: [] as number[],
  };

  if (!tmdb.isTmdbOffline()) {
    try {
      const live = await runLiveSearch(query, page, interpretation, matchedGenres);
      res.json({
        query,
        source: live.source,
        interpretation: { ...interpretationPayload, matchedKeywordIds: live.keywordIds },
        ...live.result,
      });
      return;
    } catch (err) {
      // Network failures mid-request land here; the local catalog still answers.
      console.warn('[search] live search failed, using the offline catalog:', (err as Error).message);
    }
  }

  const result = catalogFilterMovies(query, interpretation, page);
  res.json({
    query,
    source: 'catalog',
    interpretation: interpretationPayload,
    ...result,
  });
}
