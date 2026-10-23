import jwt, { type SignOptions } from 'jsonwebtoken';
import type { RequestHandler } from 'express';
import { env } from '../config/env.js';
import { ApiError } from '../lib/errors.js';
import { userRepository } from '../repositories/index.js';

const JWT_ISSUER = 'kinosynapse-api';
const JWT_AUDIENCE = 'kinosynapse-client';

export function signToken(userId: string): string {
  return jwt.sign({}, env.JWT_SECRET, {
    subject: String(userId),
    expiresIn: env.JWT_EXPIRES_IN as SignOptions['expiresIn'],
    issuer: JWT_ISSUER,
    audience: JWT_AUDIENCE,
    algorithm: 'HS256',
  });
}

export const requireAuth: RequestHandler = async (req, _res, next) => {
  try {
    const match = (req.get('authorization') ?? '').match(/^Bearer\s+(\S+)$/i);
    const token = match?.[1];

    if (!token) {
      throw new ApiError(401, 'Authentication required. Send an "Authorization: Bearer <token>" header.');
    }

    let payload: string | jwt.JwtPayload;
    try {
      payload = jwt.verify(token, env.JWT_SECRET, {
        algorithms: ['HS256'],
        issuer: JWT_ISSUER,
        audience: JWT_AUDIENCE,
      });
    } catch {
      throw new ApiError(401, 'Invalid or expired token.');
    }

    const userId = typeof payload === 'string' ? payload : payload.sub;
    if (!userId) {
      throw new ApiError(401, 'Invalid or expired token.');
    }

    const user = await userRepository().findById(userId);
    if (!user) {
      throw new ApiError(401, 'This account no longer exists.');
    }

    req.user = user;
    next();
  } catch (err) {
    next(err);
  }
};
