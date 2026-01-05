import { Router } from 'express';
import { ReportsController } from '../controllers/reports.controller';
import { authenticate } from '../middleware/auth';

const router = Router();
const reportsController = new ReportsController();

// All routes require authentication
router.use(authenticate);

router.get('/', reportsController.generateReport.bind(reportsController));
router.get('/summary', reportsController.getReportSummary.bind(reportsController));
router.get('/export', reportsController.exportReport.bind(reportsController));

export default router;
