import { env } from '../config/env.js';

/**
 * Build a full TMDB image URL from a raw `poster_path` / `profile_path` value.
 *
 * TMDB returns relative paths such as `/abc123.jpg`. Some proxies and cached
 * payloads hand back an absolute URL instead, so pass those through untouched
 * and normalise the base/path join to avoid `//` segments.
 */
export function imageUrl(path: string | null | undefined, size = 'w500'): string | null {
  if (!path) return null;

  const trimmed = path.trim();
  if (!trimmed) return null;
  if (/^https?:\/\//i.test(trimmed)) return trimmed;

  const base = env.TMDB_IMAGE_BASE_URL.replace(/\/+$/, '');
  const suffix = trimmed.startsWith('/') ? trimmed : `/${trimmed}`;
  return `${base}/${size}${suffix}`;
}
