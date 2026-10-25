import { useCallback, useEffect, useRef, useState, type FormEvent } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Loader2, Search as SearchIcon, SearchX } from 'lucide-react';
import { searchMedia } from '../api/client';
import type { MediaSummary } from '../api/types';
import { EmptyState, ErrorState } from '../components/Feedback';
import { MovieGrid, MovieGridSkeleton } from '../components/MovieGrid';
import { errorMessage, isAbortError } from '../lib/errors';

interface Results {
  query: string;
  items: MediaSummary[];
  page: number;
  totalPages: number;
  totalResults: number;
}

const EMPTY_RESULTS: Results = { query: '', items: [], page: 0, totalPages: 1, totalResults: 0 };

/**
 * Title search across films and series (`GET /api/search`), independent of the
 * AI vibe search on the dashboard. The query lives in the URL so results can be
 * shared or reloaded.
 */
export default function Search() {
  const [params, setParams] = useSearchParams();
  const urlQuery = params.get('q') ?? '';
  const [input, setInput] = useState(urlQuery);
  const [status, setStatus] = useState<'idle' | 'loading' | 'ready' | 'error'>('idle');
  const [error, setError] = useState('');
  const [results, setResults] = useState<Results>(EMPTY_RESULTS);
  const [loadingMore, setLoadingMore] = useState(false);
  const [moreError, setMoreError] = useState('');
  const requestRef = useRef(0);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    document.title = 'Search films and series — KinoSynapse';
  }, []);

  useEffect(() => () => abortRef.current?.abort(), []);

  const runSearch = useCallback(async (query: string, page = 1) => {
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    const requestId = ++requestRef.current;

    setStatus('loading');
    setError('');
    setMoreError('');
    setLoadingMore(false);

    try {
      const data = await searchMedia(query, page, { signal: controller.signal });
      if (requestId !== requestRef.current) return;
      setResults({
        query,
        items: data.results,
        page: data.page,
        totalPages: data.totalPages,
        totalResults: data.totalResults,
      });
      setStatus('ready');
    } catch (apiError) {
      if (isAbortError(apiError) || requestId !== requestRef.current) return;
      setError(errorMessage(apiError));
      setStatus('error');
    }
  }, []);

  useEffect(() => {
    setInput(urlQuery);
    if (urlQuery.trim().length >= 2) {
      void runSearch(urlQuery.trim(), 1);
    } else {
      abortRef.current?.abort();
      ++requestRef.current;
      setResults(EMPTY_RESULTS);
      setStatus('idle');
    }
    // runSearch is stable; urlQuery is the only input that should retrigger.
  }, [urlQuery, runSearch]);

  function handleSubmit(event: FormEvent<HTMLFormElement>): void {
    event.preventDefault();
    const query = input.trim();
    if (query.length < 2) {
      setError('Type at least 2 characters to search.');
      return;
    }
    setParams({ q: query });
  }

  async function loadMore(): Promise<void> {
    if (loadingMore || results.page === 0 || results.page >= results.totalPages) return;

    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    const requestId = ++requestRef.current;
    setLoadingMore(true);
    setMoreError('');

    try {
      const data = await searchMedia(results.query, results.page + 1, { signal: controller.signal });
      if (requestId !== requestRef.current) return;
      setResults((current) => {
        const seen = new Set(current.items.map((media) => `${media.mediaType ?? 'movie'}-${media.id}`));
        return {
          ...current,
          items: [
            ...current.items,
            ...data.results.filter(
              (media) => !seen.has(`${media.mediaType ?? 'movie'}-${media.id}`),
            ),
          ],
          page: data.page,
          totalPages: data.totalPages,
          totalResults: data.totalResults,
        };
      });
    } catch (apiError) {
      if (isAbortError(apiError) || requestId !== requestRef.current) return;
      setMoreError(errorMessage(apiError));
    } finally {
      if (requestId === requestRef.current) setLoadingMore(false);
    }
  }

  const hasMore = results.page > 0 && results.page < results.totalPages;
  const idle = status === 'idle';

  return (
    <div className="mx-auto max-w-[1440px] px-4 pb-20 pt-10 sm:px-6 lg:px-10">
      <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-accent">
        Films &amp; series
      </p>
      <h1 className="mt-2 font-display text-4xl leading-none text-cream sm:text-5xl">
        Search the catalogue
      </h1>

      <form onSubmit={handleSubmit} role="search" className="mt-6 w-full max-w-2xl">
        <label htmlFor="catalog-search" className="sr-only">
          Search films and series by title
        </label>
        <div
          className={`flex min-w-0 items-center gap-1 border bg-surface p-1.5 transition ${
            error ? 'border-danger' : 'border-line focus-within:border-accent'
          }`}
        >
          <SearchIcon className="ml-2.5 size-4 shrink-0 text-muted" aria-hidden="true" />
          <input
            id="catalog-search"
            type="search"
            value={input}
            onChange={(event) => setInput(event.target.value)}
            placeholder="Breaking Bad, The Matrix, Arcane…"
            maxLength={200}
            className="h-11 min-w-0 flex-1 bg-transparent px-3 text-sm text-cream placeholder:text-muted/70 focus:outline-none"
          />
          <button
            type="submit"
            className="inline-flex h-10 shrink-0 items-center gap-2 bg-accent px-4 text-[11px] font-semibold uppercase tracking-[0.12em] text-canvas transition hover:bg-cream"
          >
            Search
          </button>
        </div>
        {error ? (
          <p role="alert" className="mt-2 text-sm text-danger">
            {error}
          </p>
        ) : null}
      </form>

      <div className="mt-10">
        {status === 'loading' ? (
          <>
            <p className="sr-only" role="status">
              Searching films and series
            </p>
            <MovieGridSkeleton count={10} />
          </>
        ) : status === 'error' ? (
          <ErrorState
            title="Search failed."
            message={error}
            onRetry={() => void runSearch(urlQuery.trim(), 1)}
          />
        ) : idle ? (
          <EmptyState
            icon={SearchIcon}
            title="Find a film or a series."
            message="Search by title. Results show both films and series, and the query is saved in the URL."
            action={
              <button
                type="button"
                onClick={() => {
                  setParams({ q: 'Breaking Bad' });
                }}
                className="border border-line px-5 py-2.5 text-[11px] font-semibold uppercase tracking-[0.16em] text-cream transition hover:border-accent hover:text-accent"
              >
                Try “Breaking Bad”
              </button>
            }
          />
        ) : results.items.length === 0 ? (
          <EmptyState
            icon={SearchX}
            title={`Nothing found for “${results.query}”.`}
            message="Check the spelling, or try a shorter title. Without a TMDB key the offline catalog only knows a handful of titles."
            action={
              <button
                type="button"
                onClick={() => {
                  setInput('');
                  setParams({});
                }}
                className="border border-line px-5 py-2.5 text-[11px] font-semibold uppercase tracking-[0.16em] text-cream transition hover:border-accent hover:text-accent"
              >
                Clear search
              </button>
            }
          />
        ) : (
          <>
            <p className="mb-5 text-xs text-muted">
              <strong className="font-medium text-cream">
                {results.totalResults.toLocaleString()}
              </strong>{' '}
              results for “{results.query}”
            </p>
            <MovieGrid items={results.items} />

            {hasMore ? (
              <div className="mt-12 flex flex-col items-center gap-3">
                <button
                  type="button"
                  onClick={() => void loadMore()}
                  disabled={loadingMore}
                  className="inline-flex items-center gap-2 border border-line px-6 py-3 text-[11px] font-semibold uppercase tracking-[0.16em] text-cream transition hover:border-accent hover:text-accent disabled:opacity-60"
                >
                  {loadingMore ? (
                    <Loader2 className="size-3.5 animate-spin" aria-hidden="true" />
                  ) : null}
                  {loadingMore ? 'Loading' : 'Load more results'}
                </button>
                {moreError ? (
                  <p role="alert" className="text-xs text-danger">
                    {moreError}
                  </p>
                ) : null}
              </div>
            ) : null}
          </>
        )}
      </div>
    </div>
  );
}
