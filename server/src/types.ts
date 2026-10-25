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

export type MediaType = 'movie' | 'tv';

/** Shape shared by films and series so cards, grids and search stay generic. */
export interface MediaSummary {
  id: number;
  mediaType: MediaType;
  title: string;
  overview: string;
  /** Release date for films, first air date for series. */
  releaseDate: string | null;
  posterUrl: string | null;
  backdropUrl: string | null;
  rating: RatingSummary;
  popularity: number | null;
}

export interface MovieSummary extends MediaSummary {
  mediaType: 'movie';
}

export interface TvSummary extends MediaSummary {
  mediaType: 'tv';
}

export interface TvSeasonSummary {
  seasonNumber: number;
  name: string;
  overview: string;
  episodeCount: number;
  airDate: string | null;
  posterUrl: string | null;
}

export interface TvDetails extends TvSummary {
  originalTitle: string | null;
  tagline: string | null;
  status: string | null;
  genres: Genre[];
  certification: string | null;
  homepage: string | null;
  creators: Array<{ id: number; name: string }>;
  cast: CastMember[];
  trailer: { key: string; name: string; site: string } | null;
  /** Typical episode length in minutes. */
  episodeRunTime: number | null;
  numberOfSeasons: number;
  numberOfEpisodes: number;
  lastAirDate: string | null;
  inProduction: boolean;
  networks: string[];
  seasons: TvSeasonSummary[];
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

/** Mixed film/series pages used by the cross-media search endpoint. */
export interface PaginatedMedia {
  page: number;
  totalPages: number;
  totalResults: number;
  results: MediaSummary[];
}

export interface PaginatedTv {
  page: number;
  totalPages: number;
  totalResults: number;
  results: TvSummary[];
}

export interface MovieSnapshot {
  movieId: number;
  title: string;
  posterPath: string | null;
  releaseDate: string | null;
  voteAverage: number;
}

export type SortOption =
  | 'popularity.desc'
  | 'vote_average.desc'
  | 'primary_release_date.desc'
  | 'first_air_date.desc';

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

export interface TvDiscoverFilters {
  sort_by: SortOption;
  with_genres?: string;
  'first_air_date.gte'?: string;
  'first_air_date.lte'?: string;
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
