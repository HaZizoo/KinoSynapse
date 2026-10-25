import assert from 'node:assert/strict';
import { after, afterEach, describe, test } from 'node:test';
import nock from 'nock';
import request from 'supertest';

/**
 * Verifies the live TMDB response mapping and that a rejected key degrades to
 * the local catalog instead of failing the request. No network access: nock
 * intercepts every TMDB call.
 */

process.env.NODE_ENV = 'test';
process.env.MONGODB_URI = 'mongodb://127.0.0.1:27017/kinosynapse-test';
process.env.TMDB_API_KEY = 'live-tmdb-key-0123456789abcdef0123';
process.env.TMDB_BASE_URL = 'https://api.themoviedb.org/3';
process.env.TMDB_IMAGE_BASE_URL = 'https://image.tmdb.org/t/p';
process.env.TMDB_LANGUAGE = 'en-US';
process.env.JWT_SECRET = 'online-suite-jwt-secret-with-32-characters';
process.env.JWT_EXPIRES_IN = '1h';
process.env.CLIENT_ORIGIN = 'http://localhost:5173';
process.env.LLM_API_KEY = '';

const { createApp } = await import('../src/app.js');

const app = createApp();
const TMDB_API = 'https://api.themoviedb.org';

const movieFixture = {
  id: 603,
  title: 'The Matrix',
  overview: 'A hacker learns the truth about his reality.',
  release_date: '1999-03-31',
  poster_path: '/matrix.jpg',
  backdrop_path: '/matrix-backdrop.jpg',
  vote_average: 8.24,
  vote_count: 25_000,
  popularity: 100,
};

const detailsFixture = {
  ...movieFixture,
  original_title: 'The Matrix',
  tagline: 'Welcome to the Real World.',
  status: 'Released',
  runtime: 136,
  genres: [
    { id: 28, name: 'Action' },
    { id: 878, name: 'Science Fiction' },
  ],
  homepage: 'https://example.com/matrix',
  budget: 63_000_000,
  revenue: 460_000_000,
  credits: {
    cast: [
      { id: 6384, name: 'Keanu Reeves', character: 'Neo', profile_path: '/keanu.jpg' },
      { id: 2975, name: 'Laurence Fishburne', character: 'Morpheus', profile_path: null },
    ],
    crew: [{ id: 9339, name: 'Lana Wachowski', job: 'Director' }],
  },
  release_dates: {
    results: [{ iso_3166_1: 'US', release_dates: [{ certification: 'R' }] }],
  },
  videos: {
    results: [{ key: 'vKQi3bBA1y8', name: 'Official Trailer', site: 'YouTube', type: 'Trailer' }],
  },
};

nock.disableNetConnect();
nock.enableNetConnect((host) => host.includes('127.0.0.1') || host.includes('localhost'));

after(() => {
  nock.enableNetConnect();
  nock.cleanAll();
});

afterEach(() => {
  nock.cleanAll();
});

describe('live TMDB mode', () => {
  test('maps a discover response into the public movie shape', async () => {
    nock(TMDB_API)
      .get('/3/discover/movie')
      .query(true)
      .reply(200, { page: 1, total_pages: 3, total_results: 45, results: [movieFixture] });

    const res = await request(app).get('/api/movies?page=1');

    assert.equal(res.status, 200);
    assert.equal(res.body.totalResults, 45);
    assert.equal(res.body.results.length, 1);
    assert.equal(res.body.results[0].title, 'The Matrix');
    assert.equal(res.body.results[0].posterUrl, 'https://image.tmdb.org/t/p/w500/matrix.jpg');
    assert.deepEqual(res.body.results[0].rating, { average: 8.2, count: 25_000 });
    assert.equal(res.body.results[0].backdropUrl, 'https://image.tmdb.org/t/p/w1280/matrix-backdrop.jpg');
  });

  test('maps credits, certification and trailer from movie details', async () => {
    nock(TMDB_API).get('/3/movie/603').query(true).reply(200, detailsFixture);

    const res = await request(app).get('/api/movies/603');

    assert.equal(res.status, 200);
    assert.equal(res.body.title, 'The Matrix');
    assert.equal(res.body.runtime, 136);
    assert.equal(res.body.certification, 'R');
    assert.equal(res.body.director.name, 'Lana Wachowski');
    assert.equal(res.body.cast[0].character, 'Neo');
    assert.equal(res.body.cast[0].profileUrl, 'https://image.tmdb.org/t/p/w185/keanu.jpg');
    assert.equal(res.body.cast[1].profileUrl, null);
    assert.equal(res.body.trailer.key, 'vKQi3bBA1y8');
    assert.equal(res.body.genres[1].name, 'Science Fiction');
  });

  test('searches TMDB /search/movie with the API key', async () => {
    nock(TMDB_API)
      .get('/3/search/movie')
      .query((query) => query.api_key === process.env.TMDB_API_KEY && query.query === 'matrix')
      .reply(200, { page: 1, total_pages: 1, total_results: 1, results: [movieFixture] });

    const res = await request(app).get('/api/movies/search?query=matrix');

    assert.equal(res.status, 200);
    assert.equal(res.body.source, 'search');
    assert.equal(res.body.totalResults, 1);
    assert.equal(res.body.results[0].title, 'The Matrix');
  });

  test('discovers through TMDB /discover/movie with resolved filters', async () => {
    nock(TMDB_API)
      .get('/3/genre/movie/list')
      .query(true)
      .reply(200, { genres: [{ id: 28, name: 'Action' }] });

    nock(TMDB_API)
      .get('/3/discover/movie')
      .query(
        (query) =>
          query.api_key === process.env.TMDB_API_KEY &&
          query.with_genres === '28' &&
          query['primary_release_date.gte'] === '1999-01-01' &&
          query['primary_release_date.lte'] === '1999-12-31' &&
          query['vote_average.gte'] === '7' &&
          query.sort_by === 'vote_average.desc',
      )
      .reply(200, { page: 1, total_pages: 2, total_results: 20, results: [movieFixture] });

    const res = await request(app).get(
      '/api/movies/discover?genre=action&year=1999&minRating=7&sortBy=rating',
    );

    assert.equal(res.status, 200);
    assert.equal(res.body.source, 'discover');
    assert.equal(res.body.totalResults, 20);
    assert.equal(res.body.results[0].title, 'The Matrix');
  });

  test('falls back to the catalog when TMDB rejects the key', async () => {
    nock(TMDB_API)
      .get('/3/movie/603')
      .query(true)
      .reply(401, { status_code: 7, status_message: 'Invalid API key' });

    const res = await request(app).get('/api/movies/603');

    // The catalog also knows The Matrix, so the request still succeeds — with
    // the fuller offline detail payload rather than an error.
    assert.equal(res.status, 200);
    assert.equal(res.body.title, 'The Matrix');
    assert.equal(res.body.cast.length, 5);

    const health = await request(app).get('/api/health');
    assert.equal(health.body.mode.tmdb, 'catalog');
  });
});
