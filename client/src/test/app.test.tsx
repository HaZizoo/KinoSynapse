import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import App from '../App';
import type { MovieDetails, MovieSummary, WatchlistItem } from '../api/types';

const matrix: MovieSummary = {
  id: 603,
  title: 'The Matrix',
  overview: 'A hacker learns the truth about his reality.',
  releaseDate: '1999-03-31',
  posterUrl: 'https://image.tmdb.org/t/p/w500/matrix.jpg',
  backdropUrl: 'https://image.tmdb.org/t/p/w1280/matrix-backdrop.jpg',
  rating: { average: 8.2, count: 25_000 },
  popularity: 100,
};

const dune: MovieSummary = {
  id: 438631,
  title: 'Dune',
  overview: 'A noble family becomes embroiled in a war for a desert planet.',
  releaseDate: '2021-09-15',
  posterUrl: null,
  backdropUrl: null,
  rating: { average: 7.8, count: 12_000 },
  popularity: 90,
};

const cowboys: MovieSummary = {
  id: 49849,
  title: 'Cowboys & Aliens',
  overview: 'A stranger arrives in a desert town with no memory.',
  releaseDate: '2011-07-29',
  posterUrl: null,
  backdropUrl: null,
  rating: { average: 5.6, count: 5000 },
  popularity: 40,
};

const latestPayload = {
  page: 1,
  totalPages: 2,
  totalResults: 45,
  results: [matrix, dune],
};

const semanticPayload = {
  query: 'space cowboys',
  source: 'discover' as const,
  interpretation: {
    genres: ['Science Fiction'],
    keywords: ['space western'],
    yearFrom: 1990,
    yearTo: 1999,
    minRating: 7,
    sortBy: 'popularity.desc',
    explanation: 'Science-fiction westerns released in the 1990s.',
    matchedGenres: ['Science Fiction'],
    matchedKeywordIds: [12345],
  },
  page: 1,
  totalPages: 1,
  totalResults: 1,
  results: [cowboys],
};

const detailPayload: MovieDetails = {
  ...matrix,
  originalTitle: 'The Matrix',
  tagline: 'Welcome to the Real World.',
  status: 'Released',
  runtime: 136,
  genres: [
    { id: 28, name: 'Action' },
    { id: 878, name: 'Science Fiction' },
  ],
  certification: 'R',
  homepage: null,
  director: { id: 1, name: 'Lana Wachowski' },
  cast: [
    { id: 2, name: 'Keanu Reeves', character: 'Neo', profileUrl: null },
    { id: 3, name: 'Carrie-Anne Moss', character: 'Trinity', profileUrl: null },
  ],
  trailer: { key: 'vKQi3bBA1y8', name: 'Trailer', site: 'YouTube' },
  budget: 0,
  revenue: 0,
};

const mockUser = { id: 'user-1', name: 'Ada', email: 'ada@example.com', watchlist: [], createdAt: '' };

function respond(body: unknown, status = 200): Response {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: async () => body,
  } as unknown as Response;
}

function installApiMock() {
  const watchlist: WatchlistItem[] = [];

  const fetchMock = vi.fn(async (input: RequestInfo | URL, init: RequestInit = {}): Promise<Response> => {
    const url = new URL(String(input), 'http://localhost');
    const method = (init.method ?? 'GET').toUpperCase();

    if (url.pathname === '/api/movies' && method === 'GET') {
      const page = Number(url.searchParams.get('page') ?? 1);
      return respond({
        ...latestPayload,
        page,
        results: page === 1 ? latestPayload.results : [],
      });
    }

    if (url.pathname === '/api/movies/603' && method === 'GET') {
      return respond(detailPayload);
    }

    if (url.pathname === '/api/search/semantic' && method === 'POST') {
      return respond(semanticPayload);
    }

    if (url.pathname === '/api/auth/login' && method === 'POST') {
      return respond({ token: 'mock-token', user: mockUser });
    }

    if (url.pathname === '/api/auth/me' && method === 'GET') {
      return respond({ user: mockUser });
    }

    if (url.pathname === '/api/watchlist' && method === 'GET') {
      return respond({ count: watchlist.length, watchlist });
    }

    if (url.pathname === '/api/watchlist' && method === 'POST') {
      const { movieId } = JSON.parse(String(init.body)) as { movieId: number };
      const item: WatchlistItem = {
        movieId,
        title: movieId === 603 ? 'The Matrix' : 'Dune',
        posterUrl: null,
        releaseDate: '1999-03-31',
        voteAverage: 8.2,
        addedAt: new Date().toISOString(),
      };
      watchlist.push(item);
      return respond({ item, count: watchlist.length, watchlist }, 201);
    }

    if (url.pathname.startsWith('/api/watchlist/') && method === 'DELETE') {
      const movieId = Number(url.pathname.split('/').pop());
      const index = watchlist.findIndex((entry) => entry.movieId === movieId);
      if (index >= 0) watchlist.splice(index, 1);
      return respond(null, 204);
    }

    return respond({ error: { message: `Unhandled ${method} ${url.pathname}` } }, 404);
  });

  vi.stubGlobal('fetch', fetchMock);
  return fetchMock;
}

beforeEach(() => {
  window.localStorage.clear();
  window.history.pushState({}, '', '/');
});

describe('KinoSynapse frontend', () => {
  it('renders the latest releases feed on load', async () => {
    installApiMock();
    render(<App />);

    expect(
      screen.getByRole('heading', { level: 1, name: /tell us the vibe/i }),
    ).toBeInTheDocument();

    expect(await screen.findByRole('heading', { name: 'Latest releases' })).toBeInTheDocument();
    expect(await screen.findByRole('heading', { name: 'The Matrix' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Dune' })).toBeInTheDocument();
    expect(screen.getByText('45')).toBeInTheDocument();
    expect(screen.getByText('Newest first')).toBeInTheDocument();

    const cards = screen.getAllByRole('link', { name: /view details for/i });
    expect(cards.length).toBe(2);
  });

  it('submits a natural-language query to the semantic search endpoint', async () => {
    const fetchMock = installApiMock();
    const user = userEvent.setup();
    render(<App />);

    await screen.findByText('The Matrix');

    await user.type(
      screen.getByLabelText('Describe the movie you want to watch'),
      'space cowboys',
    );
    await user.click(screen.getByRole('button', { name: /interpret/i }));

    expect(await screen.findByText('AI interpretation')).toBeInTheDocument();
    expect(
      await screen.findByText('Science-fiction westerns released in the 1990s.'),
    ).toBeInTheDocument();
    expect(
      await screen.findByRole('heading', { name: 'Cowboys & Aliens' }),
    ).toBeInTheDocument();
    expect(screen.getByText('Picked for you')).toBeInTheDocument();

    const searchCall = fetchMock.mock.calls.find(([url]) =>
      String(url).includes('/api/search/semantic'),
    );
    expect(searchCall).toBeTruthy();
    expect(JSON.parse(String(searchCall?.[1]?.body))).toEqual({ query: 'space cowboys' });
  });

  it('loads cast, ratings, and trailer on the movie detail route', async () => {
    window.history.pushState({}, '', '/movies/603');
    installApiMock();
    render(<App />);

    expect(
      await screen.findByRole('heading', { level: 1, name: 'The Matrix' }),
    ).toBeInTheDocument();
    expect(await screen.findByText('Keanu Reeves')).toBeInTheDocument();
    expect(screen.getByText('Neo')).toBeInTheDocument();
    // Cast portraits are null in this payload, so the initials avatar renders.
    expect(screen.getByText('KR')).toBeInTheDocument();
    expect(screen.getByText('CM')).toBeInTheDocument();
    expect(screen.getAllByText('8.2').length).toBeGreaterThan(0);
    expect(screen.getByText('Welcome to the Real World.')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /watch trailer/i })).toHaveAttribute(
      'href',
      'https://www.youtube.com/watch?v=vKQi3bBA1y8',
    );
    expect(
      screen.getByRole('button', { name: /add the matrix to your watchlist/i }),
    ).toBeInTheDocument();
  });

  it('requires sign-in, then saves a movie with the JWT watchlist route', async () => {
    const fetchMock = installApiMock();
    const user = userEvent.setup();
    render(<App />);

    await screen.findByText('The Matrix');

    await user.click(
      screen.getByRole('button', { name: /add the matrix to your watchlist/i }),
    );

    const authDialog = document.querySelector('dialog') as HTMLDialogElement;
    expect(authDialog.open).toBe(true);
    expect(
      within(authDialog).getByRole('heading', { name: 'Pick up where you left off.' }),
    ).toBeInTheDocument();

    await user.type(within(authDialog).getByLabelText('Email'), 'ada@example.com');
    await user.type(within(authDialog).getByLabelText('Password'), 'password123');
    await user.click(within(authDialog).getByRole('button', { name: 'Sign in to your account' }));

    await waitFor(() => expect(authDialog.open).toBe(false));

    await user.click(
      screen.getByRole('button', { name: /add the matrix to your watchlist/i }),
    );

    expect(
      await screen.findByRole('button', { name: /remove the matrix from your watchlist/i }),
    ).toBeInTheDocument();

    const addCall = fetchMock.mock.calls.find(
      ([url, init]) => String(url).endsWith('/api/watchlist') && init?.method === 'POST',
    );
    expect(addCall).toBeTruthy();
    const headers = addCall?.[1]?.headers as Record<string, string>;
    expect(headers.Authorization).toBe('Bearer mock-token');
  });
});
