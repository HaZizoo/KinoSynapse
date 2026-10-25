import { Router } from 'express';
import {
  discoverTvShows,
  getTvShowDetails,
  listTvShows,
  searchTvShows,
} from '../controllers/tv.controller.js';

const router = Router();

router.get('/', listTvShows);

// Static segments before `/:id`, so "search" and "discover" are not read as ids.
router.get('/search', searchTvShows);
router.get('/discover', discoverTvShows);

router.get('/:id', getTvShowDetails);

export default router;
