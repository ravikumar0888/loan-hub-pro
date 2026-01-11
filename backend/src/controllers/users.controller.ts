import { Response, NextFunction } from 'express';
import { AuthRequest } from '../types';
import { UsersService } from '../services/users.service';

const usersService = new UsersService();

export class UsersController {
  async getUsers(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const result = await usersService.getUsers(
        req.query,
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
      const user = await usersService.createUser(req.body, req.organizationId);

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
}
