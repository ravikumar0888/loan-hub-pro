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
    } else if (userRole === 'admin' && userId) {
      // Admin sees only customers where they are the lead owner
      where.leadOwner = userId;
    } else if (userRole === 'backoffice' && userId) {
      // Backoffice sees only customers they created
      where.createdBy = userId;
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

    // Single groupBy query replaces 7 separate count() calls
    const statusCounts = await prisma.customer.groupBy({
      by: ['status'],
      where,
      _count: { status: true },
    });

    const counts = Object.fromEntries(
      statusCounts.map((s) => [s.status, s._count.status])
    );

    const login    = counts['login']    ?? 0;
    const rejected = counts['rejected'] ?? 0;
    const approved = counts['approved'] ?? 0;
    const disbursed = counts['disbursed'] ?? 0;
    const hold     = counts['hold']     ?? 0;
    const relook   = counts['relook']   ?? 0;
    const drop     = counts['drop']     ?? 0;

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
    } else if (userRole === 'admin' && userId) {
      where.leadOwner = userId;
    } else if (userRole === 'backoffice' && userId) {
      where.createdBy = userId;
    }

    // Batch: get all 6 months of data in 2 queries instead of 12
    const sixMonthsAgo = startOfMonth(subMonths(new Date(), 5));
    const now = new Date();

    // Single query for all sales in date range
    const allCustomers = await prisma.customer.findMany({
      where: {
        ...where,
        applicationDate: { gte: sixMonthsAgo, lte: now },
      },
      select: {
        applicationDate: true,
        status: true,
      },
    });

    // Group by month in memory (much faster than 12 DB round-trips)
    const months = [];
    for (let i = 5; i >= 0; i--) {
      const date = subMonths(new Date(), i);
      const monthStart = startOfMonth(date);
      const monthEnd = new Date(monthStart);
      monthEnd.setMonth(monthEnd.getMonth() + 1);

      let sales = 0;
      let disbursed = 0;
      for (const c of allCustomers) {
        if (c.applicationDate && c.applicationDate >= monthStart && c.applicationDate < monthEnd) {
          sales++;
          if (c.status === 'disbursed') disbursed++;
        }
      }

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
    } else if (userRole === 'admin' && userId) {
      where.leadOwner = userId;
    } else if (userRole === 'backoffice' && userId) {
      where.createdBy = userId;
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

    // Role-based filtering
    if (userRole === 'connector' && userId) {
      where.connectorId = userId;
    } else if (userRole === 'admin' && userId) {
      where.leadOwner = userId;
    } else if (userRole === 'backoffice' && userId) {
      where.createdBy = userId;
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

    // Collect unique user IDs needed for back office and lead owner lookups
    const userIdsNeeded = new Set<string>();
    customers.forEach((customer) => {
      if (customer.createdBy) userIdsNeeded.add(customer.createdBy);
      if (customer.leadOwner) userIdsNeeded.add(customer.leadOwner);
    });

    // Single batch query for all needed users
    const allNeededUsers = userIdsNeeded.size > 0 ? await prisma.user.findMany({
      where: { id: { in: Array.from(userIdsNeeded) } },
      select: { id: true, firstName: true, lastName: true, role: true },
    }) : [];
    const userLookup = new Map(allNeededUsers.map(u => [u.id, u]));

    // Group by Back Office Users (createdBy)
    const backOfficeMap = new Map<string, { name: string; totalDisbursement: number; count: number }>();
    customers.forEach((customer) => {
      if (customer.createdBy) {
        const user = userLookup.get(customer.createdBy);
        if (user && user.role === 'backoffice') {
          const userName = `${user.firstName} ${user.lastName}`;
          const existing = backOfficeMap.get(user.id) || { name: userName, totalDisbursement: 0, count: 0 };
          existing.totalDisbursement += Number(customer.loanAmount);
          existing.count += 1;
          backOfficeMap.set(user.id, existing);
        }
      }
    });
    const topBackOffice = Array.from(backOfficeMap.values())
      .sort((a, b) => b.totalDisbursement - a.totalDisbursement);

    // Group by Lead Owners
    const leadOwnerMap = new Map<string, { name: string; totalDisbursement: number; count: number }>();
    customers.forEach((customer) => {
      if (customer.leadOwner) {
        const user = userLookup.get(customer.leadOwner);
        if (user) {
          const leadOwnerName = `${user.firstName} ${user.lastName}`;
          const existing = leadOwnerMap.get(user.id) || { name: leadOwnerName, totalDisbursement: 0, count: 0 };
          existing.totalDisbursement += Number(customer.loanAmount);
          existing.count += 1;
          leadOwnerMap.set(user.id, existing);
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
