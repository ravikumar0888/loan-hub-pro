import PDFDocument from 'pdfkit';
import { format } from 'date-fns';
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

interface ConnectorData {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  mobile: string;
}

interface MonthlyPayoutData {
  month: number;
  year: number;
  monthName: string;
  earned: number;
  advance: number;
  netAmount: number;
  balance: number;
  entries: Array<{
    id: string;
    entry_type: string;
    amount: number;
    description: string;
    createdAt: Date;
    customerName?: string;
    creator?: {
      firstName: string;
      lastName: string;
    } | null;
    isCarryForward?: boolean;
  }>;
}

interface GeneratorInfo {
  firstName: string;
  lastName: string;
  role: string;
  companyName?: string;
}

export class PayoutPDFGenerator {
  /**
   * Generate a monthly payout statement PDF
   */
  static async generatePayoutPDF(
    connector: ConnectorData,
    monthData: MonthlyPayoutData,
    generator: GeneratorInfo
  ): Promise<string> {
    return new Promise((resolve, reject) => {
      try {
        // Ensure directory exists
        const pdfDir = path.join(__dirname, '../../public/pdfs/payouts');
        if (!fs.existsSync(pdfDir)) {
          fs.mkdirSync(pdfDir, { recursive: true });
        }

        // Generate filename
        const filename = `payout_${connector.id}_${monthData.year}_${String(monthData.month).padStart(2, '0')}_${Date.now()}.pdf`;
        const filepath = path.join(pdfDir, filename);

        const doc = new PDFDocument({ margin: 50, size: 'A4' });
        const stream = fs.createWriteStream(filepath);

        doc.pipe(stream);

        // Set colors
        const primaryColor = '#3b82f6';
        const textColor = '#1f2937';
        const lightGray = '#f3f4f6';
        const borderColor = '#d1d5db';
        const successColor = '#10b981';
        const dangerColor = '#ef4444';

        // Header
        if (generator.companyName) {
          doc
            .fontSize(20)
            .fillColor(primaryColor)
            .font('Helvetica-Bold')
            .text(generator.companyName, { align: 'center' });
          doc.moveDown(0.5);
        }

        doc
          .fontSize(18)
          .fillColor(primaryColor)
          .font('Helvetica-Bold')
          .text('PAYOUT STATEMENT', { align: 'center' });

        doc.moveDown(0.3);
        doc
          .fontSize(12)
          .fillColor(textColor)
          .font('Helvetica')
          .text(`${monthData.monthName} ${monthData.year}`, { align: 'center' });

        doc.moveDown(1.5);

        // Connector Information Box
        const boxY = doc.y;
        doc
          .rect(50, boxY, doc.page.width - 100, 80)
          .fillAndStroke(lightGray, borderColor);

        doc
          .fillColor(textColor)
          .fontSize(10)
          .font('Helvetica-Bold')
          .text('CHANNEL PARTNER DETAILS', 60, boxY + 10);

        doc
          .font('Helvetica')
          .text(`Name: ${connector.firstName} ${connector.lastName}`, 60, boxY + 30)
          .text(`Email: ${connector.email}`, 60, boxY + 45)
          .text(`Mobile: ${connector.mobile}`, 60, boxY + 60);

        doc.moveDown(2);

        // Summary Section
        const summaryY = doc.y;
        doc
          .fontSize(12)
          .font('Helvetica-Bold')
          .fillColor(primaryColor)
          .text('SUMMARY', 50, summaryY);

        doc.moveDown(0.5);

        const summaryBoxY = doc.y;
        const boxWidth = (doc.page.width - 120) / 3;

        // Earned Box
        doc
          .rect(50, summaryBoxY, boxWidth, 60)
          .fillAndStroke('#ecfdf5', '#86efac');
        doc
          .fillColor(textColor)
          .fontSize(10)
          .font('Helvetica')
          .text('Total Earned', 60, summaryBoxY + 15);
        doc
          .fontSize(16)
          .font('Helvetica-Bold')
          .fillColor(successColor)
          .text(`Rs. ${formatCurrency(monthData.earned)}`, 60, summaryBoxY + 35);

        // Advance Box
        doc
          .rect(50 + boxWidth + 10, summaryBoxY, boxWidth, 60)
          .fillAndStroke('#fef2f2', '#fca5a5');
        doc
          .fillColor(textColor)
          .fontSize(10)
          .font('Helvetica')
          .text('Total Advance', 60 + boxWidth + 10, summaryBoxY + 15);
        doc
          .fontSize(16)
          .font('Helvetica-Bold')
          .fillColor(dangerColor)
          .text(`Rs. ${formatCurrency(monthData.advance)}`, 60 + boxWidth + 10, summaryBoxY + 35);

        // Net Balance Box
        const balanceColor = monthData.netAmount >= 0 ? successColor : dangerColor;
        const balanceBg = monthData.netAmount >= 0 ? '#ecfdf5' : '#fef2f2';
        const balanceBorder = monthData.netAmount >= 0 ? '#86efac' : '#fca5a5';

        doc
          .rect(50 + (boxWidth + 10) * 2, summaryBoxY, boxWidth, 60)
          .fillAndStroke(balanceBg, balanceBorder);
        doc
          .fillColor(textColor)
          .fontSize(10)
          .font('Helvetica')
          .text('Net Balance', 60 + (boxWidth + 10) * 2, summaryBoxY + 15);
        doc
          .fontSize(16)
          .font('Helvetica-Bold')
          .fillColor(balanceColor)
          .text(`Rs. ${formatCurrency(monthData.netAmount)}`, 60 + (boxWidth + 10) * 2, summaryBoxY + 35);

        doc.moveDown(4);

        // Transaction Details Table
        doc
          .fontSize(12)
          .font('Helvetica-Bold')
          .fillColor(primaryColor)
          .text('TRANSACTION DETAILS', 50, doc.y);

        doc.moveDown(0.5);

        // Table Header
        const tableTop = doc.y;
        const colWidths = [80, 250, 80, 80];
        const colPositions = [50, 130, 380, 460];

        doc
          .rect(50, tableTop, doc.page.width - 100, 25)
          .fillAndStroke(primaryColor, primaryColor);

        doc
          .fontSize(10)
          .font('Helvetica-Bold')
          .fillColor('#ffffff')
          .text('Date', colPositions[0] + 5, tableTop + 8)
          .text('Description', colPositions[1] + 5, tableTop + 8)
          .text('Credit', colPositions[2] + 5, tableTop + 8)
          .text('Debit', colPositions[3] + 5, tableTop + 8);

        let currentY = tableTop + 25;
        let runningBalance = 0;

        // Table Rows
        monthData.entries.forEach((entry, index) => {
          // Check if we need a new page
          if (currentY > 700) {
            doc.addPage();
            currentY = 50;
          }

          const rowColor = index % 2 === 0 ? '#ffffff' : lightGray;
          doc
            .rect(50, currentY, doc.page.width - 100, 25)
            .fillAndStroke(rowColor, borderColor);

          const credit = entry.entry_type === 'credit' ? entry.amount : 0;
          const debit = entry.entry_type === 'debit' ? entry.amount : 0;
          runningBalance += credit - debit;

          doc
            .fontSize(9)
            .font('Helvetica')
            .fillColor(textColor)
            .text(
              format(new Date(entry.createdAt), 'dd/MM/yyyy'),
              colPositions[0] + 5,
              currentY + 8,
              { width: colWidths[0] - 10 }
            )
            .text(
              entry.description,
              colPositions[1] + 5,
              currentY + 8,
              { width: colWidths[1] - 10, ellipsis: true }
            );

          if (credit > 0) {
            doc
              .fillColor(successColor)
              .text(
                `Rs. ${formatCurrency(credit)}`,
                colPositions[2] + 5,
                currentY + 8,
                { width: colWidths[2] - 10 }
              );
          } else {
            doc
              .fillColor(textColor)
              .text('-', colPositions[2] + 5, currentY + 8, { width: colWidths[2] - 10 });
          }

          if (debit > 0) {
            doc
              .fillColor(dangerColor)
              .text(
                `Rs. ${formatCurrency(debit)}`,
                colPositions[3] + 5,
                currentY + 8,
                { width: colWidths[3] - 10 }
              );
          } else {
            doc
              .fillColor(textColor)
              .text('-', colPositions[3] + 5, currentY + 8, { width: colWidths[3] - 10 });
          }

          currentY += 25;
        });

        // Footer
        doc.moveDown(2);
        const footerY = doc.y + 30;

        doc
          .fontSize(8)
          .fillColor(textColor)
          .font('Helvetica')
          .text(
            `Generated by ${generator.firstName} ${generator.lastName} on ${format(new Date(), 'PPP')}`,
            50,
            footerY,
            { align: 'center' }
          );

        doc
          .fontSize(7)
          .fillColor('#9ca3af')
          .text(
            'This is a computer-generated document and does not require a signature.',
            50,
            footerY + 15,
            { align: 'center' }
          );

        // Finalize PDF
        doc.end();

        stream.on('finish', () => {
          // Return relative URL path
          const relativePath = `/pdfs/payouts/${filename}`;
          resolve(relativePath);
        });

        stream.on('error', reject);
      } catch (error) {
        reject(error);
      }
    });
  }
}
