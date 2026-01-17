import prisma from '../config/database';
import { Prisma } from '@prisma/client';
import { PayoutPDFGenerator } from '../utils/payoutPdfGenerator';

interface PayoutLedgerEntry {
  connectorId: string;
  customerId?: string;
  entryType: 'debit' | 'credit';
  amount: number;
  description: string;
  month: number;
  year: number;
  createdBy?: string;
}

interface MonthlyPayoutSummary {
  connectorId: string;
  connectorName: string;
  month: number;
  year: number;
  totalEarned: number; // Sum of credits
  totalAdvance: number; // Sum of debits
  netPayout: number; // credits - debits
  balance: number; // Running balance from ledger
}

interface ConnectorBalance {
  connectorId: string;
  connectorName: string;
  totalEarned: number;
  totalAdvance: number;
  currentBalance: number;
}

export class PayoutsService {
  /**
   * Add a ledger entry (debit or credit)
   */
  async addLedgerEntry(data: PayoutLedgerEntry, userId?: string, userRole?: string, organizationId?: string | null) {
    // Validate connector exists and is active
    const connector = await prisma.user.findFirst({
      where: {
        id: data.connectorId,
        role: 'connector',
        isActive: true,
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        organizationId: true,
        createdBy: true,
      },
    });

    if (!connector) {
      throw new Error('Connector not found or inactive');
    }

    // Multi-tenant check: ensure connector belongs to user's organization
    if (userRole !== 'master_admin' && organizationId && connector.organizationId !== organizationId) {
      throw new Error('Forbidden - Connector not found in your organization');
    }

    // Role-based authorization
    if (userRole === 'admin') {
      // Admin can only add entries for their created connectors
      if (connector.createdBy !== userId) {
        throw new Error('Forbidden - You can only manage your own connectors');
      }
    } else if (userRole === 'connector') {
      throw new Error('Forbidden - Connectors cannot add ledger entries');
    }

    // Create ledger entry
    const entry = await prisma.payoutLedger.create({
      data: {
        connectorId: data.connectorId,
        customerId: data.customerId,
        entry_type: data.entryType,
        amount: new Prisma.Decimal(data.amount),
        description: data.description,
        month: data.month,
        year: data.year,
        createdBy: data.createdBy,
      },
      include: {
        connector: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    });

    return entry;
  }

  /**
   * Get monthly payout summary for a connector
   */
  async getMonthlyPayout(
    connectorId: string,
    month: number,
    year: number,
    userId?: string,
    userRole?: string,
    organizationId?: string | null
  ): Promise<MonthlyPayoutSummary> {
    // Role-based filtering
    const connector = await prisma.user.findFirst({
      where: { id: connectorId, role: 'connector' },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        organizationId: true,
        createdBy: true,
      },
    });

    if (!connector) {
      throw new Error('Connector not found');
    }

    // Multi-tenant check: ensure connector belongs to user's organization
    if (userRole !== 'master_admin' && organizationId && connector.organizationId !== organizationId) {
      throw new Error('Forbidden - Connector not found in your organization');
    }

    // Authorization check
    if (userRole === 'admin' && connector.createdBy !== userId) {
      throw new Error('Forbidden - You can only view your own connectors');
    } else if (userRole === 'connector' && connectorId !== userId) {
      throw new Error('Forbidden - You can only view your own payout');
    }

    // Get ledger entries for the month
    const entries = await prisma.payoutLedger.findMany({
      where: {
        connectorId,
        month,
        year,
      },
    });

    const totalEarned = entries
      .filter((e) => e.entry_type === 'credit')
      .reduce((sum, e) => sum + Number(e.amount), 0);

    const totalAdvance = entries
      .filter((e) => e.entry_type === 'debit')
      .reduce((sum, e) => sum + Number(e.amount), 0);

    const netPayout = totalEarned - totalAdvance;

    // Calculate running balance up to this month
    const allEntries = await prisma.payoutLedger.findMany({
      where: {
        connectorId,
        OR: [
          { year: { lt: year } },
          { year, month: { lte: month } },
        ],
      },
    });

    const balance = allEntries.reduce((sum, e) => {
      return e.entry_type === 'credit'
        ? sum + Number(e.amount)
        : sum - Number(e.amount);
    }, 0);

    return {
      connectorId,
      connectorName: `${connector.firstName} ${connector.lastName}`,
      month,
      year,
      totalEarned,
      totalAdvance,
      netPayout,
      balance,
    };
  }

  /**
   * Get connector's overall balance
   */
  async getConnectorBalance(
    connectorId: string,
    userId?: string,
    userRole?: string,
    organizationId?: string | null
  ): Promise<ConnectorBalance> {
    const connector = await prisma.user.findFirst({
      where: { id: connectorId, role: 'connector' },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        organizationId: true,
        createdBy: true,
      },
    });

    if (!connector) {
      throw new Error('Connector not found');
    }

    // Multi-tenant check: ensure connector belongs to user's organization
    if (userRole !== 'master_admin' && organizationId && connector.organizationId !== organizationId) {
      throw new Error('Forbidden - Connector not found in your organization');
    }

    // Authorization check
    if (userRole === 'admin' && connector.createdBy !== userId) {
      throw new Error('Forbidden - You can only view your own connectors');
    } else if (userRole === 'connector' && connectorId !== userId) {
      throw new Error('Forbidden - You can only view your own balance');
    }

    // Get all ledger entries
    const entries = await prisma.payoutLedger.findMany({
      where: { connectorId },
    });

    const totalEarned = entries
      .filter((e) => e.entry_type === 'credit')
      .reduce((sum, e) => sum + Number(e.amount), 0);

    const totalAdvance = entries
      .filter((e) => e.entry_type === 'debit')
      .reduce((sum, e) => sum + Number(e.amount), 0);

    const currentBalance = totalEarned - totalAdvance;

    return {
      connectorId,
      connectorName: `${connector.firstName} ${connector.lastName}`,
      totalEarned,
      totalAdvance,
      currentBalance,
    };
  }

  /**
   * Get all connectors with their balances (SuperAdmin/Admin view)
   */
  async getAllConnectorBalances(userId?: string, userRole?: string, organizationId?: string | null) {
    const where: any = { role: 'connector', isActive: true };

    // Multi-tenant filtering: filter by organizationId (except for master_admin)
    if (userRole !== 'master_admin' && organizationId) {
      where.organizationId = organizationId;
    }

    // Admin sees only their created connectors
    if (userRole === 'admin') {
      where.createdBy = userId;
    }

    const connectors = await prisma.user.findMany({
      where,
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        mobile: true,
        createdBy: true,
      },
    });

    // Calculate balance for each connector
    const balances = await Promise.all(
      connectors.map(async (connector) => {
        const entries = await prisma.payoutLedger.findMany({
          where: { connectorId: connector.id },
        });

        const totalEarned = entries
          .filter((e) => e.entry_type === 'credit')
          .reduce((sum, e) => sum + Number(e.amount), 0);

        const totalAdvance = entries
          .filter((e) => e.entry_type === 'debit')
          .reduce((sum, e) => sum + Number(e.amount), 0);

        const currentBalance = totalEarned - totalAdvance;

        return {
          connector,
          totalEarned,
          totalAdvance,
          currentBalance,
        };
      })
    );

    return balances;
  }

  /**
   * Get ledger entries with filters
   */
  async getLedgerEntries(
    filters: {
      connectorId?: string;
      month?: number;
      year?: number;
      entryType?: 'debit' | 'credit';
    },
    userId?: string,
    userRole?: string,
    organizationId?: string | null
  ) {
    const where: any = {};

    // Apply filters
    if (filters.connectorId) {
      where.connectorId = filters.connectorId;

      // Authorization check
      if (userRole === 'admin') {
        const connector = await prisma.user.findFirst({
          where: { id: filters.connectorId },
          select: { organizationId: true, createdBy: true },
        });
        if (!connector) {
          throw new Error('Connector not found');
        }
        // Multi-tenant check
        if (userRole !== 'master_admin' && organizationId && connector.organizationId !== organizationId) {
          throw new Error('Forbidden - Connector not found in your organization');
        }
        if (connector.createdBy !== userId) {
          throw new Error('Forbidden - You can only view your own connectors');
        }
      } else if (userRole === 'connector' && filters.connectorId !== userId) {
        throw new Error('Forbidden - You can only view your own ledger');
      } else if (userRole !== 'master_admin' && userRole !== 'connector') {
        // For superadmin - verify connector belongs to organization
        const connector = await prisma.user.findFirst({
          where: { id: filters.connectorId },
          select: { organizationId: true },
        });
        if (!connector) {
          throw new Error('Connector not found');
        }
        if (organizationId && connector.organizationId !== organizationId) {
          throw new Error('Forbidden - Connector not found in your organization');
        }
      }
    } else if (userRole === 'admin') {
      // Admin sees only their created connectors within their organization
      const connectorWhere: any = { role: 'connector', createdBy: userId };
      if (organizationId) {
        connectorWhere.organizationId = organizationId;
      }
      const connectors = await prisma.user.findMany({
        where: connectorWhere,
        select: { id: true },
      });
      where.connectorId = { in: connectors.map((c) => c.id) };
    } else if (userRole === 'connector') {
      // Connector sees only their own entries
      where.connectorId = userId;
    } else if (userRole !== 'master_admin' && organizationId) {
      // Superadmin - filter connectors by organization
      const connectors = await prisma.user.findMany({
        where: { role: 'connector', organizationId },
        select: { id: true },
      });
      where.connectorId = { in: connectors.map((c) => c.id) };
    }

    if (filters.month) where.month = filters.month;
    if (filters.year) where.year = filters.year;
    if (filters.entryType) where.entry_type = filters.entryType;

    const entries = await prisma.payoutLedger.findMany({
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
        creator: {
          select: {
            firstName: true,
            lastName: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return entries;
  }

  /**
   * Auto-generate credit entries for disbursed customers
   * This should be called when a customer status changes to 'disbursed'
   */
  async generatePayoutForDisbursedCustomer(customerId: string) {
    const customer = await prisma.customer.findUnique({
      where: { id: customerId },
      include: {
        connector: {
          include: {
            userBankDetails: {
              include: {
                bank: true,
              },
            },
          },
        },
        bank: true,
      },
    });

    if (!customer || customer.status !== 'disbursed' || !customer.connectorId) {
      return null;
    }

    // Find matching bank detail
    const bankDetail = customer.connector?.userBankDetails?.find(
      (bd) =>
        bd.bank.id === customer.bankId && bd.loanType === customer.loanType
    );

    if (!bankDetail) {
      return null;
    }

    // Calculate payout
    let payout = (Number(customer.loanAmount) * Number(bankDetail.payoutRatio)) / 100;

    // Deduct subvention amount if present
    if (customer.subventionAmount) {
      payout -= Number(customer.subventionAmount);
    }

    // Get current month/year
    const now = new Date();
    const month = now.getMonth() + 1;
    const year = now.getFullYear();

    // Check if entry already exists
    const existingEntry = await prisma.payoutLedger.findFirst({
      where: {
        connectorId: customer.connectorId,
        customerId: customer.id,
        entry_type: 'credit',
      },
    });

    // Build description
    let description = `Payout - ${customer.loanType} - ${customer.bank?.name || 'N/A'}`;
    if (customer.subventionAmount && Number(customer.subventionAmount) > 0) {
      description += ` (Subvention: ₹${Number(customer.subventionAmount).toLocaleString('en-IN')})`;
    }

    if (existingEntry) {
      // Update existing entry if payout amount or description changed
      const updatedEntry = await prisma.payoutLedger.update({
        where: { id: existingEntry.id },
        data: {
          amount: new Prisma.Decimal(payout),
          description,
          connectorId: customer.connectorId, // Update in case connector was changed
        },
      });
      return updatedEntry;
    }

    // Create credit entry
    const entry = await prisma.payoutLedger.create({
      data: {
        connectorId: customer.connectorId,
        customerId: customer.id,
        entry_type: 'credit',
        amount: new Prisma.Decimal(payout),
        description,
        month,
        year,
      },
    });

    return entry;
  }

  /**
   * Get monthly payouts with accordion structure and carry-forward logic
   */
  async getMonthlyPayoutsByConnector(connectorId: string, userId?: string, userRole?: string, organizationId?: string | null) {
    // Authorization check
    const connector = await prisma.user.findFirst({
      where: { id: connectorId, role: 'connector' },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        organizationId: true,
        createdBy: true,
      },
    });

    if (!connector) {
      throw new Error('Connector not found');
    }

    // Multi-tenant check: ensure connector belongs to user's organization
    if (userRole !== 'master_admin' && organizationId && connector.organizationId !== organizationId) {
      throw new Error('Forbidden - Connector not found in your organization');
    }

    if (userRole === 'admin' && connector.createdBy !== userId) {
      throw new Error('Forbidden - You can only view your own connectors');
    } else if (userRole === 'connector' && connectorId !== userId) {
      throw new Error('Forbidden - You can only view your own payout');
    }

    // Get all ledger entries
    const entries = await prisma.payoutLedger.findMany({
      where: { connectorId },
      include: {
        connector: {
          select: { firstName: true, lastName: true },
        },
        creator: {
          select: { firstName: true, lastName: true },
        },
      },
      orderBy: [{ year: 'asc' }, { month: 'asc' }, { createdAt: 'asc' }],
    });

    // Get customer names for entries
    const customerIds = entries.filter(e => e.customerId).map(e => e.customerId!);
    const customers = await prisma.customer.findMany({
      where: { id: { in: customerIds } },
      select: { id: true, name: true },
    });

    const customerMap = new Map(customers.map(c => [c.id, c.name]));

    // Group by month-year
    const groupedByMonth: Record<string, any[]> = {};
    entries.forEach((entry) => {
      const key = `${entry.year}-${String(entry.month).padStart(2, '0')}`;
      if (!groupedByMonth[key]) {
        groupedByMonth[key] = [];
      }
      groupedByMonth[key].push({
        ...entry,
        customerName: entry.customerId ? customerMap.get(entry.customerId) : null,
      });
    });

    // Calculate monthly data with carry-forward logic
    const monthlyData: any[] = [];
    let carryForwardBalance = 0;

    // Sort months chronologically for carry-forward calculation
    const sortedMonths = Object.keys(groupedByMonth).sort();

    sortedMonths.forEach((monthKey) => {
      const [year, month] = monthKey.split('-').map(Number);
      let monthEntries = [...groupedByMonth[monthKey]];

      // Add carry-forward from previous month as first entry if negative
      if (carryForwardBalance < 0) {
        monthEntries.unshift({
          id: `carry-forward-${monthKey}`,
          connectorId,
          customerId: null,
          customerName: null,
          entry_type: 'debit',
          amount: Math.abs(carryForwardBalance),
          description: 'Advance carry forward from previous month',
          month,
          year,
          createdBy: null,
          createdAt: new Date(year, month - 1, 1),
          connector: { firstName: connector.firstName, lastName: connector.lastName },
          creator: null,
          isCarryForward: true,
        });
      }

      // Calculate totals
      const earned = monthEntries
        .filter((e) => e.entry_type === 'credit')
        .reduce((sum, e) => sum + Number(e.amount), 0);

      const advance = monthEntries
        .filter((e) => e.entry_type === 'debit')
        .reduce((sum, e) => sum + Number(e.amount), 0);

      const netAmount = earned - advance;
      carryForwardBalance = netAmount; // Update for next month

      monthlyData.push({
        month,
        year,
        monthKey,
        monthName: new Date(year, month - 1).toLocaleDateString('en-IN', { month: 'short' }),
        earned,
        advance,
        netAmount,
        balance: netAmount,
        isNegative: netAmount < 0,
        entries: monthEntries,
      });
    });

    // Return in reverse chronological order for display
    return monthlyData.reverse();
  }

  /**
   * Delete ledger entry (SuperAdmin only)
   */
  async deleteLedgerEntry(entryId: string, _userId?: string, userRole?: string, organizationId?: string | null) {
    if (userRole !== 'superadmin' && userRole !== 'admin') {
      throw new Error('Forbidden - Only superadmins and admins can delete ledger entries');
    }

    // Get the ledger entry to check organization
    const entry = await prisma.payoutLedger.findUnique({
      where: { id: entryId },
      include: {
        connector: {
          select: {
            organizationId: true,
          },
        },
      },
    });

    if (!entry) {
      throw new Error('Ledger entry not found');
    }

    // Multi-tenant check: ensure ledger entry's connector belongs to user's organization
    if (userRole !== 'master_admin' && organizationId && entry.connector.organizationId !== organizationId) {
      throw new Error('Forbidden - Ledger entry not found in your organization');
    }

    await prisma.payoutLedger.delete({
      where: { id: entryId },
    });

    return { message: 'Ledger entry deleted successfully' };
  }

  /**
   * Generate monthly payout PDF
   */
  async generateMonthlyPayoutPDF(
    connectorId: string,
    month: number,
    year: number,
    userId?: string,
    userRole?: string,
    organizationId?: string | null
  ) {
    // Authorization check
    const connector = await prisma.user.findFirst({
      where: { id: connectorId, role: 'connector' },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        mobile: true,
        organizationId: true,
        createdBy: true,
      },
    });

    if (!connector) {
      throw new Error('Connector not found');
    }

    // Multi-tenant check: ensure connector belongs to user's organization
    if (userRole !== 'master_admin' && organizationId && connector.organizationId !== organizationId) {
      throw new Error('Forbidden - Connector not found in your organization');
    }

    // Only SuperAdmin/Admin can generate PDFs
    if (userRole !== 'superadmin' && userRole !== 'admin') {
      throw new Error('Forbidden - Only SuperAdmin/Admin can generate PDFs');
    }

    // Admin can only generate PDFs for their own connectors
    if (userRole === 'admin' && connector.createdBy !== userId) {
      throw new Error('Forbidden - You can only generate PDFs for your own connectors');
    }

    // Get monthly payout data
    const monthlyData = await this.getMonthlyPayoutsByConnector(connectorId, userId, userRole, organizationId);
    const targetMonth = monthlyData.find(m => m.month === month && m.year === year);

    if (!targetMonth) {
      throw new Error('No payout data found for the specified month');
    }

    // Get generator info
    const generator = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        firstName: true,
        lastName: true,
        role: true,
        companyName: true,
      },
    });

    if (!generator) {
      throw new Error('Generator user not found');
    }

    // Generate PDF
    const pdfUrl = await PayoutPDFGenerator.generatePayoutPDF(
      connector,
      targetMonth,
      {
        ...generator,
        companyName: generator.companyName || undefined,
      }
    );

    // Store PDF record in database
    const pdfRecord = await prisma.payoutPDF.upsert({
      where: {
        connector_id_month_year: {
          connector_id: connectorId,
          month,
          year,
        },
      },
      update: {
        pdfUrl,
        generated_by: userId!,
      },
      create: {
        connector_id: connectorId,
        month,
        year,
        pdfUrl,
        generated_by: userId!,
      },
    });

    return {
      pdfUrl,
      pdfRecord,
    };
  }
}
