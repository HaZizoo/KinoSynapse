import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import { ArrowDownWideNarrow, Loader2, SearchX, Sparkles, type LucideIcon } from 'lucide-react';
import { getLatestMovies, getTvShows, semanticSearch } from '../api/client';
import type { MediaSummary, QueryInterpretation } from '../api/types';
import { AiSearchBar } from '../components/AiSearchBar';
import { EmptyState, ErrorState } from '../components/Feedback';
import { MovieGrid, MovieGridSkeleton } from '../components/MovieGrid';
import { SearchInterpretation } from '../components/SearchInterpretation';
import { errorMessage, isAbortError } from '../lib/errors';

type Tab = 'films' | 'series';
type FeedMode = 'latest' | 'semantic' | 'series';

interface Feed {
  mode: FeedMode;
  items: MediaSummary[];
  page: number;
  totalPages: number;
  totalResults: number;
}

interface SearchState {
  query: string;
  pending: boolean;
  error: string;
  interpretation: QueryInterpretation | null;
}

interface EmptyStateConfig {
  icon: LucideIcon;
  title: string;
  message: string;
  action: ReactNode;
}

function mediaKey(media: MediaSummary): string {
  return `${media.mediaType ?? 'movie'}-${media.id}`;
}

const EMPTY_FEED: Feed = { mode: 'latest', items: [], page: 0, totalPages: 1, totalResults: 0 };
const EMPTY_SEARCH: SearchState = { query: '', pending: false, error: '', interpretation: null };

const TABS: Array<{ id: Tab; label: string }> = [
  { id: 'films', label: 'Films' },
  { id: 'series', label: 'Series' },
];

export default function Dashboard() {
  const [tab, setTab] = useState<Tab>('films');
  const [input, setInput] = useState('');
  const [feed, setFeed] = useState<Feed>(EMPTY_FEED);
  const [feedStatus, setFeedStatus] = useState<'loading' | 'ready' | 'error'>('loading');
  const [feedError, setFeedError] = useState('');
  const [search, setSearch] = useState<SearchState>(EMPTY_SEARCH);
  const [loadingMore, setLoadingMore] = useState(false);
  const [moreError, setMoreError] = useState('');
  const requestRef = useRef(0);
  const abortRef = useRef<AbortController | null>(null);
  const sentinelRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    document.title = 'KinoSynapse — Find films by feeling';
  }, []);

  useEffect(() => () => abortRef.current?.abort(), []);

  const beginRequest = useCallback(() => {
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    return controller;
  }, []);

  const loadFilms = useCallback(
    async (page = 1) => {
      const controller = beginRequest();
      const requestId = ++requestRef.current;
      setFeedStatus('loading');
      setFeedError('');
      setMoreError('');
      setLoadingMore(false);

      try {
        const data = await getLatestMovies(page, { signal: controller.signal });
        if (requestId !== requestRef.current) return;
        setFeed({
          mode: 'latest',
          items: data.results,
          page: data.page,
          totalPages: data.totalPages,
          totalResults: data.totalResults,
        });
        setFeedStatus('ready');
      } catch (error) {
        if (isAbortError(error) || requestId !== requestRef.current) return;
        setFeedStatus('error');
        setFeedError(errorMessage(error));
      }
    },
    [beginRequest],
  );

  const loadSeries = useCallback(
    async (page = 1) => {
      const controller = beginRequest();
      const requestId = ++requestRef.current;
      setFeedStatus('loading');
      setFeedError('');
      setMoreError('');
      setLoadingMore(false);

      try {
        const data = await getTvShows(page, { signal: controller.signal });
        if (requestId !== requestRef.current) return;
        setFeed({
          mode: 'series',
          items: data.results,
          page: data.page,
          totalPages: data.totalPages,
          totalResults: data.totalResults,
        });
        setFeedStatus('ready');
      } catch (error) {
        if (isAbortError(error) || requestId !== requestRef.current) return;
        setFeedStatus('error');
        setFeedError(errorMessage(error));
      }
    },
    [beginRequest],
  );

  useEffect(() => {
    void loadFilms(1);
  }, [loadFilms]);

  const handleSearch = useCallback(
    async (rawQuery: string) => {
      const query = rawQuery.trim();
      setInput(query);
      setTab('films');

      if (query.length < 2) {
        // Invalidate any in-flight semantic request before showing the error.
        ++requestRef.current;
        abortRef.current?.abort();
        setLoadingMore(false);
        setFeedStatus('ready');
        setSearch((current) => ({
          ...current,
          pending: false,
          error: 'Describe what you want to watch in at least 2 characters.',
        }));
        return;
      }

      const controller = beginRequest();
      const requestId = ++requestRef.current;
      setFeedStatus('ready');
      setSearch({ query, pending: true, error: '', interpretation: null });
      setMoreError('');
      setLoadingMore(false);

      try {
        const data = await semanticSearch(query, 1, { signal: controller.signal });
        if (requestId !== requestRef.current) return;

        setFeed({
          mode: 'semantic',
          items: data.results,
          page: data.page,
          totalPages: data.totalPages,
          totalResults: data.totalResults,
        });
        setFeedStatus('ready');
        setSearch({
          query,
          pending: false,
          error: '',
          interpretation: data.interpretation,
        });
      } catch (error) {
        if (isAbortError(error) || requestId !== requestRef.current) return;
        setSearch({ query, pending: false, error: errorMessage(error), interpretation: null });
      }
    },
    [beginRequest],
  );

  const resetToFeed = useCallback(
    (nextTab: Tab) => {
      abortRef.current?.abort();
      setTab(nextTab);
      setInput('');
      setSearch(EMPTY_SEARCH);
      setMoreError('');
      setLoadingMore(false);
      if (nextTab === 'series') void loadSeries(1);
      else void loadFilms(1);
    },
    [loadFilms, loadSeries],
  );

  const loadMore = useCallback(async () => {
    if (loadingMore || feed.page === 0 || feed.page >= feed.totalPages) return;

    const controller = beginRequest();
    const requestId = ++requestRef.current;
    setLoadingMore(true);
    setMoreError('');

    try {
      const nextPage = feed.page + 1;
      const data =
        feed.mode === 'series'
          ? await getTvShows(nextPage, { signal: controller.signal })
          : feed.mode === 'semantic'
            ? await semanticSearch(search.query, nextPage, { signal: controller.signal })
            : await getLatestMovies(nextPage, { signal: controller.signal });

      if (requestId !== requestRef.current) return;

      const incoming: MediaSummary[] = data.results;
      setFeed((current) => {
        const seen = new Set(current.items.map(mediaKey));
        return {
          ...current,
          items: [...current.items, ...incoming.filter((media) => !seen.has(mediaKey(media)))],
          page: data.page,
          totalPages: data.totalPages,
          totalResults: data.totalResults,
        };
      });
    } catch (error) {
      if (isAbortError(error) || requestId !== requestRef.current) return;
      setMoreError(errorMessage(error));
    } finally {
      if (requestId === requestRef.current) setLoadingMore(false);
    }
  }, [feed, search.query, loadingMore, beginRequest]);

  const hasMore = feed.page > 0 && feed.page < feed.totalPages;

  useEffect(() => {
    if (typeof IntersectionObserver === 'undefined') return undefined;
    if (feedStatus !== 'ready' || search.pending || loadingMore || !hasMore) return undefined;

    const node = sentinelRef.current;
    if (!node) return undefined;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) void loadMore();
      },
      { rootMargin: '500px 0px' },
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [feedStatus, search.pending, loadingMore, hasMore, loadMore]);

  const isSeries = tab === 'series';
  const isSemantic = feed.mode === 'semantic';
  const showSearchSkeleton = search.pending;
  const showInitialSkeleton = feedStatus === 'loading' && !search.pending;
  const unit = isSeries ? 'series' : isSemantic ? 'matches' : 'films';

  const sectionTitle = showSearchSkeleton
    ? 'Reading the room'
    : isSemantic
      ? 'Picked for you'
      : isSeries
        ? 'Popular series'
        : 'Latest releases';
  const sectionEyebrow = showSearchSkeleton
    ? 'AI at work'
    : isSemantic
      ? 'AI matches'
      : isSeries
        ? 'Now streaming'
        : 'Now showing';

  const emptyState: EmptyStateConfig = isSeries
    ? {
        icon: SearchX,
        title: 'No series found.',
        message: 'The series feed is empty right now. Try refreshing in a moment.',
        action: (
          <button
            type="button"
            onClick={() => void loadSeries(1)}
            className="border border-line px-5 py-2.5 text-[11px] font-semibold uppercase tracking-[0.16em] text-cream transition hover:border-accent hover:text-accent"
          >
            Refresh series
          </button>
        ),
      }
    : isSemantic
      ? {
          icon: SearchX,
          title: 'No films matched that vibe.',
          message:
            'Try a broader mood, another era, or fewer details. Your AI search can always be cleared.',
          action: (
            <button
              type="button"
              onClick={() => resetToFeed('films')}
              className="border border-line px-5 py-2.5 text-[11px] font-semibold uppercase tracking-[0.16em] text-cream transition hover:border-accent hover:text-accent"
            >
              Clear AI search
            </button>
          ),
        }
      : {
          icon: SearchX,
          title: 'No releases found.',
          message: 'The latest movie feed is empty right now. Try refreshing in a moment.',
          action: (
            <button
              type="button"
              onClick={() => void loadFilms(1)}
              className="border border-line px-5 py-2.5 text-[11px] font-semibold uppercase tracking-[0.16em] text-cream transition hover:border-accent hover:text-accent"
            >
              Refresh feed
            </button>
          ),
        };

  return (
    <>
      <AiSearchBar
        value={input}
        onChange={setInput}
        onSubmit={(value) => void handleSearch(value)}
        pending={search.pending}
        error={search.error}
      />

      <div className="mx-auto max-w-[1440px] px-4 pb-20 pt-8 sm:px-6 sm:pt-10 lg:px-10">
        {search.interpretation && !search.pending ? (
          <SearchInterpretation
            interpretation={search.interpretation}
            totalResults={feed.totalResults}
            onClear={() => resetToFeed('films')}
          />
        ) : null}

        <div className="mb-6 flex flex-wrap items-end justify-between gap-4 border-b border-line pb-4">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-muted">
              {sectionEyebrow}
            </p>
            <h2 className="mt-1 font-display text-4xl leading-none text-cream sm:text-5xl">
              {sectionTitle}
            </h2>
          </div>
          <div className="flex items-center gap-3 pb-1 text-xs text-muted">
            {feedStatus === 'ready' && !search.pending ? (
              <span>
                <strong className="font-medium text-cream">
                  {feed.totalResults.toLocaleString()}
                </strong>{' '}
                {unit}
              </span>
            ) : null}
            <span className="hidden h-3 w-px bg-line sm:block" aria-hidden="true" />
            <span className="inline-flex items-center gap-1.5">
              {isSemantic || showSearchSkeleton ? (
                <Sparkles className="size-3.5" aria-hidden="true" />
              ) : (
                <ArrowDownWideNarrow className="size-3.5" aria-hidden="true" />
              )}
              {showSearchSkeleton
                ? 'AI search'
                : isSemantic
                  ? 'AI interpreted'
                  : isSeries
                    ? 'Most popular'
                    : 'Newest first'}
            </span>
          </div>
        </div>

        <div role="tablist" aria-label="Browse films or series" className="mb-8 flex gap-1">
          {TABS.map((entry) => {
            const active = tab === entry.id;
            return (
              <button
                key={entry.id}
                type="button"
                role="tab"
                id={`tab-${entry.id}`}
                aria-selected={active}
                aria-controls="catalog-panel"
                onClick={() => {
                  if (!active) resetToFeed(entry.id);
                }}
                className={`border px-5 py-2.5 text-[11px] font-semibold uppercase tracking-[0.16em] transition ${
                  active
                    ? 'border-accent bg-accent text-canvas'
                    : 'border-line text-muted hover:border-accent hover:text-cream'
                }`}
              >
                {entry.label}
              </button>
            );
          })}
        </div>

        <div id="catalog-panel" role="tabpanel" aria-labelledby={`tab-${tab}`}>
          {showSearchSkeleton || showInitialSkeleton ? (
            <>
              <p className="sr-only" role="status">
                {showSearchSkeleton
                  ? 'Interpreting your search and loading matches'
                  : isSeries
                    ? 'Loading popular series'
                    : 'Loading latest movies'}
              </p>
              <MovieGridSkeleton count={10} />
            </>
          ) : feedStatus === 'error' ? (
            <ErrorState
              title="The projector jammed."
              message={feedError}
              onRetry={() => (isSeries ? void loadSeries(1) : void loadFilms(1))}
            />
          ) : feed.items.length === 0 ? (
            <EmptyState {...emptyState} />
          ) : (
            <MovieGrid items={feed.items} />
          )}

          {hasMore && feedStatus === 'ready' && !search.pending ? (
            <div ref={sentinelRef} className="mt-12 flex flex-col items-center gap-3">
              <button
                type="button"
                onClick={() => void loadMore()}
                disabled={loadingMore}
                className="inline-flex items-center gap-2 border border-line px-6 py-3 text-[11px] font-semibold uppercase tracking-[0.16em] text-cream transition hover:border-accent hover:text-accent disabled:opacity-60"
              >
                {loadingMore ? <Loader2 className="size-3.5 animate-spin" aria-hidden="true" /> : null}
                {loadingMore ? 'Loading titles' : 'Load more'}
              </button>
              {moreError ? (
                <p role="alert" className="text-xs text-danger">
                  {moreError}
                </p>
              ) : null}
            </div>
          ) : null}
        </div>
      </div>
    </>
  );
}
