import { Router } from 'express';
import { BackupController } from '../controllers/backup.controller';
import { authenticate } from '../middleware/auth';
import { authorize } from '../middleware/authorize';
import { organizationContext } from '../middleware/organizationContext';

const router = Router();
const backupController = new BackupController();

// All routes require authentication and organization context
router.use(authenticate);
router.use(organizationContext);

// Download database backup - superadmin only
router.post('/download', authorize(['superadmin']), backupController.downloadBackup.bind(backupController));

export default router;
