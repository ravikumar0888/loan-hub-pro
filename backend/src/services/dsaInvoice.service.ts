import prisma from '../config/database';
import { Prisma } from '@prisma/client';

export class DsaInvoiceService {
  /**
   * Generate a new invoice number in format INV/YY/NNNNN
   */
  async generateInvoiceNumber(): Promise<string> {
    const count = await prisma.dsaInvoice.count();
    const year = new Date().getFullYear().toString().slice(-2);
    return `INV/${year}/${String(count + 1).padStart(5, '0')}`;
  }

  /**
   * Calculate DSA commission for a given period
   * Finds all disbursed customers linked to the DSA in the given month/year
   * and sums up the commissions based on payout ratios
   */
  async calculateDsaCommission(dsaId: string, month: number, year: number): Promise<number> {
    // Calculate date range for the period
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0, 23, 59, 59);

    // Find all disbursed customers for this DSA in the period
    const customers = await prisma.customer.findMany({
      where: {
        dsaId,
        status: 'disbursed',
        applicationDate: {
          gte: startDate,
          lte: endDate,
        },
      },
      include: {
        dsa: {
          include: {
            bankDetails: {
              include: {
                bank: true,
              },
            },
          },
        },
      },
    });

    let totalCommission = 0;

    // Calculate commission for each customer
    for (const customer of customers) {
      if (!customer.dsa?.bankDetails) continue;

      // Find matching bank detail for this customer's bank and loan type
      const bankDetail = customer.dsa.bankDetails.find(
        (bd) => bd.bankId === customer.bankId && bd.loanType === customer.loanType
      );

      if (bankDetail) {
        // Calculate commission: (Loan Amount * Payout Ratio) / 100
        const commission = (Number(customer.loanAmount) * Number(bankDetail.payoutRatio)) / 100;
        totalCommission += commission;
      }
    }

    return totalCommission;
  }

  /**
   * Generate a DSA invoice for a given period
   */
  async generateDsaInvoice(dsaId: string, month: number, year: number, issuedById: string) {
    // 1. Calculate commission (taxable amount)
    const taxableAmount = await this.calculateDsaCommission(dsaId, month, year);

    if (taxableAmount === 0) {
      throw new Error('No commission found for the selected period');
    }

    // 2. Get issuer (admin) details for GST rates and HSN/SAC
    const issuer = await prisma.user.findUnique({
      where: { id: issuedById },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        companyName: true,
        companyAddress: true,
        companyGSTIN: true,
        companyState: true,
        companyStateCode: true,
        companyEmail: true,
        hsnSac: true,
        cgstRate: true,
        sgstRate: true,
      },
    });

    if (!issuer) {
      throw new Error('Issuer not found');
    }

    // 3. Get DSA details
    const dsa = await prisma.dsa.findUnique({
      where: { id: dsaId },
      include: {
        bankDetails: {
          include: {
            bank: true,
          },
        },
      },
    });

    if (!dsa) {
      throw new Error('DSA not found');
    }

    // 4. Use admin's GST configuration or defaults
    const cgstRate = issuer.cgstRate || new Prisma.Decimal(9);
    const sgstRate = issuer.sgstRate || new Prisma.Decimal(9);
    const hsnSac = issuer.hsnSac || '997159';

    // 5. Calculate taxes
    const cgstAmount = (taxableAmount * Number(cgstRate)) / 100;
    const sgstAmount = (taxableAmount * Number(sgstRate)) / 100;
    const subtotal = taxableAmount + cgstAmount + sgstAmount;
    const roundOff = Math.round(subtotal) - subtotal;
    const totalAmount = Math.round(subtotal);

    // 6. Generate invoice number
    const invoiceNumber = await this.generateInvoiceNumber();

    // 7. Check if invoice already exists for this period
    const existingInvoice = await prisma.dsaInvoice.findFirst({
      where: {
        dsaId,
        periodMonth: month,
        periodYear: year,
      },
    });

    if (existingInvoice) {
      throw new Error('Invoice already exists for this period');
    }

    // 8. Create invoice record
    const invoice = await prisma.dsaInvoice.create({
      data: {
        invoiceNumber,
        dsaId,
        issuedById,
        invoiceDate: new Date(),
        periodMonth: month,
        periodYear: year,
        taxableAmount: new Prisma.Decimal(taxableAmount),
        cgstRate,
        cgstAmount: new Prisma.Decimal(cgstAmount),
        sgstRate,
        sgstAmount: new Prisma.Decimal(sgstAmount),
        roundOff: new Prisma.Decimal(roundOff),
        totalAmount: new Prisma.Decimal(totalAmount),
        hsnSac,
      },
      include: {
        dsa: true,
        issuedBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            companyName: true,
            companyAddress: true,
            companyGSTIN: true,
            companyState: true,
            companyStateCode: true,
            companyEmail: true,
          },
        },
      },
    });

    // 9. Generate PDF
    const { DsaInvoicePdfGenerator } = await import('../utils/dsaInvoicePdfGenerator');
    const pdfPath = await DsaInvoicePdfGenerator.generateInvoicePDF(invoice);

    // 10. Update invoice with PDF URL
    const updatedInvoice = await prisma.dsaInvoice.update({
      where: { id: invoice.id },
      data: { pdfUrl: pdfPath },
      include: {
        dsa: true,
        issuedBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            companyName: true,
            companyAddress: true,
            companyGSTIN: true,
            companyState: true,
            companyStateCode: true,
            companyEmail: true,
          },
        },
      },
    });

    return updatedInvoice;
  }

  /**
   * Get invoices with optional filters
   */
  async getInvoices(filters: {
    dsaId?: string;
    month?: string;
    year?: string;
    status?: string;
  }) {
    const where: any = {};

    if (filters.dsaId) where.dsaId = filters.dsaId;
    if (filters.month) where.periodMonth = parseInt(filters.month);
    if (filters.year) where.periodYear = parseInt(filters.year);
    if (filters.status) where.status = filters.status;

    const invoices = await prisma.dsaInvoice.findMany({
      where,
      include: {
        dsa: true,
        issuedBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
      orderBy: {
        invoiceDate: 'desc',
      },
    });

    return invoices;
  }

  /**
   * Get a single invoice by ID
   */
  async getInvoiceById(id: string) {
    const invoice = await prisma.dsaInvoice.findUnique({
      where: { id },
      include: {
        dsa: true,
        issuedBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            companyName: true,
            companyAddress: true,
            companyGSTIN: true,
            companyState: true,
            companyStateCode: true,
            companyEmail: true,
          },
        },
      },
    });

    if (!invoice) {
      throw new Error('Invoice not found');
    }

    return invoice;
  }

  /**
   * Delete an invoice
   */
  async deleteInvoice(id: string) {
    const invoice = await prisma.dsaInvoice.findUnique({
      where: { id },
    });

    if (!invoice) {
      throw new Error('Invoice not found');
    }

    // Delete PDF file if exists
    if (invoice.pdfUrl) {
      const fs = await import('fs');
      const path = await import('path');
      const filePath = path.join(__dirname, '../../public', invoice.pdfUrl);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    }

    await prisma.dsaInvoice.delete({
      where: { id },
    });

    return { message: 'Invoice deleted successfully' };
  }
}

export const dsaInvoiceService = new DsaInvoiceService();
