import { useCallback, useEffect, useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, Clapperboard, Play, Star } from 'lucide-react';
import { getMovie } from '../api/client';
import type { MovieDetails } from '../api/types';
import { ErrorState } from '../components/Feedback';
import { SafeImage } from '../components/SafeImage';
import { WatchlistButton } from '../components/WatchlistButton';
import { errorMessage, isAbortError } from '../lib/errors';
import { formatCount, formatDate, formatRating, formatRuntime } from '../lib/format';

function DetailSkeleton() {
  return (
    <div className="mx-auto max-w-[1440px] px-4 pb-20 sm:px-6 lg:px-10" aria-busy="true">
      <div className="h-64 bg-elevated motion-safe:animate-pulse sm:h-80" />
      <div className="-mt-24 flex flex-col gap-8 sm:-mt-32 sm:flex-row">
        <div
          className="w-40 shrink-0 border border-line bg-elevated motion-safe:animate-pulse sm:w-56"
          style={{ aspectRatio: '2 / 3' }}
        />
        <div className="flex-1 space-y-4 pt-10">
          <div className="h-3 w-32 bg-elevated motion-safe:animate-pulse" />
          <div className="h-12 w-3/4 bg-elevated motion-safe:animate-pulse" />
          <div className="h-4 w-1/2 bg-elevated motion-safe:animate-pulse" />
          <div className="h-10 w-40 bg-elevated motion-safe:animate-pulse" />
        </div>
      </div>
      <span className="sr-only" role="status">
        Loading movie details
      </span>
    </div>
  );
}

export default function MovieDetail() {
  const { movieId = '' } = useParams<{ movieId: string }>();
  const [movie, setMovie] = useState<MovieDetails | null>(null);
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');
  const [error, setError] = useState('');
  const requestRef = useRef(0);
  const abortRef = useRef<AbortController | null>(null);

  const loadMovie = useCallback(async () => {
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    const requestId = ++requestRef.current;

    setMovie(null);
    setStatus('loading');
    setError('');

    try {
      const data = await getMovie(movieId, { signal: controller.signal });
      if (requestId !== requestRef.current) return;
      setMovie(data);
      setStatus('ready');
      document.title = `${data.title} — KinoSynapse`;
    } catch (apiError) {
      if (isAbortError(apiError) || requestId !== requestRef.current) return;
      setError(errorMessage(apiError));
      setStatus('error');
      document.title = 'Film not found — KinoSynapse';
    }
  }, [movieId]);

  useEffect(() => {
    void loadMovie();
    return () => abortRef.current?.abort();
  }, [loadMovie]);

  useEffect(() => {
    return () => {
      document.title = 'KinoSynapse — Find films by feeling';
    };
  }, []);

  if (status === 'loading') return <DetailSkeleton />;

  if (status === 'error' || !movie) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-20 sm:px-6">
        <ErrorState
          title="We couldn't load this film."
          message={error || 'The movie details are unavailable right now.'}
          onRetry={() => void loadMovie()}
        />
        <Link
          to="/"
          className="mt-6 inline-flex items-center gap-2 text-xs font-medium uppercase tracking-[0.14em] text-muted transition hover:text-accent"
        >
          <ArrowLeft className="size-3.5" aria-hidden="true" />
          Back to discover
        </Link>
      </div>
    );
  }

  const cast = movie.cast ?? [];
  const genres = movie.genres ?? [];
  const runtime = formatRuntime(movie.runtime);
  const ratingLabel = movie.rating?.count ? formatRating(movie.rating.average) : '—';
  const trailerUrl = movie.trailer?.key
    ? `https://www.youtube.com/watch?v=${movie.trailer.key}`
    : null;

  return (
    <div className="pb-20">
      <div className="relative h-72 overflow-hidden bg-elevated sm:h-96 lg:h-[28rem]">
        <SafeImage
          src={movie.backdropUrl}
          alt=""
          loading="eager"
          className="h-full w-full object-cover opacity-60"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-canvas via-canvas/55 to-canvas/10" />
        <Link
          to="/"
          className="absolute left-4 top-6 inline-flex items-center gap-2 border border-white/10 bg-black/50 px-3 py-2 text-[10px] font-medium uppercase tracking-[0.14em] text-cream backdrop-blur-sm transition hover:border-accent hover:text-accent sm:left-6 lg:left-10"
        >
          <ArrowLeft className="size-3.5" aria-hidden="true" />
          Back to discover
        </Link>
      </div>

      <div className="mx-auto max-w-[1440px] px-4 sm:px-6 lg:px-10">
        <div className="relative -mt-28 flex flex-col gap-8 sm:-mt-36 sm:flex-row sm:items-start">
          <div className="w-40 shrink-0 sm:w-56 lg:w-64">
            <SafeImage
              src={movie.posterUrl}
              alt={`${movie.title} poster`}
              loading="eager"
              className="aspect-[2/3] w-full border border-line object-cover"
              fallback={
                <div className="flex aspect-[2/3] w-full items-center justify-center border border-line bg-elevated p-4 text-center font-display text-2xl text-muted">
                  {movie.title}
                </div>
              }
            />
          </div>

          <div className="min-w-0 flex-1 sm:pt-20">
            {genres.length > 0 ? (
              <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-accent">
                {genres.map((genre) => genre.name).join(' / ')}
              </p>
            ) : null}

            <h1 className="mt-2 max-w-4xl text-balance font-display text-5xl leading-[0.9] tracking-tight text-cream sm:text-6xl">
              {movie.title}
            </h1>

            {movie.tagline ? (
              <p className="mt-3 font-display text-xl italic text-muted sm:text-2xl">
                {movie.tagline}
              </p>
            ) : null}

            <div className="mt-5 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-muted">
              <span>{formatDate(movie.releaseDate)}</span>
              {runtime ? <span>{runtime}</span> : null}
              {movie.certification ? (
                <span className="border border-line px-1.5 py-0.5 text-[10px] uppercase tracking-[0.12em] text-cream">
                  {movie.certification}
                </span>
              ) : null}
              <span className="inline-flex items-center gap-1.5 text-cream">
                <Star className="size-3.5 fill-accent text-accent" aria-hidden="true" />
                {ratingLabel} / 10
              </span>
            </div>

            <div className="mt-6 flex flex-wrap items-center gap-3">
              <WatchlistButton movie={movie} variant="detail" />
              {trailerUrl ? (
                <a
                  href={trailerUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-2 border border-line px-4 py-2.5 text-xs font-medium uppercase tracking-[0.14em] text-cream transition hover:border-accent hover:text-accent"
                >
                  <Play className="size-3.5 fill-current" aria-hidden="true" />
                  Watch trailer
                </a>
              ) : null}
            </div>
          </div>
        </div>

        <div className="mt-12 grid gap-12 lg:grid-cols-[minmax(0,1fr)_280px]">
          <div>
            <section aria-labelledby="story-heading">
              <h2 id="story-heading" className="font-display text-3xl leading-none text-cream sm:text-4xl">
                The story
              </h2>
              <p className="mt-4 max-w-3xl text-sm leading-7 text-muted sm:text-base sm:leading-8">
                {movie.overview || 'No overview is available for this film yet.'}
              </p>
            </section>

            <section aria-labelledby="cast-heading" className="mt-12">
              <div className="flex items-end justify-between gap-4 border-b border-line pb-3">
                <h2 id="cast-heading" className="font-display text-3xl leading-none text-cream sm:text-4xl">
                  Top billed
                </h2>
                <span className="text-xs text-muted">{cast.length} cast members</span>
              </div>

              {cast.length > 0 ? (
                <ul className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
                  {cast.map((person) => (
                    <li key={person.id} className="group">
                      <div className="aspect-square overflow-hidden border border-line bg-elevated">
                        <SafeImage
                          src={person.profileUrl}
                          alt={`${person.name} portrait`}
                          className="h-full w-full object-cover grayscale transition duration-500 group-hover:grayscale-0"
                          fallback={
                            <div className="grid h-full place-items-center text-muted">
                              <Clapperboard className="size-6" aria-hidden="true" />
                            </div>
                          }
                        />
                      </div>
                      <p className="mt-2 truncate text-sm font-medium text-cream">{person.name}</p>
                      <p className="truncate text-xs text-muted">{person.character || 'Cast'}</p>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="mt-5 text-sm text-muted">Cast information is unavailable for this film.</p>
              )}
            </section>
          </div>

          <aside className="h-fit border border-line bg-surface p-5 lg:sticky lg:top-24">
            <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-muted">
              TMDB score
            </p>
            <div className="mt-2 flex items-end gap-2">
              <span className="font-display text-6xl leading-none text-accent">{ratingLabel}</span>
              <span className="pb-1.5 text-xs text-muted">/ 10</span>
            </div>
            <p className="mt-1 text-xs text-muted">{formatCount(movie.rating?.count)} votes</p>

            <dl className="mt-6 space-y-3 border-t border-line pt-5 text-sm">
              <div className="flex justify-between gap-4">
                <dt className="text-muted">Director</dt>
                <dd className="text-right text-cream">{movie.director?.name ?? '—'}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-muted">Released</dt>
                <dd className="text-right text-cream">{formatDate(movie.releaseDate)}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-muted">Runtime</dt>
                <dd className="text-right text-cream">{runtime ?? '—'}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-muted">Original title</dt>
                <dd className="text-right text-cream">{movie.originalTitle ?? '—'}</dd>
              </div>
            </dl>
          </aside>
        </div>
      </div>
    </div>
  );
}
