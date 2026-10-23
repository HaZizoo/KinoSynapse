import { Sparkles, X } from 'lucide-react';
import type { QueryInterpretation } from '../api/types';

interface SearchInterpretationProps {
  interpretation: QueryInterpretation;
  totalResults: number;
  onClear: () => void;
}

export function SearchInterpretation({
  interpretation,
  totalResults,
  onClear,
}: SearchInterpretationProps) {
  const {
    matchedGenres = [],
    keywords = [],
    yearFrom,
    yearTo,
    minRating,
    explanation,
  } = interpretation;
  const matches = Number.isFinite(totalResults) ? totalResults : 0;

  const yearLabel = yearFrom || yearTo ? `${yearFrom ?? '…'}–${yearTo ?? 'now'}` : null;

  const chips = [
    ...matchedGenres.map((genre) => String(genre)),
    ...keywords.map((keyword) => `“${keyword}”`),
    yearLabel,
    minRating ? `${minRating}+ rating` : null,
  ].filter((chip): chip is string => Boolean(chip));

  return (
    <div className="mb-8 border border-line bg-surface">
      <div className="flex flex-col gap-4 p-5 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex gap-3">
          <span className="grid size-9 shrink-0 place-items-center bg-accent text-canvas">
            <Sparkles className="size-4" aria-hidden="true" />
          </span>
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-muted">
              AI interpretation
            </p>
            <p className="mt-1 max-w-2xl text-sm leading-6 text-cream">
              {explanation || 'Here is what we understood from your request.'}
            </p>
            {chips.length > 0 ? (
              <div className="mt-3 flex flex-wrap gap-2">
                {chips.map((chip, index) => (
                  <span
                    key={`${chip}-${index}`}
                    className="border border-line px-2 py-1 text-[10px] uppercase tracking-[0.12em] text-muted"
                  >
                    {chip}
                  </span>
                ))}
              </div>
            ) : null}
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-3">
          <span className="text-xs text-muted">{matches.toLocaleString()} matches</span>
          <button
            type="button"
            onClick={onClear}
            aria-label="Clear AI search and show latest releases"
            className="inline-flex items-center gap-1.5 border border-line px-2.5 py-1.5 text-[10px] font-medium uppercase tracking-[0.14em] text-muted transition hover:border-accent hover:text-cream"
          >
            <X className="size-3" aria-hidden="true" />
            Clear
          </button>
        </div>
      </div>
    </div>
  );
}
