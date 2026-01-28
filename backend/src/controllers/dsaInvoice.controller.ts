import { Request, Response, NextFunction } from 'express';
import { dsaInvoiceService } from '../services/dsaInvoice.service';
import { AuthRequest } from '../types';

export class DsaInvoiceController {
  /**
   * Generate a new DSA invoice
   * POST /api/dsa-invoices
   */
  async generateInvoice(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { dsaId, month, year } = req.body;

      // Validate required fields
      if (!dsaId || !month || !year) {
        res.status(400).json({
          success: false,
          error: 'DSA ID, month, and year are required',
        });
        return;
      }

      // Only Admin and SuperAdmin can generate invoices
      if (req.user?.role !== 'admin' && req.user?.role !== 'superadmin') {
        res.status(403).json({
          success: false,
          error: 'Only administrators can generate invoices',
        });
        return;
      }

      const invoice = await dsaInvoiceService.generateDsaInvoice(
        dsaId,
        parseInt(month),
        parseInt(year),
        req.user.userId
      );

      res.status(201).json({
        success: true,
        data: invoice,
        message: 'Invoice generated successfully',
      });
    } catch (error: any) {
      next(error);
    }
  }

  /**
   * Get all invoices with optional filters
   * GET /api/dsa-invoices
   */
  async getInvoices(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { dsaId, month, year, status } = req.query;

      if (!req.user) {
        res.status(401).json({ success: false, error: 'Unauthorized' });
        return;
      }

      const invoices = await dsaInvoiceService.getInvoices(
        {
          dsaId: dsaId as string | undefined,
          month: month as string | undefined,
          year: year as string | undefined,
          status: status as string | undefined,
        },
        req.user.userId,
        req.user.role,
        req.organizationId
      );

      res.json({
        success: true,
        data: invoices,
      });
    } catch (error: any) {
      next(error);
    }
  }

  /**
   * Get a single invoice by ID
   * GET /api/dsa-invoices/:id
   */
  async getInvoiceById(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;

      if (!req.user) {
        res.status(401).json({ success: false, error: 'Unauthorized' });
        return;
      }

      const invoice = await dsaInvoiceService.getInvoiceById(
        id,
        req.user.userId,
        req.user.role,
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

  /**
   * Delete an invoice
   * DELETE /api/dsa-invoices/:id
   */
  async deleteInvoice(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;

      if (!req.user) {
        res.status(401).json({ success: false, error: 'Unauthorized' });
        return;
      }

      // Only Admin and SuperAdmin can delete invoices
      if (req.user.role !== 'admin' && req.user.role !== 'superadmin') {
        res.status(403).json({
          success: false,
          error: 'Only administrators can delete invoices',
        });
        return;
      }

      const result = await dsaInvoiceService.deleteInvoice(
        id,
        req.user.userId,
        req.user.role,
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
}

export const dsaInvoiceController = new DsaInvoiceController();
