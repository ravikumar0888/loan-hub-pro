import prisma from '../config/database';
import { format, subMonths, startOfMonth } from 'date-fns';

export class DashboardService {
  async getKPIs(startDate?: string, endDate?: string, userId?: string, userRole?: string) {
    const where: any = {};

    // Role-based filtering
    if (userRole === 'connector') {
      where.connectorId = userId;
    }

    // Date filtering
    if (startDate || endDate) {
      where.applicationDate = {};
      if (startDate) {
        where.applicationDate.gte = new Date(startDate);
      }
      if (endDate) {
        where.applicationDate.lte = new Date(endDate);
      }
    }

    const [
      login,
      rejected,
      approved,
      disbursed,
      hold,
      relook,
      drop,
    ] = await Promise.all([
      prisma.customer.count({ where: { ...where, status: 'login' } }),
      prisma.customer.count({ where: { ...where, status: 'rejected' } }),
      prisma.customer.count({ where: { ...where, status: 'approved' } }),
      prisma.customer.count({ where: { ...where, status: 'disbursed' } }),
      prisma.customer.count({ where: { ...where, status: 'hold' } }),
      prisma.customer.count({ where: { ...where, status: 'relook' } }),
      prisma.customer.count({ where: { ...where, status: 'drop' } }),
    ]);

    return {
      login,
      rejected,
      approved,
      disbursed,
      hold,
      relook,
      drop,
    };
  }

  async getTrendData(userId?: string, userRole?: string) {
    const where: any = {};

    // Role-based filtering
    if (userRole === 'connector') {
      where.connectorId = userId;
    }

    // Get data for last 6 months
    const months = [];
    for (let i = 5; i >= 0; i--) {
      const date = subMonths(new Date(), i);
      const monthStart = startOfMonth(date);
      const monthEnd = new Date(monthStart);
      monthEnd.setMonth(monthEnd.getMonth() + 1);

      const [sales, disbursed] = await Promise.all([
        prisma.customer.count({
          where: {
            ...where,
            applicationDate: {
              gte: monthStart,
              lt: monthEnd,
            },
          },
        }),
        prisma.customer.count({
          where: {
            ...where,
            status: 'disbursed',
            applicationDate: {
              gte: monthStart,
              lt: monthEnd,
            },
          },
        }),
      ]);

      months.push({
        month: format(date, 'MMM'),
        sales,
        disbursed,
      });
    }

    return months;
  }

  async getRecentCustomers(limit: number = 10, userId?: string, userRole?: string) {
    const where: any = {};

    // Role-based filtering
    if (userRole === 'connector') {
      where.connectorId = userId;
    }

    const customers = await prisma.customer.findMany({
      where,
      include: {
        connector: {
          select: {
            firstName: true,
            lastName: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });

    return customers;
  }
}
