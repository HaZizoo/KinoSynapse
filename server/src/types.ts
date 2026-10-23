/**
 * Domain types shared by the Express layer, the Mongoose models and the
 * in-memory fallback repository. Keeping one set of shapes means a request
 * behaves identically whether MongoDB is reachable or not.
 */

export interface Genre {
  id: number;
  name: string;
}

export interface RatingSummary {
  average: number;
  count: number;
}

export interface MovieSummary {
  id: number;
  title: string;
  overview: string;
  releaseDate: string | null;
  posterUrl: string | null;
  backdropUrl: string | null;
  rating: RatingSummary;
  popularity: number | null;
}

export interface CastMember {
  id: number;
  name: string;
  character: string | null;
  profileUrl: string | null;
}

export interface MovieDetails extends MovieSummary {
  originalTitle: string | null;
  tagline: string | null;
  status: string | null;
  runtime: number | null;
  genres: Genre[];
  certification: string | null;
  homepage: string | null;
  director: { id: number; name: string } | null;
  cast: CastMember[];
  trailer: { key: string; name: string; site: string } | null;
  budget: number | null;
  revenue: number | null;
}

export interface PaginatedMovies {
  page: number;
  totalPages: number;
  totalResults: number;
  results: MovieSummary[];
}

export interface MovieSnapshot {
  movieId: number;
  title: string;
  posterPath: string | null;
  releaseDate: string | null;
  voteAverage: number;
}

export type SortOption = 'popularity.desc' | 'vote_average.desc' | 'primary_release_date.desc';

export interface QueryInterpretation {
  genres: string[];
  keywords: string[];
  yearFrom: number | null;
  yearTo: number | null;
  minRating: number | null;
  sortBy: SortOption;
  explanation: string;
}

export type InterpretationStrategy = 'llm' | 'heuristic';

export interface DiscoverFilters {
  sort_by: SortOption;
  with_genres?: string;
  with_keywords?: string;
  'primary_release_date.gte'?: string;
  'primary_release_date.lte'?: string;
  'vote_average.gte'?: number;
  'vote_count.gte'?: number;
}

/** Stored watchlist entry, shared by MongoDB documents and memory records. */
export interface WatchlistItem {
  movieId: number;
  title: string;
  posterPath: string | null;
  releaseDate: string | null;
  voteAverage: number;
  addedAt: Date;
}

/** Public watchlist entry with a resolved image URL. */
export interface PublicWatchlistItem extends Omit<WatchlistItem, 'posterPath'> {
  posterUrl: string | null;
}

export interface UserRecord {
  id: string;
  name: string;
  email: string;
  passwordHash: string;
  watchlist: WatchlistItem[];
  createdAt: Date;
}

export interface PublicUser {
  id: string;
  name: string;
  email: string;
  watchlist: PublicWatchlistItem[];
  createdAt: Date;
}

export interface ReviewRecord {
  id: string;
  movieId: number;
  rating: number;
  title: string;
  body: string;
  user: { id: string; name: string };
  createdAt: Date;
  updatedAt: Date;
}

export interface ReviewInput {
  rating: number;
  title: string;
  body: string;
}

export interface PaginatedReviews {
  count: number;
  averageRating: number | null;
  results: ReviewRecord[];
}
