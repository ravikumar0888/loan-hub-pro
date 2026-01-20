import PDFDocument from 'pdfkit';
import fs from 'fs';
import path from 'path';
import { format } from 'date-fns';

/**
 * Format currency in INR format
 */
const formatCurrency = (amount: number): string => {
  const formatted = amount.toFixed(2);
  const parts = formatted.split('.');
  const integerPart = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  return `${integerPart}.${parts[1]}`;
};

interface OrganizationInvoiceData {
  id: string;
  invoiceNumber: string;
  amount: number;
  seats: number;
  pricePerSeat: number;
  billingPeriodStart: Date;
  billingPeriodEnd: Date;
  dueDate: Date;
  status: string;
  createdAt: Date;
  paidAt?: Date | null;
  organization: {
    name: string;
    email: string;
    phone: string;
    address: string;
    pricingTier: string;
    addons?: Array<{
      role: string;
      quantity: number;
      price: number;
    }>;
  };
}

export class InvoicePdfGenerator {
  static async generateInvoicePDF(invoice: OrganizationInvoiceData): Promise<string> {
    return new Promise((resolve, reject) => {
      try {
        // Create directory if it doesn't exist
        const pdfDir = path.join(__dirname, '../../public/pdfs/invoices');
        if (!fs.existsSync(pdfDir)) {
          fs.mkdirSync(pdfDir, { recursive: true });
        }

        const fileName = `invoice-${invoice.invoiceNumber.replace(/\//g, '-')}-${Date.now()}.pdf`;
        const filePath = path.join(pdfDir, fileName);
        const relativePath = `/pdfs/invoices/${fileName}`;

        // Create PDF document
        const doc = new PDFDocument({ size: 'A4', margin: 50 });
        const stream = fs.createWriteStream(filePath);

        doc.pipe(stream);

        // Colors
        const primaryColor = '#3b82f6';
        const darkColor = '#1e293b';
        const grayColor = '#64748b';
        const lightBg = '#f1f5f9';

        // Header - Company Logo/Name
        doc
          .fontSize(24)
          .fillColor(primaryColor)
          .font('Helvetica-Bold')
          .text('LoanMS', 50, 50);

        doc
          .fontSize(10)
          .fillColor(grayColor)
          .font('Helvetica')
          .text('Loan Management System', 50, 80)
          .text('contact@loanms.com', 50, 95);

        // Invoice Title
        doc
          .fontSize(28)
          .fillColor(darkColor)
          .font('Helvetica-Bold')
          .text('INVOICE', 400, 50, { align: 'right' });

        // Invoice Details Box
        doc
          .fontSize(10)
          .fillColor(grayColor)
          .font('Helvetica')
          .text(`Invoice #: ${invoice.invoiceNumber}`, 400, 80, { align: 'right' })
          .text(`Date: ${format(invoice.createdAt, 'MMM dd, yyyy')}`, 400, 95, { align: 'right' })
          .text(`Due Date: ${format(invoice.dueDate, 'MMM dd, yyyy')}`, 400, 110, { align: 'right' });

        // Status Badge
        let statusColor = primaryColor;
        if (invoice.status === 'paid') statusColor = '#22c55e';
        if (invoice.status === 'overdue') statusColor = '#ef4444';
        if (invoice.status === 'cancelled') statusColor = '#94a3b8';

        doc
          .fontSize(12)
          .fillColor(statusColor)
          .font('Helvetica-Bold')
          .text(invoice.status.toUpperCase(), 400, 130, { align: 'right' });

        // Draw line separator
        doc
          .moveTo(50, 160)
          .lineTo(545, 160)
          .strokeColor('#e2e8f0')
          .stroke();

        // Bill To Section
        doc
          .fontSize(12)
          .fillColor(darkColor)
          .font('Helvetica-Bold')
          .text('BILL TO:', 50, 180);

        doc
          .fontSize(11)
          .fillColor(darkColor)
          .font('Helvetica-Bold')
          .text(invoice.organization.name, 50, 200);

        doc
          .fontSize(10)
          .fillColor(grayColor)
          .font('Helvetica')
          .text(invoice.organization.address || 'N/A', 50, 220)
          .text(invoice.organization.email, 50, 235)
          .text(invoice.organization.phone, 50, 250);

        // Billing Period
        doc
          .fontSize(12)
          .fillColor(darkColor)
          .font('Helvetica-Bold')
          .text('BILLING PERIOD:', 350, 180);

        doc
          .fontSize(10)
          .fillColor(grayColor)
          .font('Helvetica')
          .text(`${format(invoice.billingPeriodStart, 'MMM dd, yyyy')} -`, 350, 200)
          .text(`${format(invoice.billingPeriodEnd, 'MMM dd, yyyy')}`, 350, 215);

        // Draw line separator
        doc
          .moveTo(50, 290)
          .lineTo(545, 290)
          .strokeColor('#e2e8f0')
          .stroke();

        // Table Header
        const tableTop = 310;
        doc
          .rect(50, tableTop, 495, 30)
          .fillAndStroke(lightBg, '#e2e8f0');

        doc
          .fontSize(11)
          .fillColor(darkColor)
          .font('Helvetica-Bold')
          .text('DESCRIPTION', 60, tableTop + 10)
          .text('PLAN', 280, tableTop + 10, { width: 100, align: 'center' })
          .text('USERS', 390, tableTop + 10, { width: 70, align: 'center' })
          .text('AMOUNT', 470, tableTop + 10, { width: 70, align: 'right' });

        // Table Content
        let rowTop = tableTop + 45;

        // Plan name mapping
        const planNames: Record<string, string> = {
          starter: 'Standard',
          professional: 'Professional',
          enterprise: 'Enterprise',
        };

        // Base plan pricing
        const basePlanPrices: Record<string, number> = {
          starter: 4999,
          professional: 13999,
          enterprise: 8999,
        };
        const basePlanPrice = basePlanPrices[invoice.organization.pricingTier] || Number(invoice.pricePerSeat);

        // Base Plan Row
        doc
          .fontSize(10)
          .fillColor(darkColor)
          .font('Helvetica')
          .text('Subscription - Fixed Package', 60, rowTop)
          .text(planNames[invoice.organization.pricingTier] || invoice.organization.pricingTier, 280, rowTop, { width: 100, align: 'center' })
          .text(`${invoice.seats}`, 390, rowTop, { width: 70, align: 'center' })
          .text(`Rs. ${formatCurrency(basePlanPrice)}`, 470, rowTop, { width: 70, align: 'right' });

        rowTop += 25;

        // Add-ons Rows (if any)
        const addons = invoice.organization.addons || [];
        if (addons.length > 0) {
          const roleNames: Record<string, string> = {
            admin: 'Admin',
            backoffice: 'Back Office',
            channel_partner: 'Channel Partner',
          };

          for (const addon of addons) {
            doc
              .fontSize(10)
              .fillColor(grayColor)
              .font('Helvetica')
              .text(`Add-on: ${roleNames[addon.role] || addon.role}`, 60, rowTop)
              .text(`${addon.quantity}`, 280, rowTop, { width: 100, align: 'center' })
              .text(`@ Rs. ${addon.price}`, 390, rowTop, { width: 70, align: 'center' })
              .text(`Rs. ${formatCurrency(addon.price * addon.quantity)}`, 470, rowTop, { width: 70, align: 'right' });
            rowTop += 20;
          }
        }

        // Draw line separator after items
        rowTop += 10;
        doc
          .moveTo(50, rowTop)
          .lineTo(545, rowTop)
          .strokeColor('#e2e8f0')
          .stroke();

        // Totals Section - positioned relative to content
        const totalsTop = rowTop + 20;

        doc
          .fontSize(10)
          .fillColor(grayColor)
          .font('Helvetica')
          .text('Subtotal:', 350, totalsTop)
          .text(`Rs. ${formatCurrency(Number(invoice.amount))}`, 470, totalsTop, { width: 70, align: 'right' });

        // Total (with background)
        const totalTop = totalsTop + 25;
        doc
          .rect(340, totalTop - 5, 205, 25)
          .fillAndStroke(lightBg, '#e2e8f0');

        doc
          .fontSize(12)
          .fillColor(darkColor)
          .font('Helvetica-Bold')
          .text('TOTAL:', 350, totalTop)
          .text(`Rs. ${formatCurrency(Number(invoice.amount))}`, 470, totalTop, { width: 70, align: 'right' });

        // Payment Status
        let statusTop = totalTop + 30;
        if (invoice.status === 'paid' && invoice.paidAt) {
          doc
            .fontSize(10)
            .fillColor('#22c55e')
            .font('Helvetica-Bold')
            .text(`Paid on: ${format(invoice.paidAt, 'MMM dd, yyyy')}`, 350, statusTop);
          statusTop += 20;
        } else if (invoice.status === 'pending') {
          doc
            .fontSize(10)
            .fillColor('#f59e0b')
            .font('Helvetica-Bold')
            .text('Payment Pending', 350, statusTop);
          statusTop += 20;
        } else if (invoice.status === 'overdue') {
          doc
            .fontSize(10)
            .fillColor('#ef4444')
            .font('Helvetica-Bold')
            .text('Payment Overdue', 350, statusTop);
          statusTop += 20;
        }

        // Notes Section - positioned dynamically
        const notesTop = Math.max(statusTop + 30, 520);
        doc
          .fontSize(11)
          .fillColor(darkColor)
          .font('Helvetica-Bold')
          .text('NOTES:', 50, notesTop);

        doc
          .fontSize(9)
          .fillColor(grayColor)
          .font('Helvetica')
          .text('• This is a fixed package subscription invoice.', 50, notesTop + 18)
          .text('• The package includes the specified number of user seats.', 50, notesTop + 32)
          .text('• Add-ons, if any, are included in the total amount.', 50, notesTop + 46)
          .text('• Payment is due by the specified due date.', 50, notesTop + 60);

        // Footer - positioned at bottom of page
        const footerTop = Math.max(notesTop + 100, 720);
        doc
          .moveTo(50, footerTop)
          .lineTo(545, footerTop)
          .strokeColor('#e2e8f0')
          .stroke();

        doc
          .fontSize(8)
          .fillColor(grayColor)
          .font('Helvetica')
          .text('Thank you for your business!', 50, footerTop + 15, { align: 'center', width: 495 })
          .text('For questions regarding this invoice, please contact support@loanms.com', 50, footerTop + 30, { align: 'center', width: 495 })
          .text(`Generated on ${format(new Date(), 'PPP p')}`, 50, footerTop + 50, { align: 'center', width: 495 });

        // Finalize the PDF
        doc.end();

        stream.on('finish', () => {
          resolve(relativePath);
        });

        stream.on('error', (error) => {
          reject(error);
        });
      } catch (error) {
        reject(error);
      }
    });
  }
}
