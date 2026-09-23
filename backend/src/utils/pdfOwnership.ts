import prisma from '../config/database';

/**
 * Resolves which organization owns a generated file, by exact pdfUrl match
 * across the tables that persist one. Returns null if no record references
 * this path (caller should treat that as 404, not "no restriction").
 */
export async function resolveFileOwnerOrgId(relativePath: string): Promise<string | null> {
  const customer = await prisma.customer.findFirst({
    where: { pdfUrl: relativePath },
    select: { organizationId: true },
  });
  if (customer) return customer.organizationId;

  const dsaInvoice = await prisma.dsaInvoice.findFirst({
    where: { pdfUrl: relativePath },
    select: { dsa: { select: { organizationId: true } } },
  });
  if (dsaInvoice) return dsaInvoice.dsa.organizationId;

  const payoutPdf = await prisma.payoutPDF.findFirst({
    where: { pdfUrl: relativePath },
    select: { users_payout_pdfs_connector_idTousers: { select: { organizationId: true } } },
  });
  if (payoutPdf) return payoutPdf.users_payout_pdfs_connector_idTousers.organizationId;

  return null;
}
