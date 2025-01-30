import express from 'express';
import { AdminDashboardController } from '../controller/admin_dashboardController';

const router = express.Router();

router.get('/stats', AdminDashboardController.getDashboardStats);
router.get('/revenue', AdminDashboardController.getRevenueStats);
router.get('/popular-locations', AdminDashboardController.getPopularLocations);

export default router; 