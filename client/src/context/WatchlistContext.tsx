import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import * as api from '../api/client';
import type { WatchlistItem } from '../api/types';
import { errorMessage, errorStatus, isUnauthorized } from '../lib/errors';
import { useAuth } from './AuthContext';

interface WatchlistMovie {
  id: number;
  title: string;
}

interface Notice {
  id: number;
  message: string;
}

export interface WatchlistContextValue {
  items: WatchlistItem[];
  count: number;
  loading: boolean;
  isSaved: (movieId: number) => boolean;
  toggle: (movie: WatchlistMovie) => Promise<boolean | null>;
  remove: (movieId: number) => Promise<boolean | null>;
  refresh: () => Promise<void>;
  drawerOpen: boolean;
  openDrawer: () => void;
  closeDrawer: () => void;
}

const WatchlistContext = createContext<WatchlistContextValue | null>(null);

export function WatchlistProvider({ children }: { children: ReactNode }) {
  const { token, user, logout, openAuth } = useAuth();
  const [items, setItems] = useState<WatchlistItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [notice, setNotice] = useState<Notice | null>(null);

  const refresh = useCallback(async () => {
    if (!token) {
      setItems([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const payload = await api.getWatchlist(token);
      setItems(payload.watchlist ?? []);
    } catch (error) {
      if (isUnauthorized(error)) {
        logout();
      } else {
        setNotice({ id: Date.now(), message: errorMessage(error) });
      }
    } finally {
      setLoading(false);
    }
  }, [token, logout]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  useEffect(() => {
    if (!notice) return undefined;
    const timeout = window.setTimeout(() => setNotice(null), 4000);
    return () => window.clearTimeout(timeout);
  }, [notice]);

  const isSaved = useCallback(
    (movieId: number) => items.some((item) => item.movieId === movieId),
    [items],
  );

  const add = useCallback(
    async (movie: WatchlistMovie): Promise<boolean> => {
      if (!token) throw new Error('Sign in to build your watchlist.');
      const payload = await api.addToWatchlist(movie.id, token);
      if (payload.watchlist) setItems(payload.watchlist);
      else await refresh();
      return true;
    },
    [token, refresh],
  );

  const remove = useCallback(
    async (movieId: number): Promise<boolean | null> => {
      if (!token) return null;

      try {
        await api.removeFromWatchlist(movieId, token);
        setItems((current) => current.filter((item) => item.movieId !== movieId));
        return false;
      } catch (error) {
        if (isUnauthorized(error)) {
          logout();
          openAuth('login');
          setNotice({ id: Date.now(), message: 'Your session expired. Sign in again.' });
        } else {
          setNotice({ id: Date.now(), message: errorMessage(error) });
        }
        return null;
      }
    },
    [token, logout, openAuth],
  );

  const toggle = useCallback(
    async (movie: WatchlistMovie): Promise<boolean | null> => {
      if (!token) {
        openAuth('login');
        setNotice({ id: Date.now(), message: 'Sign in to build your watchlist.' });
        return null;
      }

      const saved = items.some((item) => item.movieId === movie.id);
      if (saved) return remove(movie.id);

      try {
        return await add(movie);
      } catch (error) {
        if (isUnauthorized(error)) {
          logout();
          openAuth('login');
          setNotice({ id: Date.now(), message: 'Your session expired. Sign in again.' });
          return null;
        }
        if (errorStatus(error) === 409) {
          await refresh();
          return true;
        }
        setNotice({ id: Date.now(), message: errorMessage(error) });
        return null;
      }
    },
    [token, items, openAuth, add, remove, logout, refresh],
  );

  const openDrawer = useCallback(() => setDrawerOpen(true), []);
  const closeDrawer = useCallback(() => setDrawerOpen(false), []);

  const value = useMemo<WatchlistContextValue>(
    () => ({
      items,
      count: items.length,
      loading: loading && Boolean(user),
      isSaved,
      toggle,
      remove,
      refresh,
      drawerOpen,
      openDrawer,
      closeDrawer,
    }),
    [items, loading, user, isSaved, toggle, remove, refresh, drawerOpen, openDrawer, closeDrawer],
  );

  return (
    <WatchlistContext.Provider value={value}>
      {children}
      {notice ? (
        <div className="pointer-events-none fixed inset-x-0 bottom-6 z-[70] flex justify-center px-4">
          <div
            role="status"
            aria-live="polite"
            className="pointer-events-auto border border-line bg-elevated px-4 py-3 text-sm text-cream"
          >
            {notice.message}
          </div>
        </div>
      ) : null}
    </WatchlistContext.Provider>
  );
}

export function useWatchlist(): WatchlistContextValue {
  const context = useContext(WatchlistContext);
  if (!context) throw new Error('useWatchlist must be used inside WatchlistProvider');
  return context;
}
