import { Router } from 'express';
import { SignupController } from '../controllers/signup.controller';
import { validate } from '../utils/validators';
import { signupSchema } from '../utils/validators';

const router = Router();
const signupController = new SignupController();

// Public signup endpoint (no authentication required)
router.post(
  '/',
  validate(signupSchema),
  signupController.signup.bind(signupController)
);

export default router;
