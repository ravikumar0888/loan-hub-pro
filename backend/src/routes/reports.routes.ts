import { Router } from 'express';
import { ReportsController } from '../controllers/reports.controller';
import { authenticate } from '../middleware/auth';
import { organizationContext } from '../middleware/organizationContext';

const router = Router();
const reportsController = new ReportsController();

// All routes require authentication and organization context
router.use(authenticate);
router.use(organizationContext);

router.get('/', reportsController.generateReport.bind(reportsController));
router.get('/summary', reportsController.getReportSummary.bind(reportsController));
router.get('/export', reportsController.exportReport.bind(reportsController));

export default router;
