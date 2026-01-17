import PDFDocument from 'pdfkit';
import fs from 'fs';
import path from 'path';

/**
 * Format currency in INR format without special characters
 * Converts number to format like: 9,500.00
 */
const formatCurrency = (amount: number): string => {
  const formatted = amount.toFixed(2);
  const parts = formatted.split('.');
  const integerPart = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  return `${integerPart}.${parts[1]}`;
};

interface InvoiceData {
  id: string;
  invoiceNumber: string;
  invoiceDate: Date;
  period_month: number;
  period_year: number;
  taxableAmount: any;
  cgstRate: any;
  cgstAmount: any;
  sgstRate: any;
  sgstAmount: any;
  roundOff: any;
  totalAmount: any;
  hsnSac: string;
  dsa: {
    name: string;
    companyName?: string | null;
    address?: string | null;
    city?: string | null;
    pinCode?: string | null;
    gstin?: string | null;
    stateCode?: string | null;
    stateName?: string | null;
    email?: string | null;
  };
  issuedBy: {
    firstName: string;
    lastName: string;
    email: string;
    companyName?: string | null;
    companyAddress?: string | null;
    companyGSTIN?: string | null;
    companyState?: string | null;
    companyStateCode?: string | null;
    companyEmail?: string | null;
  };
}

export class DsaInvoicePdfGenerator {
  static async generateInvoicePDF(invoice: InvoiceData): Promise<string> {
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
        const doc = new PDFDocument({ size: 'A4', margin: 40 });
        const stream = fs.createWriteStream(filePath);

        doc.pipe(stream);

        // Helper function to format currency
        const formatCurrencyWithSymbol = (amount: number) => {
          const formatted = amount.toFixed(2);
          const parts = formatted.split('.');
          const integerPart = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');
          return `Rs. ${integerPart}.${parts[1]}`;
        };

        // Helper function to format date
        const formatDate = (date: Date) => {
          return new Date(date).toLocaleDateString('en-IN', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
          });
        };

        // Helper function for amount in words
        const numberToWords = (num: number): string => {
          const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine'];
          const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
          const teens = ['Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];

          if (num === 0) return 'Zero';

          const convert = (n: number): string => {
            if (n < 10) return ones[n];
            if (n >= 10 && n < 20) return teens[n - 10];
            if (n >= 20 && n < 100) return tens[Math.floor(n / 10)] + (n % 10 ? ' ' + ones[n % 10] : '');
            if (n >= 100 && n < 1000) return ones[Math.floor(n / 100)] + ' Hundred' + (n % 100 ? ' ' + convert(n % 100) : '');
            if (n >= 1000 && n < 100000) return convert(Math.floor(n / 1000)) + ' Thousand' + (n % 1000 ? ' ' + convert(n % 1000) : '');
            if (n >= 100000 && n < 10000000) return convert(Math.floor(n / 100000)) + ' Lakh' + (n % 100000 ? ' ' + convert(n % 100000) : '');
            return convert(Math.floor(n / 10000000)) + ' Crore' + (n % 10000000 ? ' ' + convert(n % 10000000) : '');
          };

          return convert(Math.floor(num)) + ' Rupees Only';
        };

        let y = 40;

        // Header: "Tax Invoice" centered
        doc.fontSize(16).font('Helvetica-Bold').text('TAX INVOICE', 0, y, { align: 'center' });
        y += 30;

        // Two-column layout: Seller (left) | Invoice Details (right)
        const leftX = 40;
        const rightX = 320;
        const colWidth = 250;

        // Left column: Seller Details
        doc.fontSize(10).font('Helvetica-Bold').text('Seller:', leftX, y);
        y += 15;

        const sellerName = invoice.issuedBy.companyName || `${invoice.issuedBy.firstName} ${invoice.issuedBy.lastName}`;
        doc.fontSize(9).font('Helvetica').text(sellerName, leftX, y, { width: colWidth });
        y += 12;

        if (invoice.issuedBy.companyAddress) {
          doc.text(invoice.issuedBy.companyAddress, leftX, y, { width: colWidth });
          y += 12;
        }

        if (invoice.issuedBy.companyState) {
          doc.text(`State: ${invoice.issuedBy.companyState}`, leftX, y, { width: colWidth });
          y += 12;
        }

        if (invoice.issuedBy.companyGSTIN) {
          doc.text(`GSTIN: ${invoice.issuedBy.companyGSTIN}`, leftX, y, { width: colWidth });
          y += 12;
        }

        if (invoice.issuedBy.companyEmail || invoice.issuedBy.email) {
          doc.text(`Email: ${invoice.issuedBy.companyEmail || invoice.issuedBy.email}`, leftX, y, { width: colWidth });
          y += 12;
        }

        // Right column: Invoice metadata (reset y to start from same position)
        let rightY = 70;
        doc.fontSize(9).font('Helvetica-Bold').text('Invoice No:', rightX, rightY);
        doc.font('Helvetica').text(invoice.invoiceNumber, rightX + 70, rightY);
        rightY += 15;

        doc.font('Helvetica-Bold').text('Invoice Date:', rightX, rightY);
        doc.font('Helvetica').text(formatDate(invoice.invoiceDate), rightX + 70, rightY);
        rightY += 15;

        doc.font('Helvetica-Bold').text('Period:', rightX, rightY);
        const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        doc.font('Helvetica').text(`${monthNames[invoice.period_month - 1]} ${invoice.period_year}`, rightX + 70, rightY);
        rightY += 15;

        // Move y down to below seller details
        y = Math.max(y, rightY) + 10;

        // Horizontal line
        doc.moveTo(40, y).lineTo(555, y).stroke();
        y += 10;

        // Buyer Details
        doc.fontSize(10).font('Helvetica-Bold').text('Buyer:', leftX, y);
        y += 15;

        const buyerName = invoice.dsa.companyName || invoice.dsa.name;
        doc.fontSize(9).font('Helvetica').text(buyerName, leftX, y, { width: 500 });
        y += 12;

        if (invoice.dsa.address) {
          doc.text(`${invoice.dsa.address}${invoice.dsa.city ? ', ' + invoice.dsa.city : ''}${invoice.dsa.pinCode ? ' - ' + invoice.dsa.pinCode : ''}`, leftX, y, { width: 500 });
          y += 12;
        }

        if (invoice.dsa.stateName) {
          doc.text(`State: ${invoice.dsa.stateName}${invoice.dsa.stateCode ? ' (Code: ' + invoice.dsa.stateCode + ')' : ''}`, leftX, y);
          y += 12;
        }

        if (invoice.dsa.gstin) {
          doc.text(`GSTIN: ${invoice.dsa.gstin}`, leftX, y);
          y += 12;
        }

        if (invoice.dsa.email) {
          doc.text(`Email: ${invoice.dsa.email}`, leftX, y);
          y += 12;
        }

        y += 10;

        // Horizontal line
        doc.moveTo(40, y).lineTo(555, y).stroke();
        y += 15;

        // Table Header
        doc.fontSize(9).font('Helvetica-Bold');
        doc.text('Description', 50, y);
        doc.text('HSN/SAC', 280, y);
        doc.text('Rate', 370, y);
        doc.text('Taxable Amt', 440, y, { width: 100, align: 'right' });
        y += 15;

        doc.moveTo(40, y).lineTo(555, y).stroke();
        y += 10;

        // Line Item
        doc.fontSize(9).font('Helvetica');
        const description = `DSA Commission for ${monthNames[invoice.period_month - 1]} ${invoice.period_year}`;
        doc.text(description, 50, y, { width: 220 });
        doc.text(invoice.hsnSac, 280, y);
        doc.text('-', 370, y);
        doc.text(formatCurrencyWithSymbol(Number(invoice.taxableAmount)), 440, y, { width: 100, align: 'right' });
        y += 20;

        doc.moveTo(40, y).lineTo(555, y).stroke();
        y += 10;

        // Tax Summary
        doc.fontSize(9).font('Helvetica');

        // Taxable Amount
        doc.text('Taxable Amount:', 320, y);
        doc.text(formatCurrencyWithSymbol(Number(invoice.taxableAmount)), 440, y, { width: 100, align: 'right' });
        y += 15;

        // CGST
        doc.text(`CGST @ ${Number(invoice.cgstRate)}%:`, 320, y);
        doc.text(formatCurrencyWithSymbol(Number(invoice.cgstAmount)), 440, y, { width: 100, align: 'right' });
        y += 15;

        // SGST/UTGST
        doc.text(`SGST/UTGST @ ${Number(invoice.sgstRate)}%:`, 320, y);
        doc.text(formatCurrencyWithSymbol(Number(invoice.sgstAmount)), 440, y, { width: 100, align: 'right' });
        y += 15;

        // Round Off
        const roundOffValue = Number(invoice.roundOff);
        doc.text('Round Off:', 320, y);
        doc.text((roundOffValue >= 0 ? '+' : '') + formatCurrencyWithSymbol(roundOffValue), 440, y, { width: 100, align: 'right' });
        y += 15;

        doc.moveTo(320, y).lineTo(555, y).stroke();
        y += 10;

        // Total Amount
        doc.fontSize(10).font('Helvetica-Bold');
        doc.text('Total Amount:', 320, y);
        doc.text(formatCurrencyWithSymbol(Number(invoice.totalAmount)), 440, y, { width: 100, align: 'right' });
        y += 20;

        doc.moveTo(40, y).lineTo(555, y).stroke();
        y += 15;

        // Amount in Words
        doc.fontSize(9).font('Helvetica-Bold');
        doc.text('Amount in Words:', 50, y);
        y += 12;
        doc.font('Helvetica');
        doc.text(numberToWords(Number(invoice.totalAmount)), 50, y, { width: 500 });
        y += 30;

        // Footer section
        if (y > 700) {
          doc.addPage();
          y = 40;
        }

        // Signature section
        doc.fontSize(9).font('Helvetica-Bold');
        doc.text('For ' + sellerName, 400, y);
        y += 40;
        doc.text('Authorized Signatory', 400, y);

        // Computer Generated Invoice disclaimer
        y = 750;
        doc.fontSize(8).font('Helvetica-Oblique');
        doc.text('This is a computer-generated invoice and does not require a physical signature.', 0, y, {
          align: 'center',
        });

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
