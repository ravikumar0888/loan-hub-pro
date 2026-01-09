import { Router } from 'express';
import { ProfileController } from '../controllers/profile.controller';
import { authenticate } from '../middleware/auth';
import { uploadProfilePhoto } from '../middleware/upload';

const router = Router();
const profileController = new ProfileController();

// Get current user profile
router.get('/me', authenticate, profileController.getProfile);

// Update profile (with optional photo)
router.put('/me', authenticate, uploadProfilePhoto, profileController.updateProfile);

// Upload/change photo only
router.post('/me/photo', authenticate, uploadProfilePhoto, profileController.uploadPhoto);

// Delete photo
router.delete('/me/photo', authenticate, profileController.deletePhoto);

export default router;
