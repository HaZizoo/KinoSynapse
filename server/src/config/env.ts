import 'dotenv/config';
import { z } from 'zod';

/**
 * The app is meant to boot on a clean checkout with no .env at all. External
 * services are all optional; when a key is missing the relevant feature falls
 * back to a deterministic local implementation instead of crashing.
 */
const DEVELOPMENT_JWT_SECRET = 'kinosynapse-local-development-secret-change-before-deploying';

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.preprocess(
    (value) => (value === '' || value === undefined || Number(value) === 0 ? undefined : value),
    z.coerce.number().int().positive().max(65535).default(4000),
  ),
  MONGODB_URI: z.string().min(1).default('mongodb://127.0.0.1:27017/movie-app'),

  // TMDB API v3. Optional: without a working key the local catalog is served.
  TMDB_API_KEY: z.string().default(''),
  TMDB_BASE_URL: z.url().default('https://api.themoviedb.org/3'),
  TMDB_IMAGE_BASE_URL: z.url().default('https://image.tmdb.org/t/p'),
  TMDB_LANGUAGE: z.string().default('en-US'),

  // Auth. A development secret is generated when this is absent outside production.
  JWT_SECRET: z.string().min(32, 'JWT_SECRET must be at least 32 characters').optional(),
  JWT_EXPIRES_IN: z
    .string()
    .regex(/^\d+[smhd]$/, 'JWT_EXPIRES_IN must look like 30m, 12h or 7d')
    .default('7d'),

  // Browser client allowed by CORS (comma-separated list, or *)
  CLIENT_ORIGIN: z.string().default('http://localhost:5173'),
  // Only enable this behind a trusted reverse proxy; otherwise clients can spoof X-Forwarded-For.
  TRUST_PROXY: z
    .enum(['true', 'false'])
    .default('false')
    .transform((value) => value === 'true'),

  // Hard cap on embedded watchlist items per account (keeps the user document bounded).
  MAX_WATCHLIST_ITEMS: z.coerce.number().int().positive().max(2000).default(500),

  // LLM used by /api/search/semantic. Any OpenAI-compatible endpoint works.
  LLM_API_KEY: z.string().optional(),
  LLM_BASE_URL: z.url().default('https://api.openai.com/v1'),
  LLM_MODEL: z.string().default('gpt-4o-mini'),
  // Requests are abandoned after this long so a stalled provider cannot pin a request forever.
  LLM_TIMEOUT_MS: z.coerce.number().int().min(1000).max(60000).default(15000),
  // Process-local safety budget against API-key exhaustion (resets on restart).
  LLM_DAILY_LIMIT: z.coerce.number().int().positive().max(100000).default(1000),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  const problems = parsed.error.issues
    .map((issue) => `  - ${issue.path.join('.') || '(root)'}: ${issue.message}`)
    .join('\n');
  throw new Error(`Invalid environment configuration:\n${problems}\n\nCheck server/.env or server/.env.example.`);
}

const data = parsed.data;

if (!data.JWT_SECRET && data.NODE_ENV === 'production') {
  throw new Error(
    'JWT_SECRET is required in production. Generate one with: node -e "console.log(require(\'crypto\').randomBytes(48).toString(\'hex\'))"',
  );
}

export const isProduction = data.NODE_ENV === 'production';

export const env = {
  ...data,
  TMDB_API_KEY: data.TMDB_API_KEY.trim(),
  LLM_API_KEY: data.LLM_API_KEY?.trim() ?? '',
  JWT_SECRET: data.JWT_SECRET ?? DEVELOPMENT_JWT_SECRET,
  MONGODB_URI: data.MONGODB_URI.trim(),
};

export const isTest = env.NODE_ENV === 'test';
