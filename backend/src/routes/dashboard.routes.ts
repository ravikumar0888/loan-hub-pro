import { Router } from 'express';
import { DashboardController } from '../controllers/dashboard.controller';
import { authenticate } from '../middleware/auth';
import { organizationContext } from '../middleware/organizationContext';

const router = Router();
const dashboardController = new DashboardController();

// All routes require authentication and organization context
router.use(authenticate);
router.use(organizationContext);

router.get('/kpis', dashboardController.getKPIs.bind(dashboardController));
router.get('/trends', dashboardController.getTrendData.bind(dashboardController));
router.get('/recent-customers', dashboardController.getRecentCustomers.bind(dashboardController));

export default router;
