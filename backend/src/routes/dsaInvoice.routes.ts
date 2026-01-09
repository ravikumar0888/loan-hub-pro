import { Router } from 'express';
import { dsaInvoiceController } from '../controllers/dsaInvoice.controller';
import { authenticate } from '../middleware/auth';
import { authorize } from '../middleware/auth';

const router = Router();

// All routes require authentication
router.use(authenticate);

/**
 * @route   POST /api/dsa-invoices
 * @desc    Generate a new DSA invoice
 * @access  Admin, SuperAdmin
 */
router.post(
  '/',
  authorize(['admin', 'superadmin']),
  dsaInvoiceController.generateInvoice.bind(dsaInvoiceController)
);

/**
 * @route   GET /api/dsa-invoices
 * @desc    Get all invoices with optional filters
 * @access  Admin, SuperAdmin
 */
router.get(
  '/',
  authorize(['admin', 'superadmin']),
  dsaInvoiceController.getInvoices.bind(dsaInvoiceController)
);

/**
 * @route   GET /api/dsa-invoices/:id
 * @desc    Get a single invoice by ID
 * @access  Admin, SuperAdmin
 */
router.get(
  '/:id',
  authorize(['admin', 'superadmin']),
  dsaInvoiceController.getInvoiceById.bind(dsaInvoiceController)
);

/**
 * @route   DELETE /api/dsa-invoices/:id
 * @desc    Delete an invoice
 * @access  Admin, SuperAdmin
 */
router.delete(
  '/:id',
  authorize(['admin', 'superadmin']),
  dsaInvoiceController.deleteInvoice.bind(dsaInvoiceController)
);

export default router;
