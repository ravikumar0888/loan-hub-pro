import { promises as fs } from 'fs';
import path from 'path';
import { PDFGenerator } from '../utils/pdfGenerator';
import prisma from '../config/database';

export class PDFService {
  private static PDF_DIRECTORY = path.join(process.cwd(), 'public', 'pdfs');

  /**
   * Ensure the PDF directory exists
   */
  private static async ensureDirectory() {
    try {
      await fs.mkdir(this.PDF_DIRECTORY, { recursive: true });
    } catch (error) {
      console.error('Error creating PDF directory:', error);
      throw new Error('Failed to create PDF directory');
    }
  }

  /**
   * Generate and save PDF for a customer
   */
  static async generateCustomerPDF(customerId: string): Promise<string> {
    try {
      // Fetch customer data with all relations
      const customer = await prisma.customer.findUnique({
        where: { id: customerId },
        include: {
          connector: {
            select: {
              firstName: true,
              lastName: true,
            },
          },
          dsa: {
            select: {
              name: true,
            },
          },
          bank: {
            select: {
              name: true,
            },
          },
          leadOwnerUser: {
            select: {
              firstName: true,
              lastName: true,
            },
          },
        },
      });

      if (!customer) {
        throw new Error('Customer not found');
      }

      // Generate PDF buffer
      const pdfBuffer = await PDFGenerator.generateCustomerPDF(customer);

      // Ensure directory exists
      await this.ensureDirectory();

      // Create filename with customer ID and timestamp
      const filename = `customer_${customerId}_${Date.now()}.pdf`;
      const filePath = path.join(this.PDF_DIRECTORY, filename);

      // Save PDF to file system
      await fs.writeFile(filePath, pdfBuffer);

      // Return URL path (relative to public directory)
      const pdfUrl = `/pdfs/${filename}`;

      // Update customer with PDF URL
      await prisma.customer.update({
        where: { id: customerId },
        data: { pdfUrl },
      });

      return pdfUrl;
    } catch (error) {
      console.error('Error generating customer PDF:', error);
      throw error;
    }
  }

  /**
   * Delete old PDF file if it exists
   */
  static async deleteOldPDF(pdfUrl: string): Promise<void> {
    if (!pdfUrl) return;

    try {
      // Extract filename from URL
      const filename = path.basename(pdfUrl);
      const filePath = path.join(this.PDF_DIRECTORY, filename);

      // Check if file exists and delete it
      try {
        await fs.access(filePath);
        await fs.unlink(filePath);
      } catch {
        // File doesn't exist, ignore
      }
    } catch (error) {
      console.error('Error deleting old PDF:', error);
      // Don't throw error, just log it
    }
  }

  /**
   * Regenerate PDF for a customer (deletes old one and creates new one)
   */
  static async regenerateCustomerPDF(customerId: string): Promise<string> {
    try {
      // Get current PDF URL
      const customer = await prisma.customer.findUnique({
        where: { id: customerId },
        select: { pdfUrl: true },
      });

      // Delete old PDF if it exists
      if (customer?.pdfUrl) {
        await this.deleteOldPDF(customer.pdfUrl);
      }

      // Generate new PDF
      return await this.generateCustomerPDF(customerId);
    } catch (error) {
      console.error('Error regenerating customer PDF:', error);
      throw error;
    }
  }
}
