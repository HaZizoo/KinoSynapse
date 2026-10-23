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
import type { AuthCredentials, AuthUser, RegisterInput } from '../api/types';

const TOKEN_KEY = 'kinosynapse.token';

export type AuthMode = 'login' | 'register';

export interface AuthDialogState {
  open: boolean;
  mode: AuthMode;
}

export interface AuthContextValue {
  token: string | null;
  user: AuthUser | null;
  booting: boolean;
  authDialog: AuthDialogState;
  login: (credentials: AuthCredentials) => Promise<AuthUser>;
  register: (account: RegisterInput) => Promise<AuthUser>;
  logout: () => void;
  openAuth: (mode?: AuthMode) => void;
  closeAuth: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

function readToken(): string | null {
  try {
    return window.localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

function persistToken(token: string | null): void {
  try {
    if (token) window.localStorage.setItem(TOKEN_KEY, token);
    else window.localStorage.removeItem(TOKEN_KEY);
  } catch {
    // Storage can be unavailable in private browsing; the session still works.
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(readToken);
  const [user, setUser] = useState<AuthUser | null>(null);
  const [booting, setBooting] = useState(Boolean(readToken()));
  const [authDialog, setAuthDialog] = useState<AuthDialogState>({ open: false, mode: 'login' });

  useEffect(() => {
    if (!token) {
      setUser(null);
      setBooting(false);
      return undefined;
    }

    let active = true;
    setBooting(true);

    api
      .getMe(token)
      .then((payload) => {
        if (active) setUser(payload.user);
      })
      .catch((error: unknown) => {
        if (!active) return;
        if (error instanceof api.ApiError && error.status === 401) {
          persistToken(null);
          setToken(null);
          setUser(null);
        }
      })
      .finally(() => {
        if (active) setBooting(false);
      });

    return () => {
      active = false;
    };
  }, [token]);

  const login = useCallback(async (credentials: AuthCredentials) => {
    const payload = await api.login(credentials);
    persistToken(payload.token);
    setToken(payload.token);
    setUser(payload.user);
    setAuthDialog((current) => ({ ...current, open: false }));
    return payload.user;
  }, []);

  const register = useCallback(async (account: RegisterInput) => {
    const payload = await api.registerAccount(account);
    persistToken(payload.token);
    setToken(payload.token);
    setUser(payload.user);
    setAuthDialog((current) => ({ ...current, open: false }));
    return payload.user;
  }, []);

  const logout = useCallback(() => {
    persistToken(null);
    setToken(null);
    setUser(null);
  }, []);

  const openAuth = useCallback((mode: AuthMode = 'login') => {
    setAuthDialog({ open: true, mode });
  }, []);

  const closeAuth = useCallback(() => {
    setAuthDialog((current) => ({ ...current, open: false }));
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      token,
      user,
      booting,
      authDialog,
      login,
      register,
      logout,
      openAuth,
      closeAuth,
    }),
    [token, user, booting, authDialog, login, register, logout, openAuth, closeAuth],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used inside AuthProvider');
  return context;
}
