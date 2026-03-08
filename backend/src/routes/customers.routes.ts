import { Router } from 'express';
import { CustomersController } from '../controllers/customers.controller';
import { authenticate } from '../middleware/auth';
import { authorize } from '../middleware/authorize';
import { validate } from '../middleware/validator';
import { createCustomerSchema, updateCustomerSchema, addRemarkSchema } from '../utils/validators';
import { organizationContext } from '../middleware/organizationContext';

const router = Router();
const customersController = new CustomersController();

// All routes require authentication and organization context
router.use(authenticate);
router.use(organizationContext);

// Get customers - all roles (filtered by role in service)
router.get('/', customersController.getCustomers.bind(customersController));
router.get('/:id', customersController.getCustomerById.bind(customersController));

// Create customer - superadmin, admin and backoffice only
router.post(
  '/',
  authorize(['superadmin', 'admin', 'backoffice']),
  validate(createCustomerSchema),
  customersController.createCustomer.bind(customersController)
);

// Update customer - superadmin, admin and backoffice only
router.put(
  '/:id',
  authorize(['superadmin', 'admin', 'backoffice']),
  validate(updateCustomerSchema),
  customersController.updateCustomer.bind(customersController)
);

// Delete customer - superadmin and admin only
router.delete('/:id', authorize(['superadmin', 'admin']), customersController.deleteCustomer.bind(customersController));

// Remarks management - all authenticated users can add/view
router.post('/:id/remarks', validate(addRemarkSchema), customersController.addRemark.bind(customersController));
router.get('/:id/remarks', customersController.getCustomerRemarks.bind(customersController));

// PDF generation - all authenticated users
router.post('/:id/generate-pdf', customersController.generatePDF.bind(customersController));

// Duplicate customer - superadmin, admin and backoffice only
router.post('/:id/duplicate', authorize(['superadmin', 'admin', 'backoffice']), customersController.duplicateCustomer.bind(customersController));

export default router;
