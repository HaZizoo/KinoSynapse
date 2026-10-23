import { useEffect, useRef, useState, type ChangeEvent, type FormEvent, type MouseEvent } from 'react';
import { AlertCircle, Loader2, X } from 'lucide-react';
import { ApiError } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { errorMessage } from '../lib/errors';

const EMPTY_FORM = { name: '', email: '', password: '' };

export function AuthModal() {
  const { authDialog, openAuth, closeAuth, login, register } = useAuth();
  const { open, mode } = authDialog;
  const dialogRef = useRef<HTMLDialogElement>(null);
  const emailRef = useRef<HTMLInputElement>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [error, setError] = useState('');
  const [pending, setPending] = useState(false);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  useEffect(() => {
    setError('');
  }, [mode, open]);

  useEffect(() => {
    if (!open) return undefined;
    const timeout = window.setTimeout(() => emailRef.current?.focus(), 50);
    return () => window.clearTimeout(timeout);
  }, [open, mode]);

  function updateField(event: ChangeEvent<HTMLInputElement>): void {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    if (pending) return;

    setPending(true);
    setError('');

    try {
      if (mode === 'register') {
        await register(form);
      } else {
        await login({ email: form.email, password: form.password });
      }
      setForm(EMPTY_FORM);
    } catch (apiError) {
      if (apiError instanceof ApiError) {
        setError(apiError.details?.[0]?.message ?? apiError.message);
      } else {
        setError(errorMessage(apiError));
      }
    } finally {
      setPending(false);
    }
  }

  function handleBackdropClick(event: MouseEvent<HTMLDialogElement>): void {
    if (event.target === dialogRef.current) closeAuth();
  }

  const isRegister = mode === 'register';

  return (
    <dialog
      ref={dialogRef}
      onClose={closeAuth}
      onClick={handleBackdropClick}
      aria-labelledby="auth-title"
      className="modal-panel m-auto w-[calc(100%-2rem)] max-w-md border border-line bg-surface p-0 text-cream"
    >
      <div className="flex items-start justify-between border-b border-line px-6 py-5">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-accent">
            {isRegister ? 'Create account' : 'Welcome back'}
          </p>
          <h2 id="auth-title" className="mt-1 font-display text-3xl leading-none text-cream">
            {isRegister ? 'Join the club.' : 'Pick up where you left off.'}
          </h2>
        </div>
        <button
          type="button"
          onClick={closeAuth}
          aria-label="Close sign-in dialog"
          className="grid size-8 shrink-0 place-items-center border border-line text-muted transition hover:border-accent hover:text-cream"
        >
          <X className="size-4" aria-hidden="true" />
        </button>
      </div>

      <div className="px-6 py-5">
        <div className="grid grid-cols-2 border border-line p-1" role="tablist" aria-label="Account action">
          <button
            type="button"
            role="tab"
            aria-selected={!isRegister}
            onClick={() => openAuth('login')}
            className={`px-3 py-2 text-[11px] font-medium uppercase tracking-[0.14em] transition ${
              !isRegister ? 'bg-accent text-canvas' : 'text-muted hover:text-cream'
            }`}
          >
            Sign in
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={isRegister}
            onClick={() => openAuth('register')}
            className={`px-3 py-2 text-[11px] font-medium uppercase tracking-[0.14em] transition ${
              isRegister ? 'bg-accent text-canvas' : 'text-muted hover:text-cream'
            }`}
          >
            Create account
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-5 space-y-4" noValidate>
          {isRegister ? (
            <div>
              <label htmlFor="auth-name" className="mb-1.5 block text-xs text-muted">
                Name
              </label>
              <input
                id="auth-name"
                name="name"
                type="text"
                autoComplete="name"
                required
                minLength={2}
                maxLength={80}
                value={form.name}
                onChange={updateField}
                className="h-11 w-full border border-line bg-canvas px-3 text-sm text-cream placeholder:text-muted/60 focus:border-accent focus:outline-none"
                placeholder="Ada Lovelace"
              />
            </div>
          ) : null}

          <div>
            <label htmlFor="auth-email" className="mb-1.5 block text-xs text-muted">
              Email
            </label>
            <input
              ref={emailRef}
              id="auth-email"
              name="email"
              type="email"
              autoComplete="email"
              required
              value={form.email}
              onChange={updateField}
              className="h-11 w-full border border-line bg-canvas px-3 text-sm text-cream placeholder:text-muted/60 focus:border-accent focus:outline-none"
              placeholder="you@example.com"
            />
          </div>

          <div>
            <label htmlFor="auth-password" className="mb-1.5 block text-xs text-muted">
              Password
            </label>
            <input
              id="auth-password"
              name="password"
              type="password"
              autoComplete={isRegister ? 'new-password' : 'current-password'}
              required
              minLength={isRegister ? 8 : 1}
              maxLength={128}
              value={form.password}
              onChange={updateField}
              className="h-11 w-full border border-line bg-canvas px-3 text-sm text-cream placeholder:text-muted/60 focus:border-accent focus:outline-none"
              placeholder={isRegister ? 'At least 8 characters' : 'Your password'}
            />
          </div>

          {error ? (
            <div
              role="alert"
              className="flex gap-2 border border-danger/30 bg-danger/5 px-3 py-2.5 text-xs leading-5 text-danger"
            >
              <AlertCircle className="mt-0.5 size-3.5 shrink-0" aria-hidden="true" />
              <span>{error}</span>
            </div>
          ) : null}

          <button
            type="submit"
            disabled={pending}
            aria-label={isRegister ? 'Create your account' : 'Sign in to your account'}
            className="inline-flex h-11 w-full items-center justify-center gap-2 bg-accent text-[11px] font-semibold uppercase tracking-[0.16em] text-canvas transition hover:bg-cream disabled:opacity-70"
          >
            {pending ? <Loader2 className="size-4 animate-spin" aria-hidden="true" /> : null}
            {isRegister ? 'Create account' : 'Sign in'}
          </button>
        </form>

        <p className="mt-4 text-center text-xs text-muted">
          {isRegister ? 'Already have an account?' : 'New to KinoSynapse?'}{' '}
          <button
            type="button"
            onClick={() => openAuth(isRegister ? 'login' : 'register')}
            className="text-cream underline decoration-line underline-offset-4 transition hover:text-accent"
          >
            {isRegister ? 'Sign in' : 'Create one'}
          </button>
        </p>
      </div>
    </dialog>
  );
}
