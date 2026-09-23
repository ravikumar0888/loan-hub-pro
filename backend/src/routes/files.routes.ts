import { Router } from 'express';
import { filesController } from '../controllers/files.controller';
import { authenticate } from '../middleware/auth';
import { organizationContext } from '../middleware/organizationContext';

const router = Router();

router.use(authenticate);
router.use(organizationContext);

router.get('/pdf', filesController.getPdf.bind(filesController));
router.get('/upload', filesController.getUpload.bind(filesController));

export default router;
