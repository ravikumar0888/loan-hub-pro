import { Response, NextFunction } from 'express';
import { AuthRequest } from '../types';
import { ReportsService } from '../services/reports.service';

const reportsService = new ReportsService();

export class ReportsController {
  async generateReport(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const customers = await reportsService.generateReport(
        req.query,
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

  async getReportSummary(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const summary = await reportsService.getReportSummary(
        req.query,
        req.user?.userId,
        req.user?.role,
        req.organizationId
      );

      res.json({
        success: true,
        data: summary,
      });
    } catch (error: any) {
      next(error);
    }
  }

  async exportReport(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const customers = await reportsService.generateReport(
        req.query,
        req.user?.userId,
        req.user?.role,
        req.organizationId
      );

      const csv = reportsService.exportToCSV(customers);

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename=loan-report.csv');
      res.send(csv);
    } catch (error: any) {
      next(error);
    }
  }
}
