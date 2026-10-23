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

export interface PaginatedMovies {
  page: number;
  totalPages: number;
  totalResults: number;
  results: MovieSummary[];
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
