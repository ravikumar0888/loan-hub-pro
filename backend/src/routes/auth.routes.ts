import { Router } from 'express';
import { AuthController } from '../controllers/auth.controller';
import { authenticate } from '../middleware/auth';

const router = Router();
const authController = new AuthController();

/**
 * POST /api/auth/login
 * Public login endpoint
 */
router.post('/login', (req, res, next) => authController.login(req, res, next));

/**
 * GET /api/auth/me
 * Get current authenticated user
 * Requires authentication
 */
router.get('/me', authenticate, (req, res, next) => authController.me(req, res, next));

export default router;
