import { Response, NextFunction } from 'express';
import { AuthRequest } from '../types';
import { DashboardService } from '../services/dashboard.service';

const dashboardService = new DashboardService();

export class DashboardController {
  async getKPIs(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { startDate, endDate } = req.query;
      const kpis = await dashboardService.getKPIs(
        startDate as string,
        endDate as string,
        req.user?.userId,
        req.user?.role,
        req.organizationId
      );

      res.json({
        success: true,
        data: kpis,
      });
    } catch (error: any) {
      next(error);
    }
  }

  async getTrendData(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const trends = await dashboardService.getTrendData(
        req.user?.userId,
        req.user?.role,
        req.organizationId
      );

      res.json({
        success: true,
        data: trends,
      });
    } catch (error: any) {
      next(error);
    }
  }

  async getRecentCustomers(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 10;
      const customers = await dashboardService.getRecentCustomers(
        limit,
        req.user?.userId,
        req.user?.role,
        req.organizationId
      );

      res.json({
        success: true,
        data: customers,
      });
    } catch (error: any) {
      next(error);
    }
  }

  async getTopPerformers(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { month, year } = req.query;
      const currentMonth = month ? parseInt(month as string) : new Date().getMonth() + 1;
      const currentYear = year ? parseInt(year as string) : new Date().getFullYear();

      const topPerformers = await dashboardService.getTopPerformers(
        currentMonth,
        currentYear,
        req.user?.userId,
        req.user?.role,
        req.organizationId
      );

      res.json({
        success: true,
        data: topPerformers,
      });
    } catch (error: any) {
      next(error);
    }
  }
}
