import { Router } from 'express';
import { UsersController } from '../controllers/users.controller';
import { authenticate } from '../middleware/auth';
import { organizationContext } from '../middleware/organizationContext';
import { authorize } from '../middleware/authorize';
import { validate } from '../middleware/validator';
import { createUserSchema, updateUserSchema } from '../utils/validators';

const router = Router();
const usersController = new UsersController();

// All routes require authentication and organization context
router.use(authenticate);
router.use(organizationContext);

// Get connectors (accessible by all authenticated users)
router.get('/connectors', usersController.getConnectors.bind(usersController));

// Get admins (accessible by all authenticated users)
router.get('/admins', usersController.getAdmins.bind(usersController));

// Get user limits status for the organization (superadmin and admin)
router.get('/limits-status', authorize(['superadmin', 'admin']), usersController.getUserLimitsStatus.bind(usersController));

// Superadmin and Admin only routes
router.get('/', authorize(['superadmin', 'admin']), usersController.getUsers.bind(usersController));
router.get('/:id', authorize(['superadmin', 'admin']), usersController.getUserById.bind(usersController));
router.post('/', authorize(['superadmin', 'admin']), validate(createUserSchema), usersController.createUser.bind(usersController));
router.put('/:id', authorize(['superadmin', 'admin']), validate(updateUserSchema), usersController.updateUser.bind(usersController));
router.delete('/:id', authorize(['superadmin', 'admin']), usersController.deleteUser.bind(usersController));

export default router;
