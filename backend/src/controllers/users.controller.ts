import { Response, NextFunction } from 'express';
import { AuthRequest } from '../types';
import { UsersService } from '../services/users.service';

const usersService = new UsersService();

export class UsersController {
  async getUsers(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const result = await usersService.getUsers(
        req.query,
        req.user?.userId,
        req.user?.role,
        req.organizationId
      );

      res.json({
        success: true,
        ...result,
      });
    } catch (error: any) {
      next(error);
    }
  }

  async getUserById(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const user = await usersService.getUserById(
        id,
        req.user?.role,
        req.organizationId
      );

      res.json({
        success: true,
        data: user,
      });
    } catch (error: any) {
      next(error);
    }
  }

  async createUser(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const user = await usersService.createUser(
        req.body,
        req.user?.userId,
        req.user?.role,
        req.organizationId
      );

      res.status(201).json({
        success: true,
        data: user,
        message: 'User created successfully',
      });
    } catch (error: any) {
      next(error);
    }
  }

  async updateUser(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const user = await usersService.updateUser(
        id,
        req.body,
        req.user?.role,
        req.organizationId
      );

      res.json({
        success: true,
        data: user,
        message: 'User updated successfully',
      });
    } catch (error: any) {
      next(error);
    }
  }

  async deleteUser(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const result = await usersService.deleteUser(
        id,
        req.user?.role,
        req.organizationId
      );

      res.json({
        success: true,
        message: result.message,
      });
    } catch (error: any) {
      next(error);
    }
  }

  async getConnectors(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const connectors = await usersService.getConnectors(
        req.user?.userId,
        req.user?.role,
        req.organizationId
      );

      res.json({
        success: true,
        data: connectors,
      });
    } catch (error: any) {
      next(error);
    }
  }

  async getAdmins(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const admins = await usersService.getAdmins(
        req.user?.role,
        req.organizationId
      );

      res.json({
        success: true,
        data: admins,
      });
    } catch (error: any) {
      next(error);
    }
  }

  async getUserLimitsStatus(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      if (!req.organizationId) {
        res.status(400).json({
          success: false,
          message: 'Organization context required',
        });
        return;
      }

      const limitsStatus = await usersService.getUserLimitsStatus(req.organizationId);

      res.json({
        success: true,
        data: limitsStatus,
      });
    } catch (error: any) {
      next(error);
    }
  }
}
