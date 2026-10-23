import type { QueryInterpretation, SortOption } from '../types.js';
import { CATALOG_GENRES, FALLBACK_CATALOG } from '../services/fallbackCatalog.js';

/**
 * Deterministic query interpretation used whenever no LLM key is configured
 * (or the LLM call fails). Same input always yields the same filters, which
 * keeps semantic search fully testable offline.
 */

interface GenreAlias {
  genre: string;
  terms: string[];
}

const GENRE_ALIASES: readonly GenreAlias[] = [
  { genre: 'Science Fiction', terms: ['sci-fi', 'scifi', 'science fiction', 'space', 'futuristic', 'cyberpunk', 'alien', 'dystopian'] },
  { genre: 'Animation', terms: ['animation', 'animated', 'anime', 'cartoon'] },
  { genre: 'Thriller', terms: ['thriller', 'suspense', 'tense', 'psychological'] },
  { genre: 'Drama', terms: ['drama', 'emotional', 'moving', 'character study'] },
  { genre: 'Comedy', terms: ['comedy', 'funny', 'hilarious', 'quirky', 'laugh'] },
  { genre: 'Action', terms: ['action', 'explosive', 'fight', 'martial arts', 'superhero'] },
  { genre: 'Romance', terms: ['romance', 'romantic', 'love story', 'date night'] },
  { genre: 'Horror', terms: ['horror', 'scary', 'creepy', 'terrifying'] },
  { genre: 'Mystery', terms: ['mystery', 'whodunit', 'detective'] },
  { genre: 'Crime', terms: ['crime', 'heist', 'gangster', 'noir'] },
  { genre: 'Adventure', terms: ['adventure', 'epic journey', 'quest'] },
  { genre: 'Family', terms: ['family', 'kids', 'for children'] },
  { genre: 'Music', terms: ['music', 'musical', 'jazz', 'concert'] },
  { genre: 'Fantasy', terms: ['fantasy', 'magic', 'magical'] },
];

const KEYWORD_PHRASES: readonly string[] = [
  'time travel', 'coming of age', 'social satire', 'dark comedy', 'neo-noir',
  'post-apocalyptic', 'artificial intelligence', 'first contact', 'multiverse',
  'heist', 'dream', 'memory', 'dystopia', 'superhero', 'survival', 'isolation',
  'twist', 'friendship', 'family', 'jazz', 'space travel', 'hitman', 'revenge',
];

const CATALOG_TOKENS = new Set(
  FALLBACK_CATALOG.flatMap((movie) => movie.keywords.map((keyword) => keyword.toLowerCase())),
);

const AVAILABLE_GENRES = new Set(CATALOG_GENRES.map((genre) => genre.name));

function findGenres(query: string): string[] {
  const found = new Set<string>();

  for (const alias of GENRE_ALIASES) {
    if (!AVAILABLE_GENRES.has(alias.genre)) continue;
    if (alias.terms.some((term) => query.includes(term))) found.add(alias.genre);
  }

  return [...found].slice(0, 3);
}

function findKeywords(query: string): string[] {
  const found: string[] = [];

  for (const phrase of KEYWORD_PHRASES) {
    if (query.includes(phrase)) found.push(phrase);
  }

  if (found.length === 0) {
    // Fall back to any catalog keyword the request mentions verbatim.
    for (const keyword of CATALOG_TOKENS) {
      if (keyword.length >= 4 && query.includes(keyword)) found.push(keyword);
      if (found.length >= 3) break;
    }
  }

  return [...new Set(found)].slice(0, 3);
}

interface YearBounds {
  yearFrom: number | null;
  yearTo: number | null;
}

function findYears(query: string): YearBounds {
  const range = query.match(/\b(19\d{2}|20\d{2})\s*(?:-|–|to|through|until)\s*(19\d{2}|20\d{2})\b/);
  if (range?.[1] && range[2]) {
    const from = Number(range[1]);
    const to = Number(range[2]);
    return { yearFrom: Math.min(from, to), yearTo: Math.max(from, to) };
  }

  const decade = query.match(/\b((?:19|20)?\d0)['’]?s\b/);
  if (decade?.[1]) {
    const raw = Number(decade[1]);
    const start = decade[1].length === 2 ? (raw >= 30 ? 1900 + raw : 2000 + raw) : raw;
    return { yearFrom: start, yearTo: start + 9 };
  }

  const years = [...query.matchAll(/\b(19\d{2}|20\d{2})\b/g)]
    .map((match) => Number(match[1]))
    .filter((year) => year >= 1900);

  if (years.length === 1 && years[0] !== undefined) {
    return { yearFrom: years[0], yearTo: years[0] };
  }
  if (years.length >= 2 && years[0] !== undefined && years[1] !== undefined) {
    return { yearFrom: Math.min(...years), yearTo: Math.max(...years) };
  }

  if (/\b(recent|newest|latest)\b/.test(query)) {
    return { yearFrom: new Date().getFullYear() - 5, yearTo: null };
  }

  return { yearFrom: null, yearTo: null };
}

function findMinRating(query: string): number | null {
  if (/\b(masterpiece|best|great|greatest|excellent|acclaimed|brilliant|highly rated|top rated|highest rated)\b/.test(query)) {
    return 7.5;
  }
  if (/\b(good|solid|decent)\b/.test(query)) return 7;
  return null;
}

function findSort(query: string, minRating: number | null): SortOption {
  if (/\b(newest|latest|recent)\b/.test(query)) return 'primary_release_date.desc';
  if (minRating !== null || /\b(best|top rated|highest rated|masterpiece)\b/.test(query)) {
    return 'vote_average.desc';
  }
  return 'popularity.desc';
}

function buildExplanation(interpretation: Omit<QueryInterpretation, 'explanation'>): string {
  const parts: string[] = [];

  parts.push(interpretation.genres.length > 0 ? interpretation.genres.join(' / ') : 'films');

  if (interpretation.yearFrom !== null && interpretation.yearTo !== null) {
    parts.push(`released ${interpretation.yearFrom}–${interpretation.yearTo}`);
  } else if (interpretation.yearFrom !== null) {
    parts.push(`from ${interpretation.yearFrom} onwards`);
  } else if (interpretation.yearTo !== null) {
    parts.push(`released up to ${interpretation.yearTo}`);
  }

  if (interpretation.minRating !== null) {
    parts.push(`rated ${interpretation.minRating} or higher`);
  }

  if (interpretation.keywords.length > 0) {
    parts.push(`about ${interpretation.keywords.join(', ')}`);
  }

  const sentence = `Looking for ${parts.join(' ')}.`;
  return sentence.replace(/\s+/g, ' ').trim().slice(0, 300);
}

export function interpretLocally(rawQuery: string): QueryInterpretation {
  const query = rawQuery.toLowerCase().replace(/\s+/g, ' ').trim();

  const genres = findGenres(query);
  const keywords = findKeywords(query);
  const { yearFrom, yearTo } = findYears(query);
  const minRating = findMinRating(query);
  const sortBy = findSort(query, minRating);

  const base = { genres, keywords, yearFrom, yearTo, minRating, sortBy };
  return { ...base, explanation: buildExplanation(base) };
}
