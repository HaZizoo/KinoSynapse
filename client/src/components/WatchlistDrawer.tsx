import { useEffect, useRef, useState, type MouseEvent } from 'react';
import { Bookmark, Loader2, Trash2, X } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useWatchlist } from '../context/WatchlistContext';
import { formatRating, releaseYear } from '../lib/format';
import { SafeImage } from './SafeImage';

export function WatchlistDrawer() {
  const { user, openAuth } = useAuth();
  const { items, loading, drawerOpen, closeDrawer, remove } = useWatchlist();
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [removingId, setRemovingId] = useState<number | null>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (drawerOpen && !dialog.open) dialog.showModal();
    if (!drawerOpen && dialog.open) dialog.close();
  }, [drawerOpen]);

  function handleBackdropClick(event: MouseEvent<HTMLDialogElement>): void {
    if (event.target === dialogRef.current) closeDrawer();
  }

  function handleSignIn(): void {
    closeDrawer();
    openAuth('login');
  }

  async function handleRemove(movieId: number): Promise<void> {
    setRemovingId(movieId);
    try {
      await remove(movieId);
    } finally {
      setRemovingId(null);
    }
  }

  return (
    <dialog
      ref={dialogRef}
      onClose={closeDrawer}
      onClick={handleBackdropClick}
      aria-labelledby="watchlist-title"
      className="drawer-panel m-0 ml-auto h-dvh max-h-none w-full max-w-md border-0 border-l border-line bg-surface p-0 text-cream"
    >
      <div className="flex h-full flex-col">
        <div className="flex items-start justify-between border-b border-line px-6 py-5">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-accent">
              Saved for later
            </p>
            <h2 id="watchlist-title" className="mt-1 font-display text-3xl leading-none">
              Your watchlist
            </h2>
            <p className="mt-2 text-xs text-muted">
              {user ? `${items.length} ${items.length === 1 ? 'film' : 'films'}` : 'Sign in to keep a list'}
            </p>
          </div>
          <button
            type="button"
            onClick={closeDrawer}
            aria-label="Close watchlist"
            className="grid size-8 shrink-0 place-items-center border border-line text-muted transition hover:border-accent hover:text-cream"
          >
            <X className="size-4" aria-hidden="true" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6">
          {!user ? (
            <div className="flex h-full flex-col items-center justify-center py-16 text-center">
              <span className="grid size-12 place-items-center border border-line text-muted">
                <Bookmark className="size-5" aria-hidden="true" />
              </span>
              <h3 className="mt-5 font-display text-2xl">Your list is waiting.</h3>
              <p className="mt-2 max-w-xs text-sm leading-6 text-muted">
                Sign in to save films, then pick up right where you left off on any device.
              </p>
              <button
                type="button"
                onClick={handleSignIn}
                className="mt-6 bg-accent px-5 py-2.5 text-[11px] font-semibold uppercase tracking-[0.16em] text-canvas transition hover:bg-cream"
              >
                Sign in
              </button>
            </div>
          ) : loading && items.length === 0 ? (
            <div className="space-y-5 py-6" aria-busy="true" aria-label="Loading watchlist">
              {Array.from({ length: 3 }, (_, index) => (
                <div key={index} className="flex gap-4">
                  <div className="h-24 w-16 shrink-0 bg-elevated motion-safe:animate-pulse" />
                  <div className="flex-1 space-y-3 pt-2">
                    <div className="h-4 w-3/4 bg-elevated motion-safe:animate-pulse" />
                    <div className="h-3 w-1/3 bg-elevated motion-safe:animate-pulse" />
                  </div>
                </div>
              ))}
            </div>
          ) : items.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center py-16 text-center">
              <span className="grid size-12 place-items-center border border-line text-muted">
                <Bookmark className="size-5" aria-hidden="true" />
              </span>
              <h3 className="mt-5 font-display text-2xl">Nothing saved yet.</h3>
              <p className="mt-2 max-w-xs text-sm leading-6 text-muted">
                Use the watchlist button on any film to build your next movie night.
              </p>
              <button
                type="button"
                onClick={closeDrawer}
                className="mt-6 border border-line px-5 py-2.5 text-[11px] font-semibold uppercase tracking-[0.16em] text-cream transition hover:border-accent hover:text-accent"
              >
                Browse films
              </button>
            </div>
          ) : (
            <ul className="divide-y divide-line py-2">
              {items.map((item) => (
                <li key={item.movieId} className="flex gap-4 py-4">
                  <Link
                    to={`/movies/${item.movieId}`}
                    onClick={closeDrawer}
                    aria-label={`View details for ${item.title}`}
                    className="w-16 shrink-0 overflow-hidden border border-line bg-elevated"
                  >
                    <SafeImage
                      src={item.posterUrl}
                      alt={`${item.title} poster`}
                      className="aspect-[2/3] w-full object-cover"
                      fallback={
                        <div className="grid aspect-[2/3] w-full place-items-center text-muted" aria-hidden="true">
                          <Bookmark className="size-5" />
                        </div>
                      }
                    />
                  </Link>

                  <div className="min-w-0 flex-1 pt-0.5">
                    <Link
                      to={`/movies/${item.movieId}`}
                      onClick={closeDrawer}
                      className="line-clamp-2 text-sm font-medium leading-5 text-cream transition hover:text-accent"
                    >
                      {item.title}
                    </Link>
                    <p className="mt-1 text-xs text-muted">
                      {releaseYear(item.releaseDate)} ·{' '}
                      {item.voteAverage > 0 ? `${formatRating(item.voteAverage)} / 10` : 'Not rated'}
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => void handleRemove(item.movieId)}
                    disabled={removingId === item.movieId}
                    aria-label={`Remove ${item.title} from watchlist`}
                    className="mt-0.5 grid size-8 shrink-0 place-items-center border border-line text-muted transition hover:border-danger hover:text-danger disabled:opacity-60"
                  >
                    {removingId === item.movieId ? (
                      <Loader2 className="size-3.5 animate-spin" aria-hidden="true" />
                    ) : (
                      <Trash2 className="size-3.5" aria-hidden="true" />
                    )}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </dialog>
  );
}
