import { Router } from 'express';
import { AuthController } from '../controllers/auth.controller';
import { authenticate } from '../middleware/auth';
import { loginLimiter } from '../middleware/rateLimiters';
import { validate } from '../middleware/validator';
import { forgotPasswordSchema, resetPasswordSchema } from '../utils/validators';

const router = Router();
const authController = new AuthController();

/**
 * POST /api/auth/login
 * Public login endpoint
 */
router.post('/login', loginLimiter, (req, res, next) => authController.login(req, res, next));

/**
 * POST /api/auth/forgot-password
 * Public endpoint - requests a password reset link
 */
router.post(
  '/forgot-password',
  loginLimiter,
  validate(forgotPasswordSchema),
  (req, res, next) => authController.forgotPassword(req, res, next)
);

/**
 * POST /api/auth/reset-password
 * Public endpoint - resets password using a valid reset token
 */
router.post(
  '/reset-password',
  loginLimiter,
  validate(resetPasswordSchema),
  (req, res, next) => authController.resetPassword(req, res, next)
);

/**
 * GET /api/auth/me
 * Get current authenticated user
 * Requires authentication
 */
router.get('/me', authenticate, (req, res, next) => authController.me(req, res, next));

/**
 * POST /api/auth/verify-password
 * Verify password for current user (admin password protection)
 * Requires authentication
 */
router.post('/verify-password', authenticate, (req, res, next) =>
  authController.verifyPassword(req, res, next)
);

export default router;
