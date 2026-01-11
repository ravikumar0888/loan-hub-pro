import { Router } from 'express';
import { DsasController } from '../controllers/dsas.controller';
import { authenticate } from '../middleware/auth';
import { authorize } from '../middleware/authorize';
import { validate } from '../middleware/validator';
import { createDsaSchema, updateDsaSchema } from '../utils/validators';
import { organizationContext } from '../middleware/organizationContext';

const router = Router();
const dsasController = new DsasController();

// All routes require authentication and organization context
router.use(authenticate);
router.use(organizationContext);

// Get all DSAs (for dropdowns) - accessible by all authenticated users
router.get('/all', dsasController.getAllDsas.bind(dsasController));

// Superadmin and Admin only routes
router.get('/', authorize(['superadmin', 'admin']), dsasController.getDsas.bind(dsasController));
router.get('/:id', authorize(['superadmin', 'admin']), dsasController.getDsaById.bind(dsasController));
router.post('/', authorize(['superadmin', 'admin']), validate(createDsaSchema), dsasController.createDsa.bind(dsasController));
router.put('/:id', authorize(['superadmin', 'admin']), validate(updateDsaSchema), dsasController.updateDsa.bind(dsasController));
router.delete('/:id', authorize(['superadmin', 'admin']), dsasController.deleteDsa.bind(dsasController));

export default router;
