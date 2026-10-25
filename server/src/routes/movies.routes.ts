import { Router } from 'express';
import {
  deleteMovieReview,
  discoverMovies,
  getMovieDetails,
  listLatestMovies,
  listMovieReviews,
  searchMovies,
  upsertMovieReview,
} from '../controllers/movies.controller.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

router.get('/', listLatestMovies);

// Static segments must be registered before `/:id`, otherwise "search" and
// "discover" would be parsed as movie ids.
router.get('/search', searchMovies);
router.get('/discover', discoverMovies);

router.get('/:id', getMovieDetails);

router.get('/:id/reviews', listMovieReviews);
router.post('/:id/reviews', requireAuth, upsertMovieReview);
router.delete('/:id/reviews/:reviewId', requireAuth, deleteMovieReview);

export default router;
