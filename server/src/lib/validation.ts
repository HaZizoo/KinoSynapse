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

export function parseMovieId(value: unknown): number {
  const movieId = Number(value);
  if (!Number.isInteger(movieId) || movieId <= 0) {
    throw new ApiError(400, 'Movie id must be a positive integer.');
  }
  return movieId;
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
