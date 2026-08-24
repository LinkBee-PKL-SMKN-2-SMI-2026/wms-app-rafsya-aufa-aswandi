import { Router } from 'express';
import authRoute from './auth.route';
import categoryRoute from './category.route';
import locationRoute from './location.route';
import productRoute from './product.route';
import movementRoute from './stock-movement.route';
import reportRoute from './reporting.route';
import dashboardRoute from './dashboard.route';

const router = Router();

router.use('/auth', authRoute);
router.use('/categories', categoryRoute);
router.use('/locations', locationRoute);
router.use('/products', productRoute);
router.use('/movements', movementRoute);
router.use('/reports', reportRoute);
router.use('/dashboard', dashboardRoute);

export default router;
