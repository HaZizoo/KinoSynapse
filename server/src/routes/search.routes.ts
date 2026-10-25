import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { isTest } from '../config/env.js';
import { multiSearch, semanticSearch } from '../controllers/search.controller.js';

const semanticLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 15,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  skip: () => isTest,
  handler: (_req, res) => {
    res.status(429).json({
      error: { message: 'Too many semantic searches. Please wait a minute and try again.' },
    });
  },
});

const router = Router();

router.get('/', multiSearch);
router.post('/semantic', semanticLimiter, semanticSearch);

export default router;
