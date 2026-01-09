import { Response, NextFunction } from 'express';
import { AuthRequest } from '../types';
import { UsersService } from '../services/users.service';

const usersService = new UsersService();

export class ProfileController {
  async getProfile(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const user = await usersService.getUserById(
        req.user!.userId,
        req.user?.userId,
        req.user?.role
      );

      res.json({
        success: true,
        data: user,
      });
    } catch (error: any) {
      next(error);
    }
  }

  async updateProfile(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const photoPath = req.file ? `/uploads/profiles/${req.file.filename}` : undefined;
      const user = await usersService.updateProfile(
        req.user!.userId,
        req.body,
        photoPath
      );

      res.json({
        success: true,
        data: user,
        message: 'Profile updated successfully',
      });
    } catch (error: any) {
      next(error);
    }
  }

  async uploadPhoto(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      if (!req.file) {
        throw new Error('No file uploaded');
      }

      const photoPath = `/uploads/profiles/${req.file.filename}`;
      const user = await usersService.updateProfile(
        req.user!.userId,
        {},
        photoPath
      );

      res.json({
        success: true,
        data: { profilePhoto: user.profilePhoto },
        message: 'Photo uploaded successfully',
      });
    } catch (error: any) {
      next(error);
    }
  }

  async deletePhoto(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      await usersService.deleteProfilePhoto(req.user!.userId);

      res.json({
        success: true,
        message: 'Photo deleted successfully',
      });
    } catch (error: any) {
      next(error);
    }
  }
}
