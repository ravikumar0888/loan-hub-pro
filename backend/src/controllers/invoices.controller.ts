import { Response, NextFunction } from 'express';
import { AuthRequest } from '../types';
import { InvoicesService } from '../services/invoices.service';

const invoicesService = new InvoicesService();

export class InvoicesController {
  async getInvoices(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const result = await invoicesService.getInvoices(
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

  async getInvoiceById(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const invoice = await invoicesService.getInvoiceById(
        id,
        req.user?.role,
        req.organizationId
      );

      res.json({
        success: true,
        data: invoice,
      });
    } catch (error: any) {
      next(error);
    }
  }

  async createInvoice(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const invoice = await invoicesService.createInvoice(
        req.body,
        req.user?.role
      );

      res.status(201).json({
        success: true,
        data: invoice,
        message: 'Invoice created successfully',
      });
    } catch (error: any) {
      next(error);
    }
  }

  async updateInvoiceStatus(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const { status } = req.body;
      const invoice = await invoicesService.updateInvoiceStatus(
        id,
        status,
        req.user?.role
      );

      res.json({
        success: true,
        data: invoice,
        message: 'Invoice status updated successfully',
      });
    } catch (error: any) {
      next(error);
    }
  }

  async getBillingAnalytics(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const analytics = await invoicesService.getBillingAnalytics(req.user?.role);

      res.json({
        success: true,
        data: analytics,
      });
    } catch (error: any) {
      next(error);
    }
  }
}
