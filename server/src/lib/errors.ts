import type { NextFunction, Request, Response } from 'express';

export class ApiError extends Error {
  readonly status: number;
  readonly details?: unknown;

  constructor(status: number, message: string, details?: unknown) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.details = details;
  }
}

export function notFoundHandler(req: Request, _res: Response, next: NextFunction): void {
  next(new ApiError(404, `Route ${req.method} ${req.originalUrl} not found.`));
}

interface ErrorLike {
  name?: string;
  message?: string;
  status?: number;
  code?: string | number;
  type?: string;
  path?: string;
  details?: unknown;
  errors?: Record<string, { path?: string; message?: string }>;
}

// Express identifies error middleware by arity, so all four parameters stay.
export function errorHandler(err: unknown, _req: Request, res: Response, next: NextFunction): void {
  if (res.headersSent) {
    next(err);
    return;
  }

  const cause = (err ?? {}) as ErrorLike;
  const isApiError = err instanceof ApiError;
  let status = cause.status ?? 500;
  let message = cause.message ?? 'Internal server error.';
  let details = cause.details;

  if (cause.name === 'ValidationError') {
    status = 400;
    message = 'Validation failed.';
    details = Object.values(cause.errors ?? {}).map((issue) => ({
      path: issue.path,
      message: issue.message,
    }));
  } else if (cause.name === 'CastError') {
    status = 400;
    message = `Invalid value for ${cause.path ?? 'the request'}.`;
  } else if (cause.code === 11000) {
    status = 409;
    message = 'A record with those details already exists.';
  } else if (cause.type === 'entity.parse.failed') {
    status = 400;
    message = 'Request body must be valid JSON.';
  } else if (cause.type === 'entity.too.large') {
    status = 413;
    message = 'Request body is too large.';
  }

  if (status >= 500) {
    console.error('[api] error:', err);

    // Deliberate ApiErrors carry safe, actionable upstream messages (for
    // example a TMDB timeout). Unexpected exceptions must stay opaque.
    if (!isApiError) {
      status = 500;
      message = 'Internal server error.';
      details = undefined;
    }
  }

  res.status(status).json({
    error: {
      message,
      ...(details ? { details } : {}),
    },
  });
}
