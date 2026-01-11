import { Response, NextFunction } from 'express';
import { AuthRequest } from '../types';
import { BanksService } from '../services/banks.service';

const banksService = new BanksService();

export class BanksController {
  async getBanks(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const result = await banksService.getBanks(req.query, req.user?.role, req.organizationId);

      res.json({
        success: true,
        ...result,
      });
    } catch (error: any) {
      next(error);
    }
  }

  async getBankById(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const bank = await banksService.getBankById(id, req.user?.role, req.organizationId);

      res.json({
        success: true,
        data: bank,
      });
    } catch (error: any) {
      next(error);
    }
  }

  async createBank(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const bank = await banksService.createBank({
        ...req.body,
        organizationId: req.organizationId,
      });

      res.status(201).json({
        success: true,
        data: bank,
        message: 'Bank created successfully',
      });
    } catch (error: any) {
      next(error);
    }
  }

  async updateBank(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const bank = await banksService.updateBank(id, req.body, req.user?.role, req.organizationId);

      res.json({
        success: true,
        data: bank,
        message: 'Bank updated successfully',
      });
    } catch (error: any) {
      next(error);
    }
  }

  async deleteBank(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const result = await banksService.deleteBank(id, req.user?.role, req.organizationId);

      res.json({
        success: true,
        message: result.message,
      });
    } catch (error: any) {
      next(error);
    }
  }

  async getAllBanks(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const banks = await banksService.getAllBanks(req.user?.role, req.organizationId);

      res.json({
        success: true,
        data: banks,
      });
    } catch (error: any) {
      next(error);
    }
  }
}
