import { env } from '../config/env.js';

/**
 * Build a full TMDB image URL from a raw `poster_path` / `profile_path` value.
 */
export function imageUrl(path: string | null | undefined, size = 'w500'): string | null {
  if (!path) return null;
  return `${env.TMDB_IMAGE_BASE_URL}/${size}${path}`;
}
