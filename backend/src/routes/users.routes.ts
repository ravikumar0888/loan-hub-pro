import { Router } from 'express';
import { UsersController } from '../controllers/users.controller';
import { authenticate } from '../middleware/auth';
import { authorize } from '../middleware/authorize';
import { validate } from '../middleware/validator';
import { createUserSchema, updateUserSchema } from '../utils/validators';

const router = Router();
const usersController = new UsersController();

// All routes require authentication
router.use(authenticate);

// Get connectors (accessible by all authenticated users)
router.get('/connectors', usersController.getConnectors.bind(usersController));

// Admin only routes
router.get('/', authorize(['admin']), usersController.getUsers.bind(usersController));
router.get('/:id', authorize(['admin']), usersController.getUserById.bind(usersController));
router.post('/', authorize(['admin']), validate(createUserSchema), usersController.createUser.bind(usersController));
router.put('/:id', authorize(['admin']), validate(updateUserSchema), usersController.updateUser.bind(usersController));
router.delete('/:id', authorize(['admin']), usersController.deleteUser.bind(usersController));

export default router;
