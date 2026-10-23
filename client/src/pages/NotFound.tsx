import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="mx-auto flex max-w-3xl flex-col items-center px-4 py-24 text-center sm:px-6">
      <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-accent">404</p>
      <h1 className="mt-3 font-display text-6xl leading-none text-cream sm:text-7xl">
        This reel is missing.
      </h1>
      <p className="mt-4 max-w-md text-sm leading-6 text-muted">
        The page you are looking for was cut from the final edit. Head back and find something
        worth watching.
      </p>
      <Link
        to="/"
        className="mt-8 inline-flex items-center gap-2 bg-accent px-5 py-3 text-[11px] font-semibold uppercase tracking-[0.16em] text-canvas transition hover:bg-cream"
      >
        <ArrowLeft className="size-3.5" aria-hidden="true" />
        Back to discover
      </Link>
    </div>
  );
}
