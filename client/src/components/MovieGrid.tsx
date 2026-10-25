import { MovieCard } from './MovieCard';
import type { MediaSummary } from '../api/types';

const GRID_CLASSES = 'grid grid-cols-2 gap-x-4 gap-y-8 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5';

interface MovieGridProps {
  items: MediaSummary[];
}

export function MovieGrid({ items }: MovieGridProps) {
  return (
    <div className={GRID_CLASSES}>
      {items.map((media, index) => (
        <MovieCard
          key={`${media.mediaType === 'tv' ? 'tv' : 'movie'}-${media.id}`}
          media={media}
          priority={index < 5}
        />
      ))}
    </div>
  );
}

export function MovieGridSkeleton({ count = 10 }: { count?: number }) {
  return (
    <div className={GRID_CLASSES} aria-busy="true" aria-label="Loading titles">
      {Array.from({ length: count }, (_, index) => (
        <div key={index} className="flex flex-col">
          <div className="aspect-[2/3] w-full border border-line bg-elevated motion-safe:animate-pulse" />
          <div className="mt-3 h-4 w-3/4 bg-elevated motion-safe:animate-pulse" />
          <div className="mt-2 h-3 w-1/2 bg-elevated motion-safe:animate-pulse" />
        </div>
      ))}
    </div>
  );
}
