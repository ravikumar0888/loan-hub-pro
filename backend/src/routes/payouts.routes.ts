import { Router } from 'express';
import { PayoutsController } from '../controllers/payouts.controller';
import { authenticate, authorize } from '../middleware/auth';
import { organizationContext } from '../middleware/organizationContext';

const router = Router();
const payoutsController = new PayoutsController();

// All routes require authentication and organization context
router.use(authenticate);
router.use(organizationContext);

// Get all connector balances (SuperAdmin, Admin)
router.get(
  '/balances',
  authorize(['superadmin', 'admin']),
  payoutsController.getAllConnectorBalances.bind(payoutsController)
);

// Get specific connector balance (SuperAdmin, Admin, Connector)
router.get(
  '/balance/:connectorId',
  authorize(['superadmin', 'admin', 'connector']),
  payoutsController.getConnectorBalance.bind(payoutsController)
);

// Get monthly payout (SuperAdmin, Admin, Connector)
router.get(
  '/monthly',
  authorize(['superadmin', 'admin', 'connector']),
  payoutsController.getMonthlyPayout.bind(payoutsController)
);

// Get ledger entries (SuperAdmin, Admin, Connector)
router.get(
  '/ledger',
  authorize(['superadmin', 'admin', 'connector']),
  payoutsController.getLedgerEntries.bind(payoutsController)
);

// Get monthly payouts by connector - accordion data (SuperAdmin, Admin, Connector)
router.get(
  '/monthly-by-connector/:connectorId',
  authorize(['superadmin', 'admin', 'connector']),
  payoutsController.getMonthlyPayoutsByConnector.bind(payoutsController)
);

// Add ledger entry (SuperAdmin, Admin only)
router.post(
  '/ledger',
  authorize(['superadmin', 'admin']),
  payoutsController.addLedgerEntry.bind(payoutsController)
);

// Delete ledger entry (SuperAdmin only)
router.delete(
  '/ledger/:id',
  authorize(['superadmin']),
  payoutsController.deleteLedgerEntry.bind(payoutsController)
);

// Generate monthly payout PDF (SuperAdmin, Admin only)
router.post(
  '/generate-pdf',
  authorize(['superadmin', 'admin']),
  payoutsController.generatePayoutPDF.bind(payoutsController)
);

export default router;
