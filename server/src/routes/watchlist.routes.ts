import { Router } from 'express';
import {
  addToWatchlist,
  checkWatchlistItem,
  getWatchlist,
  removeFromWatchlist,
} from '../controllers/watchlist.controller.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

router.use(requireAuth);

router.get('/', getWatchlist);
router.post('/', addToWatchlist);
router.get('/:movieId', checkWatchlistItem);
router.delete('/:movieId', removeFromWatchlist);

export default router;
