import type { ReactNode } from 'react';
import { AlertTriangle, RefreshCw, type LucideIcon } from 'lucide-react';

interface ErrorStateProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
}

export function ErrorState({ title = 'Something went wrong', message, onRetry }: ErrorStateProps) {
  return (
    <div
      role="alert"
      className="flex flex-col items-start gap-4 border border-line bg-surface px-6 py-10 sm:flex-row sm:items-center sm:justify-between"
    >
      <div className="flex gap-4">
        <span className="grid size-10 shrink-0 place-items-center border border-line text-danger">
          <AlertTriangle className="size-4" aria-hidden="true" />
        </span>
        <div>
          <h2 className="text-sm font-semibold text-cream">{title}</h2>
          <p className="mt-1 max-w-xl text-sm leading-6 text-muted">{message}</p>
        </div>
      </div>
      {onRetry ? (
        <button
          type="button"
          onClick={onRetry}
          className="inline-flex shrink-0 items-center gap-2 border border-line px-4 py-2.5 text-xs font-medium uppercase tracking-[0.14em] text-cream transition hover:border-accent hover:text-accent"
        >
          <RefreshCw className="size-3.5" aria-hidden="true" />
          Try again
        </button>
      ) : null}
    </div>
  );
}

interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  message: string;
  action?: ReactNode;
}

export function EmptyState({ icon: Icon, title, message, action }: EmptyStateProps) {
  return (
    <div
      role="status"
      className="flex flex-col items-center border border-line bg-surface px-6 py-16 text-center"
    >
      {Icon ? (
        <span className="grid size-12 place-items-center border border-line text-muted">
          <Icon className="size-5" aria-hidden="true" />
        </span>
      ) : null}
      <h2 className="mt-5 font-display text-3xl text-cream">{title}</h2>
      <p className="mt-2 max-w-md text-sm leading-6 text-muted">{message}</p>
      {action ? <div className="mt-6">{action}</div> : null}
    </div>
  );
}
