import { Response, NextFunction } from 'express';
import { AuthRequest } from '../types';
import { DsasService } from '../services/dsas.service';

const dsasService = new DsasService();

export class DsasController {
  async getDsas(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const result = await dsasService.getDsas(req.query, req.user?.role, req.organizationId);

      res.json({
        success: true,
        ...result,
      });
    } catch (error: any) {
      next(error);
    }
  }

  async getDsaById(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const dsa = await dsasService.getDsaById(id, req.user?.role, req.organizationId);

      res.json({
        success: true,
        data: dsa,
      });
    } catch (error: any) {
      next(error);
    }
  }

  async createDsa(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const dsa = await dsasService.createDsa({
        ...req.body,
        organizationId: req.organizationId,
      });

      res.status(201).json({
        success: true,
        data: dsa,
        message: 'DSA created successfully',
      });
    } catch (error: any) {
      next(error);
    }
  }

  async updateDsa(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const dsa = await dsasService.updateDsa(
        id,
        req.body,
        req.user?.role,
        req.organizationId
      );

      res.json({
        success: true,
        data: dsa,
        message: 'DSA updated successfully',
      });
    } catch (error: any) {
      next(error);
    }
  }

  async deleteDsa(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const result = await dsasService.deleteDsa(
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

  async getAllDsas(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const dsas = await dsasService.getAllDsas(req.user?.role, req.organizationId);

      res.json({
        success: true,
        data: dsas,
      });
    } catch (error: any) {
      next(error);
    }
  }
}
