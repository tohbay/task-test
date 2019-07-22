import { Router } from 'express';
import authMiddleware from '../../middleware/auth.middleware';
import articleMiddleware from '../../middleware/article.middleware';
import validationMiddleware from '../../middleware/validation.middleware';
import RatingsController from '../../controllers/rating.controller';

const validateRequest = validationMiddleware();

const router = Router();
router.patch(
  '/:articleId/ratings',
  authMiddleware,
  validateRequest,
  articleMiddleware,
  RatingsController.rateArticles
);

export default router;
