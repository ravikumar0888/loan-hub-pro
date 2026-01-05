import prisma from '../config/database';
import { Prisma } from '@prisma/client';
import { ReportQuery } from '../types';

export class ReportsService {
  async generateReport(query: ReportQuery, userId?: string, userRole?: string) {
    const where: any = {};

    // Role-based filtering
    if (userRole === 'connector') {
      where.connectorId = userId;
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
          },
        },
        remarks: {
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
      },
      orderBy: { applicationDate: 'desc' },
    });

    return customers;
  }

  async getReportSummary(query: ReportQuery, userId?: string, userRole?: string) {
    const where: any = {};

    // Role-based filtering
    if (userRole === 'connector') {
      where.connectorId = userId;
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
      'Customer Name',
      'Mobile',
      'Email',
      'Loan Type',
      'Loan Amount',
      'Connector',
      'Lead Owner',
      'Sales Manager',
      'Status',
      'Latest Remark',
    ];

    const rows = customers.map((customer) => [
      customer.applicationDate,
      customer.name,
      customer.mobile,
      customer.email || '',
      customer.loanType,
      customer.loanAmount,
      customer.connector
        ? `${customer.connector.firstName} ${customer.connector.lastName}`
        : '',
      customer.leadOwner || '',
      customer.salesManager || '',
      customer.status,
      customer.remarks && customer.remarks.length > 0
        ? customer.remarks[0].remark
        : '',
    ]);

    const csvContent = [headers, ...rows]
      .map((row) => row.map((cell) => `"${cell}"`).join(','))
      .join('\n');

    return csvContent;
  }
}
