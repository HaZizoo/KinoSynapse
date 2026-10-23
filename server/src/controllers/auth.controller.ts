import bcrypt from 'bcryptjs';
import { z } from 'zod';
import type { Request, Response } from 'express';
import { ApiError } from '../lib/errors.js';
import { parseBody } from '../lib/validation.js';
import { toPublicUser } from '../lib/serializers.js';
import { currentUser } from '../lib/currentUser.js';
import { signToken } from '../middleware/auth.js';
import { userRepository } from '../repositories/index.js';

const emailSchema = z.email().max(254);

const registerSchema = z.object({
  name: z.string().trim().min(2, 'Name must be at least 2 characters.').max(80),
  email: emailSchema,
  password: z.string().min(8, 'Password must be at least 8 characters.').max(128),
});

const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, 'Password is required.').max(128),
});

// Always run one bcrypt comparison, even for unknown emails, so response timing
// does not reveal which addresses have accounts.
const DUMMY_PASSWORD_HASH = '$2b$12$uyQSz248lWudz0X8GVmiT.7hKjUlG98djZT8iGXKi8QKmJTK/CmQ2';

export async function register(req: Request, res: Response): Promise<void> {
  const input = parseBody(registerSchema, req.body);
  const email = input.email.trim().toLowerCase();
  const users = userRepository();

  if (await users.existsByEmail(email)) {
    throw new ApiError(409, 'An account with that email already exists.');
  }

  const passwordHash = await bcrypt.hash(input.password, 12);
  const user = await users.create({ name: input.name, email, passwordHash });

  res.status(201).json({
    token: signToken(user.id),
    user: toPublicUser(user),
  });
}

export async function login(req: Request, res: Response): Promise<void> {
  const input = parseBody(loginSchema, req.body);
  const email = input.email.trim().toLowerCase();

  const user = await userRepository().findByEmail(email);
  const passwordHash = user?.passwordHash ?? DUMMY_PASSWORD_HASH;
  const validPassword = await bcrypt.compare(input.password, passwordHash);

  if (!user || !validPassword) {
    throw new ApiError(401, 'Invalid email or password.');
  }

  res.json({
    token: signToken(user.id),
    user: toPublicUser(user),
  });
}

export function me(req: Request, res: Response): void {
  res.json({ user: toPublicUser(currentUser(req)) });
}
