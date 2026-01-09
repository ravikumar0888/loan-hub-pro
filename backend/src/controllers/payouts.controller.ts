import { Response, NextFunction } from 'express';
import { AuthRequest } from '../types';
import { PayoutsService } from '../services/payouts.service';

const payoutsService = new PayoutsService();

export class PayoutsController {
  /**
   * Add ledger entry (debit or credit)
   */
  async addLedgerEntry(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { connectorId, customerId, entryType, amount, description, month, year } = req.body;

      const entry = await payoutsService.addLedgerEntry(
        { connectorId, customerId, entryType, amount, description, month, year, createdBy: req.user?.userId },
        req.user?.userId,
        req.user?.role
      );

      res.json({
        success: true,
        data: entry,
        message: 'Ledger entry added successfully',
      });
    } catch (error: any) {
      next(error);
    }
  }

  /**
   * Get monthly payout for a connector
   */
  async getMonthlyPayout(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { connectorId, month, year } = req.query;

      if (!connectorId || !month || !year) {
        return res.status(400).json({
          success: false,
          error: 'connectorId, month, and year are required',
        });
      }

      const summary = await payoutsService.getMonthlyPayout(
        connectorId as string,
        parseInt(month as string),
        parseInt(year as string),
        req.user?.userId,
        req.user?.role
      );

      res.json({
        success: true,
        data: summary,
      });
    } catch (error: any) {
      next(error);
    }
  }

  /**
   * Get connector balance
   */
  async getConnectorBalance(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { connectorId } = req.params;

      const balance = await payoutsService.getConnectorBalance(
        connectorId,
        req.user?.userId,
        req.user?.role
      );

      res.json({
        success: true,
        data: balance,
      });
    } catch (error: any) {
      next(error);
    }
  }

  /**
   * Get all connector balances
   */
  async getAllConnectorBalances(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const balances = await payoutsService.getAllConnectorBalances(
        req.user?.userId,
        req.user?.role
      );

      res.json({
        success: true,
        data: balances,
      });
    } catch (error: any) {
      next(error);
    }
  }

  /**
   * Get ledger entries with filters
   */
  async getLedgerEntries(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { connectorId, month, year, entryType } = req.query;

      const filters: any = {};
      if (connectorId) filters.connectorId = connectorId as string;
      if (month) filters.month = parseInt(month as string);
      if (year) filters.year = parseInt(year as string);
      if (entryType) filters.entryType = entryType as 'debit' | 'credit';

      const entries = await payoutsService.getLedgerEntries(
        filters,
        req.user?.userId,
        req.user?.role
      );

      res.json({
        success: true,
        data: entries,
      });
    } catch (error: any) {
      next(error);
    }
  }

  /**
   * Get monthly payouts by connector (accordion data)
   */
  async getMonthlyPayoutsByConnector(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { connectorId } = req.params;

      const monthlyData = await payoutsService.getMonthlyPayoutsByConnector(
        connectorId,
        req.user?.userId,
        req.user?.role
      );

      res.json({
        success: true,
        data: monthlyData,
      });
    } catch (error: any) {
      next(error);
    }
  }

  /**
   * Delete ledger entry
   */
  async deleteLedgerEntry(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;

      const result = await payoutsService.deleteLedgerEntry(
        id,
        req.user?.userId,
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

  /**
   * Generate monthly payout PDF
   */
  async generatePayoutPDF(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { connectorId, month, year } = req.body;

      if (!connectorId || !month || !year) {
        return res.status(400).json({
          success: false,
          error: 'connectorId, month, and year are required',
        });
      }

      const result = await payoutsService.generateMonthlyPayoutPDF(
        connectorId,
        parseInt(month),
        parseInt(year),
        req.user?.userId,
        req.user?.role
      );

      res.json({
        success: true,
        data: { pdfUrl: result.pdfUrl },
        message: 'PDF generated successfully',
      });
    } catch (error: any) {
      next(error);
    }
  }
}
