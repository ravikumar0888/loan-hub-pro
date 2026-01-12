import prisma from '../config/database';
import { format, subMonths, startOfMonth } from 'date-fns';

export class DashboardService {
  async getKPIs(startDate?: string, endDate?: string, userId?: string, userRole?: string, organizationId?: string | null) {
    const where: any = {};

    // Multi-tenant filtering
    if (userRole !== 'master_admin' && organizationId) {
      where.organizationId = organizationId;
    }

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

  async getTrendData(userId?: string, userRole?: string, organizationId?: string | null) {
    const where: any = {};

    // Multi-tenant filtering
    if (userRole !== 'master_admin' && organizationId) {
      where.organizationId = organizationId;
    }

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

  async getRecentCustomers(limit: number = 10, userId?: string, userRole?: string, organizationId?: string | null) {
    const where: any = {};

    // Multi-tenant filtering
    if (userRole !== 'master_admin' && organizationId) {
      where.organizationId = organizationId;
    }

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

  async getTopPerformers(month: number, year: number, userId?: string, userRole?: string, organizationId?: string | null) {
    const where: any = {
      status: 'disbursed', // Only count disbursed loans
    };

    // Multi-tenant filtering
    if (userRole !== 'master_admin' && organizationId) {
      where.organizationId = organizationId;
    }

    // Filter by specified month and year
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0, 23, 59, 59, 999);
    where.applicationDate = {
      gte: startDate,
      lte: endDate,
    };

    // Get all disbursed customers for the month
    const customers = await prisma.customer.findMany({
      where,
      include: {
        connector: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
        dsa: {
          select: {
            id: true,
            name: true,
          },
        },
        bank: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    // Group by Connectors
    const connectorMap = new Map<string, { name: string; totalDisbursement: number; count: number }>();
    customers.forEach((customer) => {
      if (customer.connector) {
        const connectorId = customer.connector.id;
        const connectorName = `${customer.connector.firstName} ${customer.connector.lastName}`;
        const existing = connectorMap.get(connectorId) || { name: connectorName, totalDisbursement: 0, count: 0 };
        existing.totalDisbursement += Number(customer.loanAmount);
        existing.count += 1;
        connectorMap.set(connectorId, existing);
      }
    });
    const topConnectors = Array.from(connectorMap.values())
      .sort((a, b) => b.totalDisbursement - a.totalDisbursement);

    // Group by DSAs
    const dsaMap = new Map<string, { name: string; totalDisbursement: number; count: number }>();
    customers.forEach((customer) => {
      if (customer.dsa) {
        const dsaId = customer.dsa.id;
        const dsaName = customer.dsa.name;
        const existing = dsaMap.get(dsaId) || { name: dsaName, totalDisbursement: 0, count: 0 };
        existing.totalDisbursement += Number(customer.loanAmount);
        existing.count += 1;
        dsaMap.set(dsaId, existing);
      }
    });
    const topDSAs = Array.from(dsaMap.values())
      .sort((a, b) => b.totalDisbursement - a.totalDisbursement);

    // Group by Banks
    const bankMap = new Map<string, { name: string; totalDisbursement: number; count: number }>();
    customers.forEach((customer) => {
      if (customer.bank) {
        const bankId = customer.bank.id;
        const bankName = customer.bank.name;
        const existing = bankMap.get(bankId) || { name: bankName, totalDisbursement: 0, count: 0 };
        existing.totalDisbursement += Number(customer.loanAmount);
        existing.count += 1;
        bankMap.set(bankId, existing);
      }
    });
    const topBanks = Array.from(bankMap.values())
      .sort((a, b) => b.totalDisbursement - a.totalDisbursement);

    // Group by Loan Types
    const loanTypeMap = new Map<string, { name: string; totalDisbursement: number; count: number }>();
    customers.forEach((customer) => {
      const loanType = customer.loanType;
      const loanTypeName = loanType === 'PL' ? 'Personal Loan' : loanType === 'HL' ? 'Home Loan' : 'Business Loan';
      const existing = loanTypeMap.get(loanType) || { name: loanTypeName, totalDisbursement: 0, count: 0 };
      existing.totalDisbursement += Number(customer.loanAmount);
      existing.count += 1;
      loanTypeMap.set(loanType, existing);
    });
    const topLoanTypes = Array.from(loanTypeMap.values())
      .sort((a, b) => b.totalDisbursement - a.totalDisbursement);

    // Group by Back Office Users (createdBy)
    const backOfficeMap = new Map<string, { name: string; totalDisbursement: number; count: number }>();
    const backOfficeUsers = await prisma.user.findMany({
      where: {
        role: 'backoffice',
        ...(userRole !== 'master_admin' && organizationId ? { organizationId } : {}),
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
      },
    });
    const backOfficeUserIds = backOfficeUsers.map(u => u.id);

    customers.forEach((customer) => {
      if (customer.createdBy && backOfficeUserIds.includes(customer.createdBy)) {
        const user = backOfficeUsers.find(u => u.id === customer.createdBy);
        if (user) {
          const userId = user.id;
          const userName = `${user.firstName} ${user.lastName}`;
          const existing = backOfficeMap.get(userId) || { name: userName, totalDisbursement: 0, count: 0 };
          existing.totalDisbursement += Number(customer.loanAmount);
          existing.count += 1;
          backOfficeMap.set(userId, existing);
        }
      }
    });
    const topBackOffice = Array.from(backOfficeMap.values())
      .sort((a, b) => b.totalDisbursement - a.totalDisbursement);

    // Group by Lead Owners
    const leadOwnerMap = new Map<string, { name: string; totalDisbursement: number; count: number }>();
    const leadOwnerUsers = await prisma.user.findMany({
      where: {
        ...(userRole !== 'master_admin' && organizationId ? { organizationId } : {}),
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
      },
    });

    customers.forEach((customer) => {
      if (customer.leadOwner) {
        const user = leadOwnerUsers.find(u => u.id === customer.leadOwner);
        if (user) {
          const leadOwnerId = user.id;
          const leadOwnerName = `${user.firstName} ${user.lastName}`;
          const existing = leadOwnerMap.get(leadOwnerId) || { name: leadOwnerName, totalDisbursement: 0, count: 0 };
          existing.totalDisbursement += Number(customer.loanAmount);
          existing.count += 1;
          leadOwnerMap.set(leadOwnerId, existing);
        }
      }
    });
    const topLeadOwners = Array.from(leadOwnerMap.values())
      .sort((a, b) => b.totalDisbursement - a.totalDisbursement);

    return {
      topConnectors,
      topDSAs,
      topBanks,
      topLoanTypes,
      topBackOffice,
      topLeadOwners,
    };
  }
}
