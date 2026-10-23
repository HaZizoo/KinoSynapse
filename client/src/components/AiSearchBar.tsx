import { ArrowUpRight, Loader2, Search, Sparkles } from 'lucide-react';
import type { FormEvent } from 'react';

const SUGGESTIONS = [
  'space westerns from the 90s',
  'cozy animated fantasy',
  'smart heist films',
  'cosmic horror',
];

interface AiSearchBarProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit: (value: string) => void;
  pending: boolean;
  error: string;
}

export function AiSearchBar({ value, onChange, onSubmit, pending, error }: AiSearchBarProps) {
  function handleSubmit(event: FormEvent<HTMLFormElement>): void {
    event.preventDefault();
    onSubmit(value);
  }

  return (
    <section
      aria-labelledby="ai-search-title"
      className="relative overflow-hidden border-b border-line bg-surface"
    >
      <div className="ai-grid pointer-events-none absolute inset-0" aria-hidden="true" />
      <div className="relative mx-auto max-w-[1440px] px-4 pb-8 pt-10 sm:px-6 sm:pb-10 sm:pt-12 lg:px-10">
        <div className="grid min-w-0 grid-cols-[minmax(0,1fr)] gap-8 lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)] lg:items-end lg:gap-14">
          <div className="min-w-0">
            <p className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.24em] text-accent">
              <Sparkles className="size-3.5" aria-hidden="true" />
              AI semantic search
            </p>
            <h1
              id="ai-search-title"
              className="mt-3 font-display text-5xl leading-[0.88] tracking-tight text-cream sm:text-6xl lg:text-7xl"
            >
              Tell us the <em className="text-accent">vibe.</em>
            </h1>
            <p className="mt-4 max-w-md text-sm leading-6 text-muted">
              Skip the title. Describe a plot, a mood or an era, and KinoSynapse turns it into a
              search — online or from its offline catalog.
            </p>
          </div>

          <form onSubmit={handleSubmit} noValidate className="w-full min-w-0">
            <label htmlFor="ai-search" className="sr-only">
              Describe the movie you want to watch
            </label>
            <div
              className={`flex min-w-0 items-center gap-1 border bg-canvas p-1.5 transition ${
                error ? 'border-danger' : 'border-line focus-within:border-accent'
              }`}
            >
              <Search className="ml-2.5 size-4 shrink-0 text-muted sm:ml-3" aria-hidden="true" />
              <input
                id="ai-search"
                name="ai-search"
                type="search"
                value={value}
                onChange={(event) => onChange(event.target.value)}
                placeholder="A space western from the 90s, but make it smart…"
                maxLength={300}
                aria-describedby={error ? 'ai-search-error' : undefined}
                aria-invalid={Boolean(error)}
                className="h-12 min-w-0 flex-1 bg-transparent px-2.5 text-sm text-cream placeholder:text-muted/70 focus:outline-none sm:h-14 sm:px-3 sm:text-base"
              />
              <button
                type="submit"
                disabled={pending}
                aria-label={pending ? 'Interpreting your search' : 'Interpret your search with AI'}
                className="inline-flex h-11 w-11 shrink-0 items-center justify-center gap-2 bg-accent text-xs font-semibold uppercase tracking-[0.12em] text-canvas transition hover:bg-cream disabled:opacity-70 sm:h-12 sm:w-auto sm:px-5 sm:text-[11px]"
              >
                {pending ? (
                  <Loader2 className="size-4 animate-spin" aria-hidden="true" />
                ) : (
                  <ArrowUpRight className="size-4" aria-hidden="true" />
                )}
                <span className="hidden sm:inline">{pending ? 'Reading' : 'Interpret'}</span>
              </button>
            </div>

            <div className="mt-3 flex flex-wrap items-center gap-2">
              <span className="mr-1 text-[10px] uppercase tracking-[0.18em] text-muted/70">Try</span>
              {SUGGESTIONS.map((suggestion) => (
                <button
                  key={suggestion}
                  type="button"
                  onClick={() => onSubmit(suggestion)}
                  disabled={pending}
                  className="border border-line px-2.5 py-1 text-[11px] text-muted transition hover:border-accent hover:text-cream disabled:opacity-60"
                >
                  {suggestion}
                </button>
              ))}
            </div>

            {error ? (
              <p id="ai-search-error" role="alert" className="mt-3 text-sm text-danger">
                {error}
              </p>
            ) : null}
          </form>
        </div>
      </div>
    </section>
  );
}
