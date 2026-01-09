import { Router } from 'express';
import { OrganizationsController } from '../controllers/organizations.controller';
import { authenticate } from '../middleware/auth';
import { authorize } from '../middleware/authorize';
import { organizationContext } from '../middleware/organizationContext';
import { validate } from '../utils/validators';
import { updateOrganizationSchema } from '../utils/validators';

const router = Router();
const organizationsController = new OrganizationsController();

// All routes require authentication
router.use(authenticate);
router.use(organizationContext);

// List organizations - master_admin only
router.get(
  '/',
  authorize(['master_admin']),
  organizationsController.getOrganizations.bind(organizationsController)
);

// Get organization by ID - superadmin/admin can see their own, master_admin can see all
router.get(
  '/:id',
  authorize(['master_admin', 'superadmin', 'admin']),
  organizationsController.getOrganizationById.bind(organizationsController)
);

// Update organization - superadmin/admin can update their own, master_admin can update all
router.put(
  '/:id',
  authorize(['master_admin', 'superadmin', 'admin']),
  validate(updateOrganizationSchema),
  organizationsController.updateOrganization.bind(organizationsController)
);

// Delete organization - master_admin only
router.delete(
  '/:id',
  authorize(['master_admin']),
  organizationsController.deleteOrganization.bind(organizationsController)
);

// Get organization statistics
router.get(
  '/:id/stats',
  authorize(['master_admin', 'superadmin', 'admin']),
  organizationsController.getOrganizationStats.bind(organizationsController)
);

export default router;
