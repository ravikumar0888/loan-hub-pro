import prisma from '../config/database';
import { PAGINATION_DEFAULTS } from '../config/constants';
import { InvoiceQueryParams, CreateInvoiceDto } from '../types';

export class InvoicesService {
  /**
   * Generate next invoice number (INV-YYYY-NNN)
   */
  private async generateInvoiceNumber(): Promise<string> {
    const year = new Date().getFullYear();
    const count = await prisma.invoice.count({
      where: {
        invoiceNumber: {
          startsWith: `INV-${year}`,
        },
      },
    });
    return `INV-${year}-${(count + 1).toString().padStart(3, '0')}`;
  }

  /**
   * Get invoices with filtering
   * master_admin: all invoices or filter by org
   * superadmin/admin: only their organization's invoices
   */
  async getInvoices(query: InvoiceQueryParams, userRole?: string, organizationId?: string | null) {
    const page = query.page || PAGINATION_DEFAULTS.page;
    const limit = Math.min(query.limit || PAGINATION_DEFAULTS.limit, PAGINATION_DEFAULTS.maxLimit);
    const skip = (page - 1) * limit;

    const where: any = {};

    // Role-based filtering
    if (userRole !== 'master_admin') {
      where.organizationId = organizationId;
    } else if (query.organizationId) {
      where.organizationId = query.organizationId;
    }

    if (query.status) {
      where.status = query.status;
    }

    if (query.startDate || query.endDate) {
      where.dueDate = {};
      if (query.startDate) {
        where.dueDate.gte = new Date(query.startDate);
      }
      if (query.endDate) {
        where.dueDate.lte = new Date(query.endDate);
      }
    }

    const [invoices, total] = await Promise.all([
      prisma.invoice.findMany({
        where,
        include: {
          organization: {
            select: {
              id: true,
              name: true,
              email: true,
              pricingTier: true,
            },
          },
        },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.invoice.count({ where }),
    ]);

    return {
      data: invoices,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Get invoice by ID
   */
  async getInvoiceById(id: string, userRole?: string, organizationId?: string | null) {
    const invoice = await prisma.invoice.findUnique({
      where: { id },
      include: {
        organization: true,
      },
    });

    if (!invoice) {
      throw new Error('Invoice not found');
    }

    // Authorization check
    if (userRole !== 'master_admin' && invoice.organizationId !== organizationId) {
      throw new Error('Forbidden: Cannot access other organization invoices');
    }

    return invoice;
  }

  /**
   * Create invoice (master_admin only)
   */
  async createInvoice(data: CreateInvoiceDto, userRole?: string) {
    if (userRole !== 'master_admin') {
      throw new Error('Unauthorized: Only master admins can create invoices');
    }

    // Get organization details
    const organization = await prisma.organization.findUnique({
      where: { id: data.organizationId },
    });

    if (!organization) {
      throw new Error('Organization not found');
    }

    // Calculate amount based on pricing tier
    const pricePerSeat: Record<string, number> = {
      starter: 499,
      professional: 899,
      enterprise: 1499,
    };

    const amount = pricePerSeat[organization.pricingTier] * organization.seats;
    const invoiceNumber = await this.generateInvoiceNumber();

    const invoice = await prisma.invoice.create({
      data: {
        invoiceNumber,
        organizationId: data.organizationId,
        amount,
        seats: organization.seats,
        pricePerSeat: pricePerSeat[organization.pricingTier],
        billingPeriodStart: data.billingPeriodStart,
        billingPeriodEnd: data.billingPeriodEnd,
        dueDate: data.dueDate,
        status: 'pending',
      },
      include: {
        organization: true,
      },
    });

    return invoice;
  }

  /**
   * Update invoice status (master_admin only)
   */
  async updateInvoiceStatus(id: string, status: string, userRole?: string) {
    if (userRole !== 'master_admin') {
      throw new Error('Unauthorized: Only master admins can update invoice status');
    }

    const updateData: any = { status };

    if (status === 'paid') {
      updateData.paidAt = new Date();
    }

    const invoice = await prisma.invoice.update({
      where: { id },
      data: updateData,
      include: {
        organization: true,
      },
    });

    // If paid, ensure organization is active
    if (status === 'paid') {
      await prisma.organization.update({
        where: { id: invoice.organizationId },
        data: { status: 'active' },
      });
    }

    return invoice;
  }

  /**
   * Get billing analytics (master_admin only)
   */
  async getBillingAnalytics(userRole?: string) {
    if (userRole !== 'master_admin') {
      throw new Error('Unauthorized: Only master admins can view billing analytics');
    }

    const [totalRevenue, outstandingAmount, monthlyRevenue, invoicesByStatus] = await Promise.all([
      // Total revenue (all paid invoices)
      prisma.invoice.aggregate({
        where: { status: 'paid' },
        _sum: { amount: true },
      }),
      // Outstanding amount (pending + overdue)
      prisma.invoice.aggregate({
        where: { status: { in: ['pending', 'overdue'] } },
        _sum: { amount: true },
      }),
      // Current month revenue
      prisma.invoice.aggregate({
        where: {
          status: 'paid',
          paidAt: {
            gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
          },
        },
        _sum: { amount: true },
      }),
      // Count by status
      prisma.invoice.groupBy({
        by: ['status'],
        _count: true,
      }),
    ]);

    return {
      totalRevenue: totalRevenue._sum.amount || 0,
      outstandingAmount: outstandingAmount._sum.amount || 0,
      monthlyRevenue: monthlyRevenue._sum.amount || 0,
      invoicesByStatus: invoicesByStatus.reduce((acc, item) => {
        acc[item.status] = item._count;
        return acc;
      }, {} as Record<string, number>),
    };
  }
}
