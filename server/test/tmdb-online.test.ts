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

const tvFixture = {
  id: 1396,
  name: 'Breaking Bad',
  original_name: 'Breaking Bad',
  overview: 'A chemistry teacher turns to crime.',
  first_air_date: '2008-01-20',
  poster_path: '/breaking-bad.jpg',
  backdrop_path: '/breaking-bad-backdrop.jpg',
  vote_average: 8.94,
  vote_count: 15_000,
  popularity: 90,
};

const tvDetailsFixture = {
  ...tvFixture,
  tagline: 'All bad things must come to an end.',
  status: 'Ended',
  episode_run_time: [47],
  genres: [
    { id: 18, name: 'Drama' },
    { id: 80, name: 'Crime' },
  ],
  homepage: 'https://example.com/breaking-bad',
  networks: [{ name: 'AMC' }],
  number_of_seasons: 5,
  number_of_episodes: 62,
  last_air_date: '2013-09-29',
  in_production: false,
  created_by: [{ id: 66633, name: 'Vince Gilligan' }],
  seasons: [
    { season_number: 0, name: 'Specials', episode_count: 8, air_date: null, poster_path: null },
    {
      season_number: 1,
      name: 'Season 1',
      overview: 'The pilot season.',
      episode_count: 7,
      air_date: '2008-01-20',
      poster_path: '/season-1.jpg',
    },
  ],
  credits: {
    cast: [
      { id: 17419, name: 'Bryan Cranston', character: 'Walter White', profile_path: '/bryan.jpg' },
      { id: 84497, name: 'Aaron Paul', character: 'Jesse Pinkman', profile_path: null },
    ],
  },
  content_ratings: { results: [{ iso_3166_1: 'US', rating: 'TV-MA' }] },
  videos: {
    results: [
      { key: 'HhesaQXLuRY', name: 'Season 1 Trailer', site: 'YouTube', type: 'Trailer' },
    ],
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

  test('maps a series payload into the public shape', async () => {
    nock(TMDB_API).get('/3/tv/1396').query(true).reply(200, tvDetailsFixture);

    const res = await request(app).get('/api/tv/1396');

    assert.equal(res.status, 200);
    assert.equal(res.body.mediaType, 'tv');
    assert.equal(res.body.title, 'Breaking Bad');
    assert.equal(res.body.releaseDate, '2008-01-20');
    assert.equal(res.body.episodeRunTime, 47);
    assert.equal(res.body.certification, 'TV-MA');
    assert.equal(res.body.creators[0].name, 'Vince Gilligan');
    assert.deepEqual(res.body.networks, ['AMC']);
    assert.equal(res.body.cast[0].profileUrl, 'https://image.tmdb.org/t/p/w185/bryan.jpg');
    assert.equal(res.body.cast[1].profileUrl, null);
    assert.equal(res.body.trailer.key, 'HhesaQXLuRY');
    // Season 0 (specials) is not a watchable season and is filtered out.
    assert.equal(res.body.seasons.length, 1);
    assert.equal(res.body.seasons[0].episodeCount, 7);
    assert.equal(res.body.seasons[0].posterUrl, 'https://image.tmdb.org/t/p/w342/season-1.jpg');
    assert.equal(res.body.posterUrl, 'https://image.tmdb.org/t/p/w500/breaking-bad.jpg');
  });

  test('serves the series feed from TMDB /discover/tv', async () => {
    nock(TMDB_API)
      .get('/3/discover/tv')
      .query((query) => query.api_key === process.env.TMDB_API_KEY)
      .reply(200, { page: 1, total_pages: 4, total_results: 80, results: [tvFixture] });

    const res = await request(app).get('/api/tv?page=1');

    assert.equal(res.status, 200);
    assert.equal(res.body.source, 'discover');
    assert.equal(res.body.totalResults, 80);
    assert.equal(res.body.results[0].title, 'Breaking Bad');
    assert.equal(res.body.results[0].mediaType, 'tv');
  });

  test('search /api/search uses TMDB /search/multi and drops people', async () => {
    nock(TMDB_API)
      .get('/3/search/multi')
      .query(
        (query) => query.api_key === process.env.TMDB_API_KEY && query.query === 'breaking',
      )
      .reply(200, {
        page: 1,
        total_pages: 1,
        total_results: 3,
        results: [
          { ...movieFixture, media_type: 'movie' },
          { ...tvFixture, media_type: 'tv' },
          { id: 1, name: 'A Person', media_type: 'person' },
        ],
      });

    const res = await request(app).get('/api/search?query=breaking');

    assert.equal(res.status, 200);
    assert.equal(res.body.source, 'search');
    assert.equal(res.body.results.length, 2);
    assert.deepEqual(
      res.body.results.map((entry: { mediaType: string }) => entry.mediaType),
      ['movie', 'tv'],
    );
    assert.equal(res.body.results[1].title, 'Breaking Bad');
  });

  test('discovers series with first-air-date filters and TV genres', async () => {
    nock(TMDB_API)
      .get('/3/genre/tv/list')
      .query(true)
      .reply(200, { genres: [{ id: 18, name: 'Drama' }] });

    nock(TMDB_API)
      .get('/3/discover/tv')
      .query(
        (query) =>
          query.api_key === process.env.TMDB_API_KEY &&
          query.with_genres === '18' &&
          query['first_air_date.gte'] === '2008-01-01' &&
          query['first_air_date.lte'] === '2008-12-31' &&
          query.sort_by === 'vote_average.desc',
      )
      .reply(200, { page: 1, total_pages: 1, total_results: 1, results: [tvFixture] });

    const res = await request(app).get('/api/tv/discover?genre=drama&year=2008&sortBy=rating');

    assert.equal(res.status, 200);
    assert.equal(res.body.source, 'discover');
    assert.equal(res.body.results[0].title, 'Breaking Bad');
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
