# KinoSynapse API

TypeScript / Express 5 backend for KinoSynapse, an AI-powered movie discovery app. It proxies The Movie Database (TMDB) API v3, stores accounts, watchlists and reviews in MongoDB, and uses an LLM — or a deterministic local interpreter — to turn natural-language requests into searches.

Everything external is optional. With no `TMDB_API_KEY`, no `LLM_API_KEY` and no MongoDB, the API still answers every route using the bundled catalog and an in-memory store.

## Quick start

```bash
cd server
npm install
npm run dev               # http://localhost:4000, no .env required
```

Optional configuration:

```bash
cp .env.example .env
# add TMDB_API_KEY for live data, LLM_API_KEY for LLM interpretation,
# and a MONGODB_URI for persistent accounts, watchlists and reviews
```

Requirements: Node.js 20+. MongoDB, TMDB and an LLM provider are all optional.

## Runtime modes

| Dependency | Missing / failing behaviour |
| --- | --- |
| `TMDB_API_KEY` | Empty, shorter than 16 characters, or a placeholder (`demo_…`, `test…`, `your…`) → the bundled catalog serves films, series, search and details. |
| Live TMDB | A 401/403, rate limit, timeout or network error switches the process to the catalog on first failure; the request still succeeds. A 404 stays a 404. |
| `LLM_API_KEY` | Semantic search uses the deterministic local interpreter (`interpret.ts`). |
| LLM provider | Any provider error falls back to the local interpreter instead of failing the request. |
| MongoDB | A failed connection (1.5s selection timeout) keeps the in-memory repository; registration, login, watchlists and reviews keep working until restart. |

`GET /api/health` exposes the active modes so you can tell what is running:

```json
{
  "status": "ok",
  "uptime": 12.4,
  "timestamp": "2026-10-25T12:00:00.000Z",
  "mode": { "database": "memory", "tmdb": "catalog" }
}
```

## Environment variables

| Variable | Required | Default | Purpose |
| --- | --- | --- | --- |
| `PORT` | no | `4000` | HTTP port |
| `MONGODB_URI` | no | `mongodb://127.0.0.1:27017/movie-app` | MongoDB connection string; falls back to memory |
| `TMDB_API_KEY` | no | – | TMDB API v3 key, sent as `api_key`; empty uses the offline catalog |
| `TMDB_BASE_URL` | no | `https://api.themoviedb.org/3` | TMDB API base URL |
| `TMDB_IMAGE_BASE_URL` | no | `https://image.tmdb.org/t/p` | Prefix for poster/profile URLs |
| `TMDB_LANGUAGE` | no | `en-US` | TMDB response language |
| `JWT_SECRET` | production | dev fallback | Secret for signing auth tokens (32+ chars) |
| `JWT_EXPIRES_IN` | no | `7d` | Token lifetime (`30m`, `12h`, `7d`, …) |
| `CLIENT_ORIGIN` | no | `http://localhost:5173` | Allowed CORS origin(s), comma-separated or `*` |
| `TRUST_PROXY` | no | `false` | Trust one reverse-proxy hop for rate-limit client IPs |
| `MAX_WATCHLIST_ITEMS` | no | `500` | Per-user watchlist cap |
| `LLM_API_KEY` | no | – | OpenAI-compatible API key; empty uses the local interpreter |
| `LLM_BASE_URL` | no | `https://api.openai.com/v1` | OpenAI-compatible base URL |
| `LLM_MODEL` | no | `gpt-4o-mini` | Model used to interpret queries |
| `LLM_TIMEOUT_MS` | no | `15000` | Abandon a stalled LLM request after this long |
| `LLM_DAILY_LIMIT` | no | `1000` | Process-local daily LLM call budget |

## API

All responses are JSON. Errors use:

```json
{ "error": { "message": "…", "details": [{ "path": "rating", "message": "…" }] } }
```

### Movies (public)

#### `GET /api/movies?page=1`

Latest releases, newest first, paginated for infinite scroll. Live mode uses TMDB `discover/movie` with a small vote floor so the list is not dominated by unreleased entries; catalog mode sorts the bundled films by release date.

```json
{
  "page": 1,
  "totalPages": 2,
  "totalResults": 18,
  "results": [
    {
      "id": 603,
      "title": "The Matrix",
      "overview": "…",
      "releaseDate": "1999-03-31",
      "posterUrl": "https://image.tmdb.org/t/p/w500/f89U3ADr1oiB1s9GkdPOEpXUk5H.jpg",
      "backdropUrl": "https://image.tmdb.org/t/p/w1280/icmmSD4vTTDKOq2vvdulafOGw93.jpg",
      "rating": { "average": 8.2, "count": 25489 },
      "popularity": 92.4
    }
  ]
}
```

#### `GET /api/movies/search?query=matrix&page=1`

Text search through TMDB `search/movie` with the configured `TMDB_API_KEY`. If the key is missing, rejected, rate limited, or TMDB is unreachable, the deterministic catalog search answers instead and `source` is `"catalog"`.

```json
{ "query": "matrix", "source": "search", "page": 1, "totalPages": 1, "totalResults": 1, "results": [] }
```

#### `GET /api/movies/discover?genre=action&year=1999&minRating=7&sortBy=rating&page=1`

Calls TMDB `discover/movie` with whitelisted filters: `genre` (name or TMDB id), `year`, `minRating` (0–10) and `sortBy` (`popularity`, `rating`, `newest` or the raw TMDB sort values). Unknown genres, years outside 1900–2100, and unknown sorts return `400`. If TMDB is unavailable the same filters are applied to the offline catalog and `source` is `"catalog"`.

#### `GET /api/movies/:id`

Full details for one movie: overview, runtime, genres, rating, certification, director, up to 20 cast members, and trailer. Live mode makes one TMDB call thanks to `append_to_response=credits,release_dates,videos`. Unknown ids return `404`.

### Series

| Method | Path | Notes |
| --- | --- | --- |
| `GET` | `/api/tv?page=1` | Popular series, TMDB `discover/tv`, catalog fallback |
| `GET` | `/api/tv/search?query=…` | TMDB `search/tv`, catalog fallback |
| `GET` | `/api/tv/discover?genre=&year=&minRating=&sortBy=` | TMDB `discover/tv` with `first_air_date` filters |
| `GET` | `/api/tv/:id` | Details, seasons, creators, cast, certification, trailer |
| `GET` | `/api/search?query=…` | Films **and** series in one page (TMDB `search/multi`) |

#### `GET /api/tv/:id`

Series details normalized into `TvDetails`: `title` is TMDB's `name`, `releaseDate` is the first air date, plus `numberOfSeasons`, `numberOfEpisodes`, `lastAirDate`, `networks`, `creators`, `episodeRunTime`, up to 20 cast members and a `seasons` list (season 0 / specials filtered out). Live mode appends `credits,content_ratings,videos`. Unknown ids return `404` with `"Series not found."`.

#### `GET /api/tv/discover?genre=drama&year=2008&sortBy=rating`

Series genres come from TMDB's separate `/genre/tv/list` (ids differ from films), and `year` maps to `first_air_date.gte`/`first_air_date.lte`. `sortBy` accepts `popularity`, `rating`, `newest`, `popularity.desc`, `vote_average.desc` or `first_air_date.desc`. Offline, the same filters run against the bundled series catalog.

#### `GET /api/search?query=breaking%20bad`

`search/multi` results keep only `media_type` `movie` and `tv` (people are dropped) and are normalized into one `MediaSummary` shape with a discriminating `mediaType`. Offline, films and series are scored with the same token rules and merged.

### Auth

| Method | Path | Body | Notes |
| --- | --- | --- | --- |
| `POST` | `/api/auth/register` | `{ "name", "email", "password" }` | Password 8+ chars; returns `{ token, user }` |
| `POST` | `/api/auth/login` | `{ "email", "password" }` | Returns `{ token, user }` |
| `GET` | `/api/auth/me` | – | Requires `Authorization: Bearer <token>` |

Passwords are hashed with bcrypt (cost 12). Tokens are HS256 JWTs with fixed issuer/audience claims. Auth endpoints are rate-limited to 30 requests per 15 minutes per IP, and login always runs a bcrypt comparison so response timing does not reveal whether an email exists.

### Watchlist (authenticated)

| Method | Path | Body | Notes |
| --- | --- | --- | --- |
| `GET` | `/api/watchlist` | – | Returns saved snapshots |
| `POST` | `/api/watchlist` | `{ "movieId": 603 }` | Validates the movie, then saves a small snapshot |
| `GET` | `/api/watchlist/:movieId` | – | `{ movieId, inWatchlist }` |
| `DELETE` | `/api/watchlist/:movieId` | – | `204` on success, `404` if absent |

A snapshot looks like `{ movieId, title, posterUrl, releaseDate, voteAverage, addedAt }`. Duplicate adds return `409`; the MongoDB backend enforces this with an atomic filtered update, and the memory backend checks the embedded array.

### Reviews

| Method | Path | Body | Notes |
| --- | --- | --- | --- |
| `GET` | `/api/movies/:id/reviews?page=1` | – | Public; 50 per page, includes `count` and `averageRating` |
| `POST` | `/api/movies/:id/reviews` | `{ "rating": 8, "title", "body" }` | Authenticated; creates or updates your review |
| `DELETE` | `/api/movies/:id/reviews/:reviewId` | – | Authenticated; owner only |

Ratings are whole numbers from 1 to 10. Only one review per user per movie is stored (unique index in MongoDB), and posting again updates it. Deleting a review you do not own returns `404`.

### Semantic search

#### `POST /api/search/semantic`

```json
{ "query": "animated movies with great ratings" }
```

Flow:

1. If `LLM_API_KEY` is set, the LLM receives the query plus the genre list and returns structured JSON: `genres`, `keywords`, `yearFrom`, `yearTo`, `minRating`, `sortBy`, `explanation`. Otherwise the deterministic interpreter in `src/lib/interpret.ts` derives the same shape from genre aliases, decades/years, rating intent and keyword phrases.
2. Live mode resolves genre names to TMDB ids and keywords to TMDB keyword ids, then calls `discover/movie`; if the filters are too narrow it falls back to `search/movie`.
3. Catalog mode filters the 18 bundled films by the same interpretation (genre, year, rating, keywords) and paginates the result.
4. The response includes the interpretation and its `strategy`, so the UI can show what the AI understood.

```json
{
  "query": "animated movies with great ratings",
  "source": "catalog",
  "interpretation": {
    "genres": ["Animation"],
    "keywords": [],
    "yearFrom": null,
    "yearTo": null,
    "minRating": 7.5,
    "sortBy": "vote_average.desc",
    "explanation": "Looking for Animation rated 7.5 or higher.",
    "strategy": "heuristic",
    "matchedGenres": ["Animation"],
    "matchedKeywordIds": []
  },
  "page": 1,
  "totalPages": 1,
  "totalResults": 3,
  "results": []
}
```

`source` is `discover`, `search` or `catalog`. The route is public but rate-limited to 15 requests per minute per IP. Interpretations are cached for five minutes, and the local interpreter is fully deterministic. A process-local daily budget (`LLM_DAILY_LIMIT`) stops runaway LLM spend, and a stalled provider is abandoned after `LLM_TIMEOUT_MS`.

## Project structure

```text
server/
├── src/
│   ├── app.ts                  # Express app (middleware, routes, errors)
│   ├── server.ts               # DB connection + HTTP listener + shutdown
│   ├── config/
│   │   ├── env.ts              # .env validation with zero-config defaults
│   │   └── db.ts               # Mongoose connection + memory fallback
│   ├── controllers/            # auth, movies, watchlist, semantic search
│   ├── lib/
│   │   ├── tmdb.ts             # TMDB v3 client, normalization, catalog fallback
│   │   ├── llm.ts              # OpenAI-compatible query interpreter
│   │   ├── interpret.ts        # deterministic local interpreter
│   │   ├── images.ts           # TMDB image URL builder
│   │   ├── serializers.ts      # public user payloads
│   │   ├── errors.ts           # ApiError + error middleware
│   │   └── validation.ts       # Zod/param helpers
│   ├── middleware/auth.ts      # JWT sign/verify + requireAuth
│   ├── models/                 # User (with watchlist), Review
│   ├── repositories/           # contracts + MongoDB and in-memory backends
│   ├── services/
│   │   └── fallbackCatalog.ts  # 18-film deterministic offline catalog
│   └── types.ts                # shared domain types
└── test/
    ├── api.test.ts             # zero-config in-process suite
    └── tmdb-online.test.ts     # live mapping + 401 fallback (nock)
```

## Scripts

```bash
npm run dev        # tsx watch src/server.ts
npm run build      # tsc -p tsconfig.build.json → dist/
npm start          # node dist/server.js
npm run typecheck  # tsc --noEmit (strict)
npm test           # node --import tsx --test
```

## Tests

```bash
npm test
```

The primary suite runs entirely in-process: no MongoDB binary, no TMDB key, no LLM key, no outbound network. It covers health/runtime modes, the film and series catalog feeds and pagination, movie and series details, 404s, series discover filters, cross-media search, deterministic semantic filtering, JWT auth (including a forged issuer), watchlist duplicates and caps, and review creation/update/deletion with ownership checks. A second file uses `nock` to verify TMDB response mapping (`/discover/movie`, `/movie/:id`, `/search/movie`, `/search/multi`, `/tv/:id`, `/discover/tv`, `/genre/tv/list`) and that a rejected key degrades to the catalog.

## Notes

- This product uses the TMDB API but is not endorsed or certified by TMDB.
- The in-memory store exists for local development and tests: it is per-process and resets on restart. Use MongoDB for anything persistent.
- Set `CLIENT_ORIGIN` to your React dev/prod origin(s); credentials are bearer tokens, so cookies are not used.
- `TRUST_PROXY` stays `false` unless a trusted reverse proxy terminates traffic; enabling it while directly exposed lets clients spoof `X-Forwarded-For`.
- `LLM_DAILY_LIMIT` is per process, not a distributed quota. For multi-instance deployments, put a shared budget in front of the LLM or use a provider-side spend limit.
