import assert from 'node:assert/strict';
import { beforeEach, describe, test } from 'node:test';
import request from 'supertest';

/**
 * Zero-configuration suite: no MongoDB, no TMDB key, no LLM key, no outbound
 * network. It proves the app is fully usable on a clean checkout.
 */

process.env.NODE_ENV = 'test';
process.env.MONGODB_URI = 'mongodb://127.0.0.1:27017/kinosynapse-test';
process.env.TMDB_API_KEY = '';
process.env.TMDB_BASE_URL = 'https://api.themoviedb.org/3';
process.env.TMDB_IMAGE_BASE_URL = 'https://image.tmdb.org/t/p';
process.env.TMDB_LANGUAGE = 'en-US';
process.env.JWT_SECRET = 'offline-suite-jwt-secret-with-32-characters';
process.env.JWT_EXPIRES_IN = '1h';
process.env.CLIENT_ORIGIN = 'http://localhost:5173';
process.env.LLM_API_KEY = '';
process.env.MAX_WATCHLIST_ITEMS = '2';

const { createApp } = await import('../src/app.js');
const { resetMemoryStore } = await import('../src/repositories/memory.js');

const app = createApp();
const bearer = (token: string): { Authorization: string } => ({ Authorization: `Bearer ${token}` });

let userSequence = 0;

async function register(overrides: Record<string, string> = {}) {
  userSequence += 1;
  return request(app)
    .post('/api/auth/register')
    .send({
      name: 'Test User',
      email: `user${userSequence}@example.com`,
      password: 'password123',
      ...overrides,
    });
}

beforeEach(() => {
  resetMemoryStore();
});

describe('health and offline catalog', () => {
  test('GET /api/health reports catalog and memory modes', async () => {
    const res = await request(app).get('/api/health');

    assert.equal(res.status, 200);
    assert.equal(res.body.status, 'ok');
    assert.equal(res.body.mode.tmdb, 'catalog');
    assert.equal(res.body.mode.database, 'memory');
  });

  test('GET /api/movies serves the bundled catalog newest-first', async () => {
    const first = await request(app).get('/api/movies?page=1');

    assert.equal(first.status, 200);
    assert.equal(first.body.page, 1);
    assert.equal(first.body.totalResults, 18);
    assert.equal(first.body.results.length, 12);

    const dates = first.body.results.map((movie: { releaseDate: string }) => movie.releaseDate);
    assert.deepEqual(dates, [...dates].sort().reverse());

    const movie = first.body.results[0];
    assert.equal(movie.title, 'Everything Everywhere All at Once');
    assert.match(movie.posterUrl, /^https:\/\/image\.tmdb\.org\/t\/p\/w500\//);
    assert.match(movie.backdropUrl, /^https:\/\/image\.tmdb\.org\/t\/p\/w1280\//);
    assert.equal(typeof movie.rating.average, 'number');
    assert.ok(movie.overview.length > 20);

    const second = await request(app).get('/api/movies?page=2');
    assert.equal(second.status, 200);
    assert.equal(second.body.results.length, 6);
  });

  test('GET /api/movies/:id returns full catalog details', async () => {
    const res = await request(app).get('/api/movies/603');

    assert.equal(res.status, 200);
    assert.equal(res.body.title, 'The Matrix');
    assert.equal(res.body.runtime, 136);
    assert.equal(res.body.certification, 'R');
    assert.equal(res.body.director.name, 'Lana Wachowski');
    assert.equal(res.body.cast.length, 5);
    assert.equal(res.body.cast[0].name, 'Keanu Reeves');
    assert.deepEqual(
      res.body.genres.map((genre: { name: string }) => genre.name),
      ['Action', 'Science Fiction'],
    );
    assert.ok(res.body.overview.includes('simulation'));
    assert.equal(res.body.trailer.key, 'vKQi3bBA1y8');
  });

  test('GET /api/movies/:id returns 404 for an unknown film', async () => {
    const res = await request(app).get('/api/movies/999999');
    assert.equal(res.status, 404);
    assert.match(res.body.error.message, /not found/i);
  });

  test('GET /api/movies rejects an invalid id', async () => {
    const res = await request(app).get('/api/movies/not-a-number');
    assert.equal(res.status, 400);
  });
});

describe('deterministic semantic search', () => {
  test('filters the catalog by genre and rating without an LLM', async () => {
    const res = await request(app)
      .post('/api/search/semantic')
      .send({ query: 'animated movies with great ratings' });

    assert.equal(res.status, 200);
    assert.equal(res.body.source, 'catalog');
    assert.equal(res.body.interpretation.strategy, 'heuristic');
    assert.deepEqual(res.body.interpretation.matchedGenres, ['Animation']);
    assert.equal(res.body.interpretation.minRating, 7.5);

    const ids = res.body.results.map((movie: { id: number }) => movie.id);
    assert.deepEqual(ids, [129, 324857, 862]);
  });

  test('is deterministic across repeated identical requests', async () => {
    const payload = { query: 'space movies from the 90s' };

    const first = await request(app).post('/api/search/semantic').send(payload);
    const second = await request(app).post('/api/search/semantic').send(payload);

    assert.equal(first.status, 200);
    assert.deepEqual(first.body, second.body);
    assert.equal(first.body.interpretation.yearFrom, 1990);
    assert.equal(first.body.interpretation.yearTo, 1999);
    assert.deepEqual(
      first.body.results.map((movie: { id: number }) => movie.id),
      [603],
    );
  });

  test('validates the query text', async () => {
    const res = await request(app).post('/api/search/semantic').send({ query: 'a' });
    assert.equal(res.status, 400);
  });
});

describe('authentication', () => {
  test('registers, rejects duplicates, logs in and reads the session', async () => {
    const created = await register({ name: 'Ada' });

    assert.equal(created.status, 201);
    assert.equal(typeof created.body.token, 'string');
    assert.equal(created.body.user.name, 'Ada');
    assert.equal(created.body.user.passwordHash, undefined);

    const duplicate = await register({ email: created.body.user.email });
    assert.equal(duplicate.status, 409);

    const wrongPassword = await request(app)
      .post('/api/auth/login')
      .send({ email: created.body.user.email, password: 'not-the-password' });
    assert.equal(wrongPassword.status, 401);

    const login = await request(app)
      .post('/api/auth/login')
      .send({ email: created.body.user.email, password: 'password123' });
    assert.equal(login.status, 200);

    const me = await request(app).get('/api/auth/me').set(bearer(login.body.token));
    assert.equal(me.status, 200);
    assert.equal(me.body.user.id, created.body.user.id);
    assert.equal(me.body.user.email, created.body.user.email);

    const unauthenticated = await request(app).get('/api/auth/me');
    assert.equal(unauthenticated.status, 401);
  });

  test('rejects a token signed with the wrong issuer', async () => {
    const jwt = (await import('jsonwebtoken')).default;
    const created = await register();

    const forged = jwt.sign({}, process.env.JWT_SECRET as string, {
      subject: created.body.user.id,
      expiresIn: '1h',
      issuer: 'not-kinosynapse',
      audience: 'kinosynapse-client',
    });

    const res = await request(app).get('/api/auth/me').set(bearer(forged));
    assert.equal(res.status, 401);
  });
});

describe('watchlist', () => {
  test('requires auth and protects against duplicates', async () => {
    const created = await register();
    const token = created.body.token;

    const unauthenticated = await request(app).get('/api/watchlist');
    assert.equal(unauthenticated.status, 401);

    const empty = await request(app).get('/api/watchlist').set(bearer(token));
    assert.equal(empty.status, 200);
    assert.deepEqual(empty.body.watchlist, []);

    const added = await request(app)
      .post('/api/watchlist')
      .set(bearer(token))
      .send({ movieId: 603 });
    assert.equal(added.status, 201);
    assert.equal(added.body.item.movieId, 603);
    assert.equal(added.body.item.title, 'The Matrix');
    assert.match(added.body.item.posterUrl, /^https:\/\/image\.tmdb\.org\/t\/p\/w342\//);

    const duplicate = await request(app)
      .post('/api/watchlist')
      .set(bearer(token))
      .send({ movieId: 603 });
    assert.equal(duplicate.status, 409);

    const listed = await request(app).get('/api/watchlist').set(bearer(token));
    assert.equal(listed.body.count, 1);
    assert.equal(listed.body.watchlist[0].title, 'The Matrix');

    const check = await request(app).get('/api/watchlist/603').set(bearer(token));
    assert.equal(check.body.inWatchlist, true);

    const removed = await request(app).delete('/api/watchlist/603').set(bearer(token));
    assert.equal(removed.status, 204);

    const removedAgain = await request(app).delete('/api/watchlist/603').set(bearer(token));
    assert.equal(removedAgain.status, 404);
  });

  test('enforces the per-user watchlist cap', async () => {
    const created = await register();
    const token = created.body.token;

    for (const movieId of [603, 155]) {
      const res = await request(app).post('/api/watchlist').set(bearer(token)).send({ movieId });
      assert.equal(res.status, 201);
    }

    const overflow = await request(app)
      .post('/api/watchlist')
      .set(bearer(token))
      .send({ movieId: 680 });
    assert.equal(overflow.status, 400);
  });
});

describe('reviews', () => {
  test('creates, updates, lists and deletes reviews with ownership checks', async () => {
    const first = await register({ name: 'First Reviewer' });
    const second = await register({ name: 'Second Reviewer' });

    const created = await request(app)
      .post('/api/movies/603/reviews')
      .set(bearer(first.body.token))
      .send({ rating: 8, title: 'Classic', body: 'Still holds up.' });

    assert.equal(created.status, 200);
    assert.equal(created.body.review.rating, 8);
    assert.equal(created.body.review.user.name, 'First Reviewer');

    const updated = await request(app)
      .post('/api/movies/603/reviews')
      .set(bearer(first.body.token))
      .send({ rating: 9, body: 'Even better on rewatch.' });
    assert.equal(updated.status, 200);
    assert.equal(updated.body.review.rating, 9);
    assert.equal(updated.body.review.id, created.body.review.id);

    const secondReview = await request(app)
      .post('/api/movies/603/reviews')
      .set(bearer(second.body.token))
      .send({ rating: 6, body: 'Not for me.' });
    assert.equal(secondReview.status, 200);

    const listed = await request(app).get('/api/movies/603/reviews');
    assert.equal(listed.status, 200);
    assert.equal(listed.body.count, 2);
    assert.equal(listed.body.averageRating, 7.5);
    assert.equal(listed.body.results[0].movieId, 603);

    const notOwner = await request(app)
      .delete(`/api/movies/603/reviews/${created.body.review.id}`)
      .set(bearer(second.body.token));
    assert.equal(notOwner.status, 404);

    const removed = await request(app)
      .delete(`/api/movies/603/reviews/${created.body.review.id}`)
      .set(bearer(first.body.token));
    assert.equal(removed.status, 204);

    const afterDelete = await request(app).get('/api/movies/603/reviews');
    assert.equal(afterDelete.body.count, 1);
  });

  test('rejects out-of-range and decimal ratings', async () => {
    const created = await register();

    for (const rating of [11, 8.5, 0]) {
      const res = await request(app)
        .post('/api/movies/603/reviews')
        .set(bearer(created.body.token))
        .send({ rating, body: 'Invalid rating.' });
      assert.equal(res.status, 400);
    }

    const listed = await request(app).get('/api/movies/603/reviews');
    assert.equal(listed.body.count, 0);
  });

  test('requires authentication to write reviews', async () => {
    const res = await request(app)
      .post('/api/movies/603/reviews')
      .send({ rating: 8, body: 'Anonymous.' });
    assert.equal(res.status, 401);
  });
});

describe('routing', () => {
  test('returns a JSON 404 for unknown routes', async () => {
    const res = await request(app).get('/api/does-not-exist');
    assert.equal(res.status, 404);
    assert.match(res.body.error.message, /not found/i);
  });
});
