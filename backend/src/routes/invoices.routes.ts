import { Router } from 'express';
import { InvoicesController } from '../controllers/invoices.controller';
import { authenticate } from '../middleware/auth';
import { authorize } from '../middleware/authorize';
import { organizationContext } from '../middleware/organizationContext';
import { validate } from '../utils/validators';
import { createInvoiceSchema, updateInvoiceStatusSchema } from '../utils/validators';

const router = Router();
const invoicesController = new InvoicesController();

// All routes require authentication
router.use(authenticate);
router.use(organizationContext);

// List invoices - superadmin/admin sees their org, master_admin sees all
router.get(
  '/',
  authorize(['master_admin', 'superadmin', 'admin']),
  invoicesController.getInvoices.bind(invoicesController)
);

// Get invoice by ID
router.get(
  '/:id',
  authorize(['master_admin', 'superadmin', 'admin']),
  invoicesController.getInvoiceById.bind(invoicesController)
);

// Create invoice - master_admin only
router.post(
  '/',
  authorize(['master_admin']),
  validate(createInvoiceSchema),
  invoicesController.createInvoice.bind(invoicesController)
);

// Update invoice status - master_admin only
router.patch(
  '/:id/status',
  authorize(['master_admin']),
  validate(updateInvoiceStatusSchema),
  invoicesController.updateInvoiceStatus.bind(invoicesController)
);

// Billing analytics - master_admin only
router.get(
  '/analytics/revenue',
  authorize(['master_admin']),
  invoicesController.getBillingAnalytics.bind(invoicesController)
);

export default router;
