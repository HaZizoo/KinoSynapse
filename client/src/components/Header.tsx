import { Aperture, Bookmark, LogOut } from 'lucide-react';
import { Link, NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useWatchlist } from '../context/WatchlistContext';

export function Header() {
  const { user, booting, openAuth, logout } = useAuth();
  const { count, openDrawer } = useWatchlist();

  return (
    <header className="sticky top-0 z-40 border-b border-line bg-canvas/90 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-[1440px] items-center gap-6 px-4 sm:px-6 lg:px-10">
        <Link to="/" className="flex shrink-0 items-center gap-2.5" aria-label="KinoSynapse home">
          <span className="grid size-8 place-items-center border border-accent/50 text-accent">
            <Aperture className="size-4" aria-hidden="true" />
          </span>
          <span className="font-display text-xl leading-none tracking-tight sm:text-2xl">
            Kino<span className="text-accent">Synapse</span>
          </span>
        </Link>

        <nav aria-label="Primary" className="hidden items-center gap-1 md:flex">
          <NavLink
            to="/"
            end
            className={({ isActive }) =>
              `px-3 py-2 text-xs font-medium uppercase tracking-[0.16em] transition ${
                isActive ? 'text-cream' : 'text-muted hover:text-cream'
              }`
            }
          >
            Discover
          </NavLink>
          <NavLink
            to="/search"
            className={({ isActive }) =>
              `px-3 py-2 text-xs font-medium uppercase tracking-[0.16em] transition ${
                isActive ? 'text-cream' : 'text-muted hover:text-cream'
              }`
            }
          >
            Search
          </NavLink>
        </nav>

        <div className="ml-auto flex items-center gap-2">
          <button
            type="button"
            onClick={openDrawer}
            aria-label={`Open watchlist${count > 0 ? ` (${count} saved)` : ''}`}
            className="inline-flex items-center gap-2 border border-line px-2.5 py-2 text-[11px] font-medium uppercase tracking-[0.12em] text-muted transition hover:border-accent hover:text-cream sm:px-3"
          >
            <Bookmark className="size-3.5" aria-hidden="true" />
            <span className="hidden sm:inline">Watchlist</span>
            {count > 0 ? (
              <span className="grid min-w-5 place-items-center bg-accent px-1 py-0.5 text-[10px] font-semibold text-canvas">
                {count}
              </span>
            ) : null}
          </button>

          {booting ? (
            <span
              className="h-8 w-20 bg-elevated motion-safe:animate-pulse"
              aria-label="Checking your session"
            />
          ) : user ? (
            <div className="flex items-center gap-2">
              <span className="hidden max-w-28 truncate text-xs text-muted sm:inline">
                {user.name}
              </span>
              <button
                type="button"
                onClick={logout}
                aria-label="Sign out"
                title="Sign out"
                className="grid size-9 place-items-center border border-line text-muted transition hover:border-accent hover:text-cream"
              >
                <LogOut className="size-3.5" aria-hidden="true" />
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => openAuth('login')}
              className="border border-line px-3 py-2 text-[11px] font-medium uppercase tracking-[0.12em] text-cream transition hover:border-accent hover:text-accent sm:px-4"
            >
              Sign in
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
