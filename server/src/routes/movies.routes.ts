import { Router } from 'express';
import {
  deleteMovieReview,
  getMovieDetails,
  listLatestMovies,
  listMovieReviews,
  upsertMovieReview,
} from '../controllers/movies.controller.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

router.get('/', listLatestMovies);
router.get('/:id', getMovieDetails);

router.get('/:id/reviews', listMovieReviews);
router.post('/:id/reviews', requireAuth, upsertMovieReview);
router.delete('/:id/reviews/:reviewId', requireAuth, deleteMovieReview);

export default router;
