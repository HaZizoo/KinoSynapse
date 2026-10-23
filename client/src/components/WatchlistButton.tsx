import { useState } from 'react';
import { Bookmark, BookmarkCheck, Loader2 } from 'lucide-react';
import { useWatchlist } from '../context/WatchlistContext';

interface WatchlistButtonProps {
  movie: { id: number; title: string };
  variant?: 'card' | 'detail';
}

export function WatchlistButton({ movie, variant = 'card' }: WatchlistButtonProps) {
  const { isSaved, toggle } = useWatchlist();
  const [pending, setPending] = useState(false);
  const saved = isSaved(movie.id);

  async function handleClick(): Promise<void> {
    if (pending) return;
    setPending(true);
    try {
      await toggle(movie);
    } finally {
      setPending(false);
    }
  }

  const styles =
    variant === 'detail'
      ? 'border border-line px-4 py-2.5 text-xs tracking-[0.14em] hover:border-accent hover:text-accent'
      : 'text-[11px] tracking-[0.12em] hover:text-cream';

  return (
    <button
      type="button"
      onClick={() => void handleClick()}
      disabled={pending}
      aria-pressed={saved}
      aria-label={`${saved ? 'Remove' : 'Add'} ${movie.title} ${saved ? 'from' : 'to'} your watchlist`}
      className={`inline-flex shrink-0 items-center gap-1.5 font-medium uppercase transition disabled:opacity-60 ${styles} ${
        saved ? 'text-accent' : 'text-muted'
      }`}
    >
      {pending ? (
        <Loader2 className="size-3.5 animate-spin" aria-hidden="true" />
      ) : saved ? (
        <BookmarkCheck className="size-3.5 fill-current" aria-hidden="true" />
      ) : (
        <Bookmark className="size-3.5" aria-hidden="true" />
      )}
      <span>{saved ? 'Saved' : 'Watchlist'}</span>
    </button>
  );
}
