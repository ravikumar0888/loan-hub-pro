import { Router } from 'express';
import { DsasController } from '../controllers/dsas.controller';
import { authenticate } from '../middleware/auth';
import { authorize } from '../middleware/authorize';
import { validate } from '../middleware/validator';
import { createDsaSchema, updateDsaSchema } from '../utils/validators';

const router = Router();
const dsasController = new DsasController();

// All routes require authentication
router.use(authenticate);

// Get all DSAs (for dropdowns) - accessible by all authenticated users
router.get('/all', dsasController.getAllDsas.bind(dsasController));

// Admin only routes
router.get('/', authorize(['admin']), dsasController.getDsas.bind(dsasController));
router.get('/:id', authorize(['admin']), dsasController.getDsaById.bind(dsasController));
router.post('/', authorize(['admin']), validate(createDsaSchema), dsasController.createDsa.bind(dsasController));
router.put('/:id', authorize(['admin']), validate(updateDsaSchema), dsasController.updateDsa.bind(dsasController));
router.delete('/:id', authorize(['admin']), dsasController.deleteDsa.bind(dsasController));

export default router;
