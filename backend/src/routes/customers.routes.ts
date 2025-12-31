import { Router } from 'express';
import { CustomersController } from '../controllers/customers.controller';
import { authenticate } from '../middleware/auth';
import { authorize } from '../middleware/authorize';
import { validate } from '../middleware/validator';
import { createCustomerSchema, updateCustomerSchema, addRemarkSchema } from '../utils/validators';

const router = Router();
const customersController = new CustomersController();

// All routes require authentication
router.use(authenticate);

// Get customers - all roles (filtered by role in service)
router.get('/', customersController.getCustomers.bind(customersController));
router.get('/:id', customersController.getCustomerById.bind(customersController));

// Create customer - admin and backoffice only
router.post(
  '/',
  authorize(['admin', 'backoffice']),
  validate(createCustomerSchema),
  customersController.createCustomer.bind(customersController)
);

// Update customer - admin and backoffice only
router.put(
  '/:id',
  authorize(['admin', 'backoffice']),
  validate(updateCustomerSchema),
  customersController.updateCustomer.bind(customersController)
);

// Delete customer - admin only
router.delete('/:id', authorize(['admin']), customersController.deleteCustomer.bind(customersController));

// Remarks management - all authenticated users can add/view
router.post('/:id/remarks', validate(addRemarkSchema), customersController.addRemark.bind(customersController));
router.get('/:id/remarks', customersController.getCustomerRemarks.bind(customersController));

export default router;
