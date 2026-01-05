import { Router } from 'express';
import { BanksController } from '../controllers/banks.controller';
import { authenticate } from '../middleware/auth';
import { authorize } from '../middleware/authorize';
import { validate } from '../middleware/validator';
import { createBankSchema, updateBankSchema } from '../utils/validators';

const router = Router();
const banksController = new BanksController();

// All routes require authentication
router.use(authenticate);

// Get all banks (for dropdowns) - accessible by all authenticated users
router.get('/all', banksController.getAllBanks.bind(banksController));

// Admin only routes
router.get('/', authorize(['admin']), banksController.getBanks.bind(banksController));
router.get('/:id', authorize(['admin']), banksController.getBankById.bind(banksController));
router.post('/', authorize(['admin']), validate(createBankSchema), banksController.createBank.bind(banksController));
router.put('/:id', authorize(['admin']), validate(updateBankSchema), banksController.updateBank.bind(banksController));
router.delete('/:id', authorize(['admin']), banksController.deleteBank.bind(banksController));

export default router;
