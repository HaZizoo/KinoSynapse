import { Link } from 'react-router-dom';
import { Star } from 'lucide-react';
import { SafeImage } from './SafeImage';
import { WatchlistButton } from './WatchlistButton';
import { formatCount, formatRating, releaseYear } from '../lib/format';
import type { MediaSummary } from '../api/types';

interface MediaCardProps {
  media: MediaSummary;
  priority?: boolean;
}

/** Card used by every grid: films link to `/movies/:id`, series to `/tv/:id`. */
export function MovieCard({ media, priority = false }: MediaCardProps) {
  const votes = media.rating?.count ?? 0;
  const isTv = media.mediaType === 'tv';
  const href = isTv ? `/tv/${media.id}` : `/movies/${media.id}`;
  const kindLabel = isTv ? 'series' : 'film';

  return (
    <article className="group flex min-w-0 flex-col">
      <div className="relative overflow-hidden border border-line bg-elevated">
        <Link
          to={href}
          aria-label={`View details for ${media.title}`}
          className="relative block"
        >
          <div className="aspect-[2/3] w-full overflow-hidden">
            <SafeImage
              src={media.posterUrl}
              alt={`${media.title} poster`}
              loading={priority ? 'eager' : 'lazy'}
              className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.03]"
              fallback={
                <div className="flex h-full items-center justify-center bg-[linear-gradient(160deg,#1b1b1f,#0d0d0f)] p-4 text-center">
                  <span className="font-display text-2xl leading-tight text-muted">{media.title}</span>
                </div>
              }
            />
          </div>
          <div
            className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/85 via-black/5 to-transparent opacity-0 transition duration-300 group-hover:opacity-100"
            aria-hidden="true"
          />
          <div
            className="absolute inset-x-0 bottom-0 hidden translate-y-2 p-3 opacity-0 transition duration-300 group-hover:translate-y-0 group-hover:opacity-100 sm:block"
            aria-hidden="true"
          >
            <p className="line-clamp-3 text-xs leading-5 text-cream/85">{media.overview}</p>
          </div>
        </Link>

        <span className="absolute left-2.5 top-2.5 inline-flex items-center gap-1 border border-white/10 bg-black/70 px-2 py-1 text-[11px] font-medium text-cream backdrop-blur-sm">
          <Star className="size-3 fill-accent text-accent" aria-hidden="true" />
          {votes > 0 ? formatRating(media.rating?.average) : '—'}
        </span>

        {isTv ? (
          <span className="absolute right-2.5 top-2.5 border border-accent/40 bg-black/70 px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-accent backdrop-blur-sm">
            Series
          </span>
        ) : null}
      </div>

      <div className="mt-3 flex flex-col items-start gap-1.5 sm:flex-row sm:justify-between sm:gap-2">
        <div className="min-w-0">
          <h3 className="truncate text-sm font-semibold tracking-tight text-cream">
            <Link to={href} className="transition hover:text-accent">
              {media.title}
            </Link>
          </h3>
          <p className="mt-0.5 text-xs text-muted">
            {releaseYear(media.releaseDate)}
            {votes > 0 ? ` · ${formatCount(votes)} votes` : ''}
          </p>
        </div>
        {isTv ? (
          <span className="shrink-0 text-[11px] font-medium uppercase tracking-[0.12em] text-muted">
            {kindLabel}
          </span>
        ) : (
          <WatchlistButton movie={media} />
        )}
      </div>
    </article>
  );
}
