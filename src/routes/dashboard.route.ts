import { Router } from 'express';
import { validate } from '../middlewares/validate.middleware';
import {
  GetDashboardStatsSchema,
  GetRecentMovementsSchema,
} from '../validations/dashboard.validation';
import { getDashboardStats, getRecentMovements } from '../controllers/dashboard.controller';
import { authenticate } from '../middlewares/authenticate.middleware';

const router = Router();

router.get('/stats', authenticate, validate(GetDashboardStatsSchema), getDashboardStats);
router.get(
  '/recent-movements',
  authenticate,
  validate(GetRecentMovementsSchema),
  getRecentMovements,
);

router.all('/*path', (_req, res) => {
  res.status(405).json({
    success: false,
    message: 'Method Not Allowed',
  });
});

export default router;
