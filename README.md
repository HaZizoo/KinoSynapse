# KinoSynapse

**Find films by feeling.**

KinoSynapse is a full-stack film and series discovery app. It keeps a newest-first feed of releases from The Movie Database (TMDB), opens into rich film and series details with cast and ratings, searches both media in one box, and lets you describe a mood, plot, or era and have an AI — or a deterministic local interpreter — turn it into a film search.

The whole app is **zero-config**: a clean clone starts with no API keys, no MongoDB, and no `.env`. It serves an 18-film / 12-series offline catalog and keeps accounts, watchlists and reviews in memory until you add real credentials.

## Features

- **Films and series tabs** — newest-first film feed and a most-popular series feed, each with its own responsive poster grid, skeleton/error/empty states and infinite scroll.
- **Cross-media search** — one title search returns films and series together, with the query in the URL so results can be shared.
- **Series details** — first/last air date, season and episode counts, network, creators, certification, rating, season list, top-billed cast and trailer.
- **Offline catalog fallback** — 18 films and 12 series with real poster URLs, dates, ratings, overviews, cast lists and verified YouTube trailers. Used automatically when TMDB is missing, rejected or unreachable.
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

## Get every film and series (step by step)

TMDB holds roughly a million films and a quarter of a million series. KinoSynapse never copies that database — it asks TMDB for what it needs and keeps the bundled catalog only as an offline fallback. To switch the whole app from the 30-title catalog to the real catalogue, add one free API key:

1. **Create a TMDB account** at <https://www.themoviedb.org/signup>. Confirm the email.
2. **Request an API key** at <https://www.themoviedb.org/settings/api> → *Create* → choose **Developer**, accept the terms, and fill in the short form (name, a personal or project URL such as `https://github.com/HaZizoo/KinoSynapse`, and a one-line description). Personal use is free; approval is usually instant.
3. **Copy the value labelled _API Key (v3 auth)_** — 32 hex characters. The *API Read Access Token (v4)* is a different, longer JWT and is not what `TMDB_API_KEY` expects.
4. **Put it in the server env file**:
   ```bash
   cp server/.env.example server/.env   # skip if server/.env already exists
   ```
   Then set the line to your key and save:
   ```ini
   TMDB_API_KEY=0123456789abcdef0123456789abcdef
   ```
5. **Restart the API** (`Ctrl+C` the running `npm run dev`, then `npm run dev` again) — environment variables are read once at boot.
6. **Confirm live mode**:
   ```bash
   curl http://localhost:4000/api/health
   # {"status":"ok",...,"mode":{"database":"mongo","tmdb":"live"}}
   ```
   If it still says `"catalog"`, the key is empty, shorter than 16 characters, or starts with a placeholder word such as `demo`/`your`/`test`.
7. **Browse**: the **Films** tab infinite-scrolls TMDB's release feed, the **Series** tab lists popular series, and **Search** (header, `/search`) returns films and series together.

If TMDB rejects the key (401/403), rate-limits you (429) or is unreachable, the first failure flips that process back to the catalog and the request still succeeds — nothing crashes and no request returns 500.

> Without a key, only the 30 bundled titles exist. Adding one unlocks the full TMDB catalogue (roughly a million films and a quarter of a million series) through the endpoints below.

## Runtime modes

| Condition | What happens |
| --- | --- |
| No/placeholder `TMDB_API_KEY` | Films, series, search and details come from the bundled catalog. Health reports `mode.tmdb: "catalog"`. |
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
| `GET` | `/api/tv?page=1` | Popular series feed (catalog fallback) |
| `GET` | `/api/tv/search?query=…` | Series title search (catalog fallback) |
| `GET` | `/api/tv/discover?genre=&year=&minRating=&sortBy=` | Series discover filters (catalog fallback) |
| `GET` | `/api/tv/:id` | Series details, seasons, cast, trailer |
| `GET` | `/api/search?query=…` | Films **and** series in one result page |
| `POST` | `/api/search/semantic` | Interpret natural language and search films |
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
│   └── src/services/       fallbackCatalog.ts (18 films + 12 series offline)
├── .github/workflows/      CI: typecheck, tests, build on every push
└── package.json            Root dev/build/typecheck/test scripts
```

## Testing

`npm test` runs both suites. The backend suite is fully in-process: no MongoDB, no TMDB key, no LLM, no outbound network. It covers health and runtime modes, the film and series catalog feeds, movie and series details, series discover filters, cross-media search, deterministic semantic search, JWT auth, watchlist duplicate protection and caps, and review creation/update/deletion with ownership checks. A second server file mocks TMDB to verify live response mapping (`/discover/movie`, `/movie/:id`, `/search/multi`, `/tv/:id`, `/discover/tv`, `/genre/tv/list`) and the 401-to-catalog fallback.

The client suite covers the film feed, the series tab, the series detail page, cross-media search, semantic search submission, movie details, the signed-out → sign-in → watchlist-add flow, the error boundary, broken artwork, and request timeouts.

## Security notes

- TMDB and LLM keys stay on the server and are never shipped to the browser.
- JWTs use HS256 with issuer/audience validation and a 32+ character secret. In production `JWT_SECRET` is required; development falls back to an obvious local secret.
- Auth and semantic-search routes are rate-limited; semantic interpretations are cached and capped by a daily LLM budget.
- The in-memory store is for local development only: it has no persistence and must not be used for production traffic.

## Attribution

This product uses the TMDB API but is not endorsed or certified by TMDB.
