# KinoSynapse

**Find films by feeling.**

KinoSynapse is a full-stack movie discovery app. It keeps a newest-first feed of releases from The Movie Database (TMDB), opens into rich movie details with cast and ratings, and lets you describe a mood, plot, or era and have an AI — or a deterministic local interpreter — turn it into a search.

The whole app is **zero-config**: a clean clone starts with no API keys, no MongoDB, and no `.env`. It serves an 18-film offline catalog and keeps accounts, watchlists and reviews in memory until you add real credentials.

## Features

- **Latest releases dashboard** — newest-first feed, responsive poster grid, skeleton/error/empty states, and infinite scroll.
- **Offline catalog fallback** — 18 films across sci-fi, thriller, drama, comedy, action and animation, with real poster/backdrop URLs, release dates, ratings, runtimes, overviews and cast lists. Used automatically when TMDB is missing, rejected or unreachable.
- **AI semantic search** — natural-language queries become genres, keywords, year ranges and rating floors, with the interpretation shown alongside the results. Works with an LLM key or the deterministic local interpreter.
- **Movie details** — backdrop, poster, overview, genres, certification, runtime, score, director, top-billed cast, and trailer.
- **Accounts** — bcrypt registration/login and JWT-protected sessions.
- **Watchlist** — per-user watchlist with duplicate protection and card/detail bookmark buttons.
- **Reviews** — one review per user per movie, average ratings, and owner-only deletion.
- **Storage fallback** — MongoDB when available, in-memory repository when it is not.
- **Resilience** — request timeouts, error boundary, abortable requests, image fallbacks, and a mobile-first accessible UI.

## Stack

- **Client:** React 19, TypeScript 5 (strict), Vite 8, Tailwind CSS v4, React Router 7
- **Server:** Node.js 20+, TypeScript 5 (strict), Express 5, Mongoose 9, JWT, bcrypt, Zod
- **Data:** MongoDB (optional), TMDB API v3 (optional)
- **AI:** any OpenAI-compatible chat-completions provider (optional)

## Quick start

Requirements: Node.js 20+. Nothing else — no database, no keys.

```bash
git clone https://github.com/HaZizoo/KinoSynapse.git
cd KinoSynapse
npm run install:all
npm run dev
```

`npm run dev` starts the API on http://localhost:4000 and the Vite client on http://127.0.0.1:5173 together. The client proxies `/api` to the API.

To use the live TMDB data, an LLM, and persistent MongoDB:

```bash
cp server/.env.example server/.env
# then fill in TMDB_API_KEY, LLM_API_KEY and MONGODB_URI as desired
```

Every one of those is optional. See [server/README.md](server/README.md) for the full environment table.

## Runtime modes

| Condition | What happens |
| --- | --- |
| No/placeholder `TMDB_API_KEY` | Movies, search and details come from the bundled catalog. Health reports `mode.tmdb: "catalog"`. |
| TMDB rejects the key (401/403) or is unreachable | The first failure switches the process to the catalog for the rest of its lifetime; the request still succeeds. |
| No `LLM_API_KEY` (or the provider fails) | Semantic search uses the deterministic local interpreter. No request fails. |
| MongoDB not running | Registration, login, watchlists and reviews use the in-memory repository. Data resets on restart. Health reports `mode.database: "memory"`. |
| All credentials present | Live TMDB feed, LLM interpretation, and MongoDB persistence. |

`GET /api/health` reports the active modes:

```json
{ "status": "ok", "uptime": 12.4, "mode": { "database": "memory", "tmdb": "catalog" } }
```

## API overview

| Method | Path | Purpose |
| --- | --- | --- |
| `GET` | `/api/health` | Status plus active database/TMDB modes |
| `GET` | `/api/movies?page=1` | Latest releases, paginated |
| `GET` | `/api/movies/search?query=…` | TMDB text search (catalog fallback) |
| `GET` | `/api/movies/discover?genre=&year=&minRating=&sortBy=` | TMDB discover filters (catalog fallback) |
| `GET` | `/api/movies/:id` | Details, cast, ratings, trailer |
| `GET/POST` | `/api/movies/:id/reviews` | List or create/update reviews |
| `DELETE` | `/api/movies/:id/reviews/:reviewId` | Delete your review |
| `POST` | `/api/search/semantic` | Interpret natural language and search |
| `POST` | `/api/auth/register` | Create an account |
| `POST` | `/api/auth/login` | Sign in and receive a JWT |
| `GET` | `/api/auth/me` | Current account (bearer token) |
| `GET/POST` | `/api/watchlist` | Read or add to your watchlist |
| `GET/DELETE` | `/api/watchlist/:movieId` | Check or remove a saved movie |

## Scripts

```bash
# from the repository root
npm run dev          # API + client together (concurrently)
npm run build        # compile the API and build the client
npm run typecheck    # tsc --noEmit on server and client
npm test             # server integration suite + client Vitest suite
npm run install:all  # install root, server and client dependencies
```

Server and client keep their own scripts for focused work (`npm --prefix server test`, `npm --prefix client build`, …).

## Project structure

```text
.
├── client/                 React 19 + TypeScript + Vite frontend
├── server/                 Express 5 + TypeScript API
│   └── src/services/       fallbackCatalog.ts (18-film offline catalog)
├── .github/workflows/      CI: typecheck, tests, build on every push
└── package.json            Root dev/build/typecheck/test scripts
```

## Testing

`npm test` runs both suites. The backend suite is fully in-process: no MongoDB, no TMDB key, no LLM, no outbound network. It covers health and runtime modes, the offline catalog feed, movie details, deterministic semantic search, JWT auth, watchlist duplicate protection and caps, and review creation/update/deletion with ownership checks. A second server file mocks TMDB to verify live response mapping and the 401-to-catalog fallback.

The client suite covers the latest feed, semantic search submission, movie details, the signed-out → sign-in → watchlist-add flow, the error boundary, broken artwork, and request timeouts.

## Security notes

- TMDB and LLM keys stay on the server and are never shipped to the browser.
- JWTs use HS256 with issuer/audience validation and a 32+ character secret. In production `JWT_SECRET` is required; development falls back to an obvious local secret.
- Auth and semantic-search routes are rate-limited; semantic interpretations are cached and capped by a daily LLM budget.
- The in-memory store is for local development only: it has no persistence and must not be used for production traffic.

## Attribution

This product uses the TMDB API but is not endorsed or certified by TMDB.
