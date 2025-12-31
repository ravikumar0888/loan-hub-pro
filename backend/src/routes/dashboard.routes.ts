import { Router } from 'express';
import { DashboardController } from '../controllers/dashboard.controller';
import { authenticate } from '../middleware/auth';

const router = Router();
const dashboardController = new DashboardController();

// All routes require authentication
router.use(authenticate);

router.get('/kpis', dashboardController.getKPIs.bind(dashboardController));
router.get('/trends', dashboardController.getTrendData.bind(dashboardController));
router.get('/recent-customers', dashboardController.getRecentCustomers.bind(dashboardController));

export default router;
