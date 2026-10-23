import { Component, type ErrorInfo, type ReactNode } from 'react';
import { AlertTriangle, RotateCcw } from 'lucide-react';

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(): ErrorBoundaryState {
    return { hasError: true };
  }

  override componentDidCatch(error: Error, info: ErrorInfo): void {
    console.error('[ui] unhandled render error:', error, info.componentStack);
  }

  override render(): ReactNode {
    if (!this.state.hasError) return this.props.children;

    return (
      <div className="flex min-h-dvh items-center justify-center bg-canvas px-4 py-16">
        <div role="alert" className="w-full max-w-lg border border-line bg-surface p-8">
          <span className="grid size-10 place-items-center border border-line text-danger">
            <AlertTriangle className="size-4" aria-hidden="true" />
          </span>
          <p className="mt-6 text-[10px] font-semibold uppercase tracking-[0.22em] text-accent">
            KinoSynapse
          </p>
          <h1 className="mt-2 font-display text-4xl leading-none text-cream">
            The projector jammed.
          </h1>
          <p className="mt-3 text-sm leading-6 text-muted">
            Something unexpected broke this screen. Reloading usually gets you back to the
            films.
          </p>
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="mt-6 inline-flex items-center gap-2 bg-accent px-5 py-2.5 text-[11px] font-semibold uppercase tracking-[0.16em] text-canvas transition hover:bg-cream"
          >
            <RotateCcw className="size-3.5" aria-hidden="true" />
            Reload KinoSynapse
          </button>
        </div>
      </div>
    );
  }
}
