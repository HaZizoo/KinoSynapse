# KinoSynapse Client

React 19 + TypeScript + Vite + Tailwind CSS v4 frontend for KinoSynapse. It talks to the Express API in [`../server`](../server).

## Run

```bash
cd client
npm install
npm run dev
```

Open http://127.0.0.1:5173. The dev server proxies `/api` to `http://localhost:4000`, so start the backend first (see [`../server/README.md`](../server/README.md)) — or run `npm run dev` from the repository root to start both.

No API keys are needed: the backend serves its offline catalog and in-memory store automatically.

## Environment

| Variable | Default | Purpose |
| --- | --- | --- |
| `VITE_API_BASE_URL` | empty | Set to the API origin when serving the client separately; empty uses the dev proxy |
| `VITE_PROXY_TARGET` | `http://localhost:4000` | Backend target for the Vite `/api` proxy |

Copy `.env.example` to `.env` only if you need to override them.

## Features

- **Dashboard** — **Films** and **Series** tabs, each with its own feed (newest-first releases and most-popular series), responsive poster grid, skeleton/error/empty states and infinite scroll (with a load-more fallback). In-flight requests are aborted when you search, switch tabs or navigate, and every API call has a 20-second timeout.
- **Cross-media search** — `/search?q=…` queries `/api/search` and shows films and series together, each card linking to its own detail route. The query lives in the URL so results can be shared or reloaded.
- **AI semantic search** — the prominent bar posts a natural-language query to `/api/search/semantic`. The interpretation (genres, keywords, years, rating floor) is shown above the results, with a clear action back to the latest feed. It works with an LLM or the backend's deterministic interpreter.
- **Movie details** — `/movies/:id` loads backdrop, poster, overview, genres, certification, runtime, score, director, top-billed cast and trailer. Cast portraits use `w185` TMDB URLs and fall back to a monogram avatar (initials) when a portrait is missing or fails to load.
- **Series details** — `/tv/:id` shows first/last air dates, season and episode counts, network, creators, certification, rating, a season list, the cast grid and a trailer link. Series are browse-only for now: the watchlist and reviews remain film-only.
- **Accounts** — JWT login/register modal; the token is persisted in `localStorage` and restored through `/api/auth/me` on reload.
- **Watchlist** — bookmark buttons on cards and the detail page call the protected watchlist API; the slide-over drawer lists saved films, supports removal, and has signed-out and empty states.
- **Resilience** — a top-level error boundary replaces a blank screen with a reload action, and missing or broken artwork falls back to typography or a cast placeholder.

## Scripts

```bash
npm run dev        # Vite dev server
npm run build      # tsc --noEmit && vite build
npm run preview    # serve the production build
npm run typecheck  # tsc --noEmit (strict)
npm test           # Vitest + Testing Library
```

## Structure

```text
src/
├── api/
│   ├── client.ts              # fetch wrapper, ApiError + endpoints
│   └── types.ts               # API payload types
├── context/                   # auth (JWT) and watchlist state
├── components/                # header, search, cards, dialogs, drawer
├── pages/                     # Dashboard, Search, MovieDetail, TvDetail, NotFound
├── lib/
│   ├── format.ts              # dates, runtimes, vote counts
│   └── errors.ts              # typed helpers for unknown errors
├── test/                      # setup + integration tests
├── App.tsx                    # providers, routes, shell
├── index.css                  # Tailwind v4 theme + base styles
└── main.tsx                   # entry point
```

## Tests

The suite mocks the API at the `fetch` boundary and covers the latest feed, semantic search submission, detail loading, and the signed-out → sign-in → watchlist-add flow (including the bearer token). Separate resilience tests cover the error boundary, missing/broken artwork, and request timeouts.

```bash
npm test
npm run build
```
