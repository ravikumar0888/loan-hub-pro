import { Router } from 'express';
import { SignupController } from '../controllers/signup.controller';

const router = Router();
const signupController = new SignupController();

// Public signup endpoint (no authentication required)
router.post(
  '/',
  signupController.signup.bind(signupController)
);

export default router;
