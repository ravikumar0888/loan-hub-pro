import prisma from '../config/database';
import { Prisma } from '@prisma/client';
import { ReportQuery } from '../types';

export class ReportsService {
  private buildWhere(query: ReportQuery, userId?: string, userRole?: string, organizationId?: string | null) {
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

    // Apply filters
    if (query.startDate || query.endDate) {
      where.applicationDate = {};
      if (query.startDate) {
        where.applicationDate.gte = new Date(query.startDate);
      }
      if (query.endDate) {
        where.applicationDate.lte = new Date(query.endDate);
      }
    }

    if (query.connectorId) {
      where.connectorId = query.connectorId;
    }

    if (query.dsaId) {
      where.dsaId = query.dsaId;
    }

    if (query.bankId) {
      where.bankId = query.bankId;
    }

    if (query.status) {
      where.status = query.status;
    }

    return where;
  }

  private reportInclude() {
    return {
      connector: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          userBankDetails: {
            include: {
              bank: true,
            },
          },
        },
      },
      bank: {
        select: {
          id: true,
          name: true,
        },
      },
      dsa: {
        select: {
          id: true,
          name: true,
          bankDetails: {
            include: {
              bank: true,
            },
          },
        },
      },
      leadOwnerUser: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
        },
      },
      creator: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
        },
      },
      remarks: {
        orderBy: { createdAt: 'desc' as const },
        take: 1,
      },
    };
  }

  private attachPayouts(customers: any[]) {
    return customers.map((customer) => {
      let connectorPayout = 0;
      let dsaPayout = 0;
      let tds = 0;
      let netPay = 0;
      let netRevenue = 0;

      if (customer.status === 'disbursed') {
        const loanAmount = Number(customer.loanAmount);
        const subvention = customer.subventionAmount ? Number(customer.subventionAmount) : 0;

        // Calculate Connector Payout
        const connectorBankDetail = customer.connector?.userBankDetails?.find(
          (bd) => bd.bankId === customer.bankId && bd.loanType === customer.loanType
        );

        if (connectorBankDetail) {
          // Connector Payout: (loanAmount × payoutRatio%) - subventionAmount
          connectorPayout = (loanAmount * Number(connectorBankDetail.payoutRatio)) / 100 - subvention;
        }

        // Calculate DSA Payout
        const dsaBankDetail = customer.dsa?.bankDetails?.find(
          (bd) => bd.bankId === customer.bankId && bd.loanType === customer.loanType
        );

        if (dsaBankDetail) {
          // DSA Payout: (loanAmount × payoutRatio%) - NO subvention deduction
          dsaPayout = (loanAmount * Number(dsaBankDetail.payoutRatio)) / 100;

          // TDS: 2% of DSA Payout
          tds = dsaPayout * 0.02;

          // NetPay: DSA Payout - TDS
          netPay = dsaPayout - tds;

          // Net Revenue: NetPay - Connector Payout
          netRevenue = netPay - connectorPayout;
        }
      }

      return {
        ...customer,
        connectorPayout,
        dsaPayout,
        tds,
        netPay,
        netRevenue,
        loanAmount: Number(customer.loanAmount),
        subventionAmount: customer.subventionAmount ? Number(customer.subventionAmount) : 0,
        leadOwnerName: customer.leadOwnerUser
          ? `${customer.leadOwnerUser.firstName} ${customer.leadOwnerUser.lastName}`
          : null,
        salesManagerName: customer.salesManager || null,
        createdByName: customer.creator
          ? `${customer.creator.firstName} ${customer.creator.lastName}`
          : null,
      };
    });
  }

  /**
   * page/limit are opt-in: if the caller doesn't pass them, this returns the
   * full matching set exactly as before (Reports.tsx currently does its own
   * client-side search/status filtering + pagination over the complete
   * result, so defaulting to a small server-side page here would silently
   * break that filtering). Pass both to get real skip/take pagination.
   */
  async generateReport(
    query: ReportQuery,
    userId?: string,
    userRole?: string,
    organizationId?: string | null,
    page?: number,
    limit?: number
  ) {
    const where = this.buildWhere(query, userId, userRole, organizationId);
    const shouldPaginate = page !== undefined && limit !== undefined;
    const cappedLimit = shouldPaginate ? Math.min(limit as number, 100) : undefined;
    const skip = shouldPaginate ? ((page as number) - 1) * (cappedLimit as number) : undefined;

    const [customers, total] = await Promise.all([
      prisma.customer.findMany({
        where,
        include: this.reportInclude(),
        orderBy: { applicationDate: 'desc' },
        ...(shouldPaginate ? { skip, take: cappedLimit } : {}),
      }),
      prisma.customer.count({ where }),
    ]);

    return {
      customers: this.attachPayouts(customers),
      pagination: shouldPaginate
        ? { page, limit: cappedLimit, total, totalPages: Math.ceil(total / (cappedLimit as number)) }
        : { page: 1, limit: total, total, totalPages: 1 },
    };
  }

  async generateReportForExport(
    query: ReportQuery,
    userId?: string,
    userRole?: string,
    organizationId?: string | null
  ) {
    const where = this.buildWhere(query, userId, userRole, organizationId);

    const customers = await prisma.customer.findMany({
      where,
      include: this.reportInclude(),
      orderBy: { applicationDate: 'desc' },
    });

    return this.attachPayouts(customers);
  }

  async getReportSummary(query: ReportQuery, userId?: string, userRole?: string, organizationId?: string | null) {
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

    // Apply filters
    if (query.startDate || query.endDate) {
      where.applicationDate = {};
      if (query.startDate) {
        where.applicationDate.gte = new Date(query.startDate);
      }
      if (query.endDate) {
        where.applicationDate.lte = new Date(query.endDate);
      }
    }

    if (query.connectorId) {
      where.connectorId = query.connectorId;
    }

    if (query.dsaId) {
      where.dsaId = query.dsaId;
    }

    if (query.bankId) {
      where.bankId = query.bankId;
    }

    if (query.status) {
      where.status = query.status;
    }

    const [totalApplications, totals, disbursedTotals] = await Promise.all([
      prisma.customer.count({ where }),
      prisma.customer.aggregate({
        where,
        _sum: {
          loanAmount: true,
        },
      }),
      prisma.customer.aggregate({
        where: {
          ...where,
          status: 'disbursed',
        },
        _sum: {
          loanAmount: true,
        },
      }),
    ]);

    return {
      totalApplications,
      totalLoanAmount: totals._sum.loanAmount || 0,
      disbursedAmount: disbursedTotals._sum.loanAmount || 0,
    };
  }

  exportToCSV(customers: any[]): string {
    const headers = [
      'Date',
      'Application Number',
      'Customer Name',
      'Mobile',
      'Loan Type',
      'Location',
      'Bank & NBFC Name',
      'DSA',
      'Connector',
      'Lead Owner',
      'Sales Manager',
      'Status',
      'Loan Amount',
      'DSA Payout',
      'TDS (2%)',
      'NetPay',
      'Subvention',
      'Connector Payout',
      'Net Revenue',
      'Remark',
      'Lead Created By',
    ];

    const rows = customers.map((customer) => {
      // Format date without timezone information
      const dateStr = customer.applicationDate
        ? new Date(customer.applicationDate).toLocaleDateString('en-GB', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
          })
        : '';

      return [
        dateStr,
        customer.applicationId || '',
        customer.name,
        customer.mobile,
        customer.loanType,
        customer.location || '',
        customer.bank?.name || '',
        customer.dsa?.name || '',
        customer.connector
          ? `${customer.connector.firstName} ${customer.connector.lastName}`
          : '',
        customer.leadOwnerName || '',
        customer.salesManagerName || '',
        customer.status,
        customer.loanAmount || 0,
        customer.dsaPayout?.toFixed(2) || '0.00',
        customer.tds?.toFixed(2) || '0.00',
        customer.netPay?.toFixed(2) || '0.00',
        customer.subventionAmount || 0,
        customer.connectorPayout?.toFixed(2) || '0.00',
        customer.netRevenue?.toFixed(2) || '0.00',
        customer.remarks?.[0]?.remark || '',
        customer.createdByName || '',
      ];
    });

    const csvContent = [headers, ...rows]
      .map((row) => row.map((cell) => `"${cell}"`).join(','))
      .join('\n');

    return csvContent;
  }
}
