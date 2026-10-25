import { z } from 'zod';
import { ApiError } from './errors.js';

/**
 * Validate a request body against a Zod schema and throw a 400 with readable details.
 */
export function parseBody<T>(schema: z.ZodType<T>, body: unknown): T {
  const result = schema.safeParse(body ?? {});
  if (!result.success) {
    throw new ApiError(
      400,
      'Invalid request body.',
      result.error.issues.map((issue) => ({
        path: issue.path.join('.') || '(root)',
        message: issue.message,
      })),
    );
  }
  return result.data;
}

export function parsePage(value: unknown, fallback = 1): number {
  if (value === undefined || value === '') return fallback;
  const page = Number(value);
  if (!Number.isInteger(page) || page < 1 || page > 500) {
    throw new ApiError(400, 'Query parameter "page" must be an integer between 1 and 500.');
  }
  return page;
}

export function parsePositiveId(value: unknown, label = 'Movie'): number {
  const id = Number(value);
  if (!Number.isInteger(id) || id <= 0) {
    throw new ApiError(400, `${label} id must be a positive integer.`);
  }
  return id;
}

export function parseMovieId(value: unknown): number {
  return parsePositiveId(value, 'Movie');
}

export function parseSearchQuery(value: unknown): string {
  if (typeof value !== 'string' || value.trim().length < 2) {
    throw new ApiError(400, 'Query parameter "query" must be at least 2 characters.');
  }
  return value.trim().slice(0, 200);
}

export function parseOptionalQuery(value: unknown, label: string): string | null {
  if (value === undefined || value === null || value === '') return null;
  if (typeof value !== 'string') {
    throw new ApiError(400, `Query parameter "${label}" must be a string.`);
  }
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed.slice(0, 80) : null;
}

export function parseOptionalYear(value: unknown): number | null {
  if (value === undefined || value === null || value === '') return null;
  const year = Number(value);
  if (!Number.isInteger(year) || year < 1900 || year > 2100) {
    throw new ApiError(400, 'Query parameter "year" must be a four-digit year between 1900 and 2100.');
  }
  return year;
}

export function parseOptionalRating(value: unknown): number | null {
  if (value === undefined || value === null || value === '') return null;
  const rating = Number(value);
  if (!Number.isFinite(rating) || rating < 0 || rating > 10) {
    throw new ApiError(400, 'Query parameter "minRating" must be a number between 0 and 10.');
  }
  return rating;
}

export function parseObjectId(value: unknown, label = 'id'): string {
  if (typeof value !== 'string' || !/^[a-f0-9]{24}$/i.test(value)) {
    throw new ApiError(400, `${label} must be a valid MongoDB ObjectId.`);
  }
  return value;
}

export const movieIdBodySchema = z.object({
  movieId: z.coerce.number().int().positive(),
});
