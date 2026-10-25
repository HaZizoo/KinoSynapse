export interface Genre {
  id: number;
  name: string;
}

export interface MovieSummary {
  id: number;
  title: string;
  overview: string;
  releaseDate: string | null;
  posterUrl: string | null;
  backdropUrl: string | null;
  rating: { average: number; count: number };
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

export interface TvSummary {
  id: number;
  mediaType: 'tv';
  title: string;
  overview: string;
  /** First air date. */
  releaseDate: string | null;
  posterUrl: string | null;
  backdropUrl: string | null;
  rating: { average: number; count: number };
  popularity: number | null;
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
  episodeRunTime: number | null;
  numberOfSeasons: number;
  numberOfEpisodes: number;
  lastAirDate: string | null;
  inProduction: boolean;
  networks: string[];
  seasons: TvSeasonSummary[];
}

/** A film or a series, as returned by the mixed search endpoint. */
export type MediaSummary = (MovieSummary & { mediaType?: 'movie' }) | TvSummary;

export interface PaginatedMovies {
  page: number;
  totalPages: number;
  totalResults: number;
  results: MovieSummary[];
}

export interface PaginatedTv {
  page: number;
  totalPages: number;
  totalResults: number;
  results: TvSummary[];
  source?: 'discover' | 'search' | 'catalog';
}

export interface PaginatedMedia {
  page: number;
  totalPages: number;
  totalResults: number;
  results: MediaSummary[];
}

export interface MultiSearchResponse extends PaginatedMedia {
  query: string;
  source: 'search' | 'catalog';
}

export interface QueryInterpretation {
  genres: string[];
  keywords: string[];
  yearFrom: number | null;
  yearTo: number | null;
  minRating: number | null;
  sortBy: string;
  explanation: string;
  matchedGenres?: string[];
  matchedKeywordIds?: number[];
  strategy?: 'llm' | 'heuristic';
}

export interface SemanticSearchResponse extends PaginatedMovies {
  query: string;
  source: 'discover' | 'search' | 'catalog';
  interpretation: QueryInterpretation;
}

export interface WatchlistItem {
  movieId: number;
  title: string;
  posterUrl: string | null;
  releaseDate: string | null;
  voteAverage: number;
  addedAt: string;
}

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  watchlist: WatchlistItem[];
  createdAt: string;
}

export interface AuthResponse {
  token: string;
  user: AuthUser;
}

export interface AuthCredentials {
  email: string;
  password: string;
}

export interface RegisterInput extends AuthCredentials {
  name: string;
}

export interface MeResponse {
  user: AuthUser;
}

export interface WatchlistResponse {
  count: number;
  watchlist: WatchlistItem[];
}

export interface AddWatchlistResponse extends WatchlistResponse {
  item: WatchlistItem;
}

export interface WatchlistCheckResponse {
  movieId: number;
  inWatchlist: boolean;
}

export interface ApiErrorDetail {
  path?: string;
  message?: string;
}
