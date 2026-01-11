import { Router } from 'express';
import { BanksController } from '../controllers/banks.controller';
import { authenticate } from '../middleware/auth';
import { authorize } from '../middleware/authorize';
import { validate } from '../middleware/validator';
import { createBankSchema, updateBankSchema } from '../utils/validators';
import { organizationContext } from '../middleware/organizationContext';

const router = Router();
const banksController = new BanksController();

// All routes require authentication and organization context
router.use(authenticate);
router.use(organizationContext);

// Get all banks (for dropdowns) - accessible by all authenticated users
router.get('/all', banksController.getAllBanks.bind(banksController));

// Superadmin and Admin only routes
router.get('/', authorize(['superadmin', 'admin']), banksController.getBanks.bind(banksController));
router.get('/:id', authorize(['superadmin', 'admin']), banksController.getBankById.bind(banksController));
router.post('/', authorize(['superadmin', 'admin']), validate(createBankSchema), banksController.createBank.bind(banksController));
router.put('/:id', authorize(['superadmin', 'admin']), validate(updateBankSchema), banksController.updateBank.bind(banksController));
router.delete('/:id', authorize(['superadmin', 'admin']), banksController.deleteBank.bind(banksController));

export default router;
