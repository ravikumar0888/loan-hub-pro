import PDFDocument from 'pdfkit';
import { format } from 'date-fns';

interface CustomerData {
  applicationId?: string;
  name: string;
  panNo?: string;
  dateOfBirth?: Date;
  mobile: string;
  email?: string;
  motherName?: string;
  spouseName?: string;
  currentCompanyExp?: string;
  officialEmail?: string;
  totalWorkExperience?: string;
  currentAddress?: string;
  postalAddress?: string;
  homeType?: string;
  reference1Name?: string;
  reference1Mobile?: string;
  reference1Address?: string;
  reference2Name?: string;
  reference2Mobile?: string;
  reference2Address?: string;
  nomineeName?: string;
  nomineeRelation?: string;
  nomineeDateOfBirth?: Date;
  loanType: string;
  loanAmount: number;
  caseType?: string;
  status: string;
  connector?: {
    firstName: string;
    lastName: string;
  };
  dsa?: {
    name: string;
  };
  bank?: {
    name: string;
  };
  leadOwnerUser?: {
    firstName: string;
    lastName: string;
  };
  salesManager?: string;
  createdAt: Date;
}

export class PDFGenerator {
  /**
   * Generate a customer application PDF
   */
  static async generateCustomerPDF(customer: CustomerData): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      try {
        const doc = new PDFDocument({ margin: 50, size: 'A4' });
        const buffers: Buffer[] = [];

        // Collect PDF data
        doc.on('data', buffers.push.bind(buffers));
        doc.on('end', () => {
          const pdfData = Buffer.concat(buffers);
          resolve(pdfData);
        });
        doc.on('error', reject);

        // Set font and colors
        const primaryColor = '#3b82f6';
        const textColor = '#1f2937';
        const lightGray = '#f3f4f6';

        // Header
        doc
          .fontSize(24)
          .fillColor(primaryColor)
          .font('Helvetica-Bold')
          .text('APPLICATION FORM', { align: 'center' });

        doc.moveDown(1);

        // Application Details Box
        const boxY = doc.y;
        doc
          .rect(50, boxY, doc.page.width - 100, 60)
          .fillAndStroke(lightGray, '#d1d5db');

        doc
          .fillColor(textColor)
          .fontSize(10)
          .font('Helvetica')
          .text(`Application ID: ${customer.applicationId || 'Auto-generated'}`, 60, boxY + 15)
          .text(`Application Date: ${format(customer.createdAt, 'PPP')}`, 60, boxY + 30)
          .text(`Status: ${customer.status.toUpperCase()}`, 60, boxY + 45);

        doc.moveDown(2);

        // Helper function to add a section
        const addSection = (title: string, fields: Array<{ label: string; value: any }>) => {
          doc
            .fontSize(14)
            .fillColor(primaryColor)
            .font('Helvetica-Bold')
            .text(title);

          doc
            .moveTo(50, doc.y + 2)
            .lineTo(doc.page.width - 50, doc.y + 2)
            .stroke(primaryColor);

          doc.moveDown(0.5);

          fields.forEach(({ label, value }) => {
            if (value) {
              doc
                .fontSize(10)
                .fillColor(textColor)
                .font('Helvetica-Bold')
                .text(`${label}: `, { continued: true })
                .font('Helvetica')
                .text(value);
              doc.moveDown(0.3);
            }
          });

          doc.moveDown(0.7);
        };

        // Personal Details
        addSection('Personal Details', [
          { label: 'Name', value: customer.name },
          { label: 'PAN No', value: customer.panNo },
          { label: 'Date of Birth', value: customer.dateOfBirth ? format(new Date(customer.dateOfBirth), 'PPP') : null },
          { label: 'Mobile', value: customer.mobile },
          { label: 'Email', value: customer.email },
          { label: 'Mother Name', value: customer.motherName },
          { label: 'Spouse Name', value: customer.spouseName },
        ]);

        // Professional Details
        addSection('Professional Details', [
          { label: 'Current Company Experience', value: customer.currentCompanyExp },
          { label: 'Official Email', value: customer.officialEmail },
          { label: 'Total Work Experience', value: customer.totalWorkExperience },
          { label: 'Current Address', value: customer.currentAddress },
          { label: 'Postal Address', value: customer.postalAddress },
          { label: 'Home Type', value: customer.homeType ? customer.homeType.replace('-', ' ').toUpperCase() : null },
        ]);

        // Reference 1
        if (customer.reference1Name || customer.reference1Mobile || customer.reference1Address) {
          addSection('Reference 1', [
            { label: 'Name', value: customer.reference1Name },
            { label: 'Mobile', value: customer.reference1Mobile },
            { label: 'Address', value: customer.reference1Address },
          ]);
        }

        // Reference 2
        if (customer.reference2Name || customer.reference2Mobile || customer.reference2Address) {
          addSection('Reference 2', [
            { label: 'Name', value: customer.reference2Name },
            { label: 'Mobile', value: customer.reference2Mobile },
            { label: 'Address', value: customer.reference2Address },
          ]);
        }

        // Nominee Details
        if (customer.nomineeName || customer.nomineeRelation || customer.nomineeDateOfBirth) {
          addSection('Nominee Details', [
            { label: 'Nominee Name', value: customer.nomineeName },
            { label: 'Relation', value: customer.nomineeRelation },
            { label: 'Date of Birth', value: customer.nomineeDateOfBirth ? format(new Date(customer.nomineeDateOfBirth), 'PPP') : null },
          ]);
        }

        // Loan Details
        const loanTypeMap: Record<string, string> = {
          'PL': 'Personal Loan',
          'HL': 'Home Loan',
          'BL': 'Business Loan',
        };

        const caseTypeMap: Record<string, string> = {
          'fresh': 'Fresh',
          'bt': 'BT',
          'bt_topup': 'BT-TopUp',
        };

        addSection('Loan Details', [
          { label: 'Loan Type', value: loanTypeMap[customer.loanType] || customer.loanType },
          { label: 'Case Type', value: customer.caseType ? caseTypeMap[customer.caseType] : null },
          { label: 'Loan Amount', value: `Rs. ${customer.loanAmount.toLocaleString('en-IN')}` },
          { label: 'Bank', value: customer.bank?.name },
          { label: 'Connector', value: customer.connector ? `${customer.connector.firstName} ${customer.connector.lastName}` : null },
          { label: 'DSA', value: customer.dsa?.name },
          { label: 'Lead Owner', value: customer.leadOwnerUser ? `${customer.leadOwnerUser.firstName} ${customer.leadOwnerUser.lastName}` : null },
          { label: 'Sales Manager', value: customer.salesManager },
        ]);

        // Footer
        doc
          .moveDown(2)
          .fontSize(8)
          .fillColor('#6b7280')
          .font('Helvetica')
          .text(
            'This is a computer-generated document. No signature is required.',
            { align: 'center' }
          );

        doc
          .moveDown(0.3)
          .text(`Generated on ${format(new Date(), 'PPP p')}`, { align: 'center' });

        // Finalize the PDF
        doc.end();
      } catch (error) {
        reject(error);
      }
    });
  }
}
