import { Response, NextFunction } from 'express';
import { AuthRequest } from '../types';
import { OrganizationsService } from '../services/organizations.service';

const organizationsService = new OrganizationsService();

export class OrganizationsController {
  async getOrganizations(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const result = await organizationsService.getOrganizations(
        req.query,
        req.user?.role
      );

      res.json({
        success: true,
        ...result,
      });
    } catch (error: any) {
      next(error);
    }
  }

  async getOrganizationById(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const organization = await organizationsService.getOrganizationById(
        id,
        req.user?.role,
        req.organizationId
      );

      res.json({
        success: true,
        data: organization,
      });
    } catch (error: any) {
      next(error);
    }
  }

  async createOrganization(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const organization = await organizationsService.createOrganization(req.body);

      res.status(201).json({
        success: true,
        data: organization,
        message: 'Organization created successfully. Trial period: 14 days.',
      });
    } catch (error: any) {
      next(error);
    }
  }

  async updateOrganization(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const organization = await organizationsService.updateOrganization(
        id,
        req.body,
        req.user?.role,
        req.organizationId
      );

      res.json({
        success: true,
        data: organization,
        message: 'Organization updated successfully',
      });
    } catch (error: any) {
      next(error);
    }
  }

  async deleteOrganization(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const result = await organizationsService.deleteOrganization(
        id,
        req.user?.role
      );

      res.json({
        success: true,
        message: result.message,
      });
    } catch (error: any) {
      next(error);
    }
  }

  async getOrganizationStats(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const stats = await organizationsService.getOrganizationStats(
        id,
        req.user?.role,
        req.organizationId
      );

      res.json({
        success: true,
        data: stats,
      });
    } catch (error: any) {
      next(error);
    }
  }
}
