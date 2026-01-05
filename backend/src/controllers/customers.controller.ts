import { Response, NextFunction } from 'express';
import { AuthRequest } from '../types';
import { CustomersService } from '../services/customers.service';

const customersService = new CustomersService();

export class CustomersController {
  async getCustomers(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const result = await customersService.getCustomers(
        req.query,
        req.user?.userId,
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

  async getCustomerById(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const customer = await customersService.getCustomerById(
        id,
        req.user?.userId,
        req.user?.role
      );

      res.json({
        success: true,
        data: customer,
      });
    } catch (error: any) {
      next(error);
    }
  }

  async createCustomer(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const data = {
        ...req.body,
        createdBy: req.user?.userId,
      };
      const customer = await customersService.createCustomer(data);

      res.status(201).json({
        success: true,
        data: customer,
        message: 'Customer created successfully',
      });
    } catch (error: any) {
      next(error);
    }
  }

  async updateCustomer(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const customer = await customersService.updateCustomer(
        id,
        req.body,
        req.user?.userId,
        req.user?.role
      );

      res.json({
        success: true,
        data: customer,
        message: 'Customer updated successfully',
      });
    } catch (error: any) {
      next(error);
    }
  }

  async deleteCustomer(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const result = await customersService.deleteCustomer(id);

      res.json({
        success: true,
        message: result.message,
      });
    } catch (error: any) {
      next(error);
    }
  }

  async addRemark(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const { remark } = req.body;
      const createdBy = req.user?.userId || '';

      const newRemark = await customersService.addRemark(id, remark, createdBy);

      res.status(201).json({
        success: true,
        data: newRemark,
        message: 'Remark added successfully',
      });
    } catch (error: any) {
      next(error);
    }
  }

  async getCustomerRemarks(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const remarks = await customersService.getCustomerRemarks(id);

      res.json({
        success: true,
        data: remarks,
      });
    } catch (error: any) {
      next(error);
    }
  }
}
