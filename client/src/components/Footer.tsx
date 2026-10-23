export function Footer() {
  return (
    <footer className="border-t border-line">
      <div className="mx-auto flex max-w-[1440px] flex-col gap-3 px-4 py-8 sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-10">
        <p className="font-display text-lg text-cream">
          Kino<span className="text-accent">Synapse</span>
          <span className="ml-3 font-sans text-xs text-muted">Find films by feeling.</span>
        </p>
        <p className="max-w-md text-[11px] leading-5 text-muted">
          This product uses the TMDB API but is not endorsed or certified by TMDB.
        </p>
      </div>
    </footer>
  );
}
