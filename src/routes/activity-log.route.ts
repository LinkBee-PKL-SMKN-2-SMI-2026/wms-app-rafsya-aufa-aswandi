import { Router } from 'express';
import { validate } from '../middlewares/validate.middleware';
import { GetActivityLogsSchema } from '../validations/activity-log.validation';
import { getActivityLogs } from '../controllers/activity-log.controller';
import { authenticate } from '../middlewares/authenticate.middleware';

const router = Router();

router.get('/', authenticate, validate(GetActivityLogsSchema), getActivityLogs);

router.all('/*path', (_req, res) => {
  res.status(405).json({
    success: false,
    message: 'Method Not Allowed',
  });
});

export default router;
