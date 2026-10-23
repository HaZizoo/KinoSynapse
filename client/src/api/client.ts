import type {
  AddWatchlistResponse,
  ApiErrorDetail,
  AuthCredentials,
  AuthResponse,
  MeResponse,
  MovieDetails,
  PaginatedMovies,
  RegisterInput,
  SemanticSearchResponse,
  WatchlistResponse,
} from './types';

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL ?? '').replace(/\/$/, '');
const REQUEST_TIMEOUT_MS = 20_000;

export class ApiError extends Error {
  readonly status: number;
  readonly details?: ApiErrorDetail[];

  constructor(message: string, status = 0, details?: ApiErrorDetail[]) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.details = details;
  }
}

export interface RequestOptions {
  method?: 'GET' | 'POST' | 'DELETE';
  body?: unknown;
  token?: string | null;
  signal?: AbortSignal;
}

interface ErrorPayload {
  error?: {
    message?: string;
    details?: ApiErrorDetail[];
  };
}

async function request<T>(path: string, { method = 'GET', body, token, signal }: RequestOptions = {}): Promise<T> {
  const headers: Record<string, string> = { Accept: 'application/json' };
  if (body !== undefined) headers['Content-Type'] = 'application/json';
  if (token) headers.Authorization = `Bearer ${token}`;

  const controller = new AbortController();
  let timedOut = false;
  const timeoutId = window.setTimeout(() => {
    timedOut = true;
    controller.abort();
  }, REQUEST_TIMEOUT_MS);
  const onCallerAbort = (): void => controller.abort(signal?.reason);

  if (signal) {
    if (signal.aborted) controller.abort(signal.reason);
    else signal.addEventListener('abort', onCallerAbort, { once: true });
  }

  let response: Response;
  let payload: unknown = null;

  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
      signal: controller.signal,
    });
    if (response.status !== 204) {
      payload = await response.json().catch((error: unknown) => {
        if (timedOut || signal?.aborted || (error instanceof Error && error.name === 'AbortError')) {
          throw error;
        }
        return null;
      });
    }
  } catch (error) {
    // A caller-initiated abort is not an error the UI should surface.
    if (signal?.aborted) throw error;
    const name = error instanceof Error ? error.name : '';
    if (timedOut || name === 'TimeoutError') {
      throw new ApiError('The movie API took too long to respond. Please try again.');
    }
    if (name === 'AbortError') throw error;
    throw new ApiError('Cannot reach the movie API. Is the server running?');
  } finally {
    window.clearTimeout(timeoutId);
    signal?.removeEventListener('abort', onCallerAbort);
  }

  if (response.status === 204) return null as T;

  if (!response.ok) {
    const errorPayload = payload as ErrorPayload | null;
    throw new ApiError(
      errorPayload?.error?.message ?? `Request failed (${response.status}).`,
      response.status,
      errorPayload?.error?.details,
    );
  }

  if (payload === null) {
    throw new ApiError('The movie API returned an unreadable response.', response.status);
  }

  return payload as T;
}

export function getLatestMovies(page = 1, options: RequestOptions = {}): Promise<PaginatedMovies> {
  return request<PaginatedMovies>(`/api/movies?page=${page}`, options);
}

export function getMovie(movieId: string | number, options: RequestOptions = {}): Promise<MovieDetails> {
  return request<MovieDetails>(`/api/movies/${movieId}`, options);
}

export function semanticSearch(
  query: string,
  page = 1,
  options: RequestOptions = {},
): Promise<SemanticSearchResponse> {
  return request<SemanticSearchResponse>(`/api/search/semantic?page=${page}`, {
    ...options,
    method: 'POST',
    body: { query },
  });
}

export function login(credentials: AuthCredentials): Promise<AuthResponse> {
  return request<AuthResponse>('/api/auth/login', { method: 'POST', body: credentials });
}

export function registerAccount(account: RegisterInput): Promise<AuthResponse> {
  return request<AuthResponse>('/api/auth/register', { method: 'POST', body: account });
}

export function getMe(token: string): Promise<MeResponse> {
  return request<MeResponse>('/api/auth/me', { token });
}

export function getWatchlist(token: string): Promise<WatchlistResponse> {
  return request<WatchlistResponse>('/api/watchlist', { token });
}

export function addToWatchlist(movieId: number, token: string): Promise<AddWatchlistResponse> {
  return request<AddWatchlistResponse>('/api/watchlist', {
    method: 'POST',
    body: { movieId },
    token,
  });
}

export function removeFromWatchlist(movieId: number, token: string): Promise<null> {
  return request<null>(`/api/watchlist/${movieId}`, { method: 'DELETE', token });
}
