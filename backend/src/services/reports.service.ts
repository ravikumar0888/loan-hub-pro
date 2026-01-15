import prisma from '../config/database';
import { Prisma } from '@prisma/client';
import { ReportQuery } from '../types';

export class ReportsService {
  async generateReport(query: ReportQuery, userId?: string, userRole?: string, organizationId?: string | null) {
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

    // Note: DSA filtering would require additional schema modifications
    // For now, we'll focus on connector-based filtering

    const customers = await prisma.customer.findMany({
      where,
      include: {
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
        remarks: {
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
      },
      orderBy: { applicationDate: 'desc' },
    });

    // Calculate payout for each customer
    const customersWithPayout = customers.map((customer) => {
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
      };
    });

    return customersWithPayout;
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
      ];
    });

    const csvContent = [headers, ...rows]
      .map((row) => row.map((cell) => `"${cell}"`).join(','))
      .join('\n');

    return csvContent;
  }
}
