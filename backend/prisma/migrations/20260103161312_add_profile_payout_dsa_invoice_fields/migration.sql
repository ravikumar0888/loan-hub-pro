/*
  Warnings:

  - The values [subadmin] on the enum `UserRole` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "UserRole_new" AS ENUM ('superadmin', 'admin', 'backoffice', 'connector');
ALTER TABLE "users" ALTER COLUMN "role" TYPE "UserRole_new" USING ("role"::text::"UserRole_new");
ALTER TYPE "UserRole" RENAME TO "UserRole_old";
ALTER TYPE "UserRole_new" RENAME TO "UserRole";
DROP TYPE "UserRole_old";
COMMIT;

-- AlterTable
ALTER TABLE "dsas" ADD COLUMN     "address" TEXT,
ADD COLUMN     "city" VARCHAR(100),
ADD COLUMN     "company_name" VARCHAR(255),
ADD COLUMN     "email" VARCHAR(255),
ADD COLUMN     "gstin" VARCHAR(15),
ADD COLUMN     "pin_code" VARCHAR(6),
ADD COLUMN     "state_code" VARCHAR(2),
ADD COLUMN     "state_name" VARCHAR(100);

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "cgst_rate" DECIMAL(5,2),
ADD COLUMN     "company_address" TEXT,
ADD COLUMN     "company_email" VARCHAR(255),
ADD COLUMN     "company_gstin" VARCHAR(15),
ADD COLUMN     "company_name" VARCHAR(255),
ADD COLUMN     "company_state" VARCHAR(100),
ADD COLUMN     "company_state_code" VARCHAR(2),
ADD COLUMN     "hsn_sac" VARCHAR(10),
ADD COLUMN     "profile_photo" TEXT,
ADD COLUMN     "sgst_rate" DECIMAL(5,2);

-- CreateTable
CREATE TABLE "payout_pdfs" (
    "id" TEXT NOT NULL,
    "connector_id" TEXT NOT NULL,
    "month" INTEGER NOT NULL,
    "year" INTEGER NOT NULL,
    "pdf_url" TEXT NOT NULL,
    "generated_by" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "payout_pdfs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "dsa_invoices" (
    "id" TEXT NOT NULL,
    "invoice_number" VARCHAR(50) NOT NULL,
    "dsa_id" TEXT NOT NULL,
    "issued_by_id" TEXT NOT NULL,
    "invoice_date" DATE NOT NULL,
    "period_month" INTEGER NOT NULL,
    "period_year" INTEGER NOT NULL,
    "taxable_amount" DECIMAL(15,2) NOT NULL,
    "cgst_rate" DECIMAL(5,2) NOT NULL,
    "cgst_amount" DECIMAL(15,2) NOT NULL,
    "sgst_rate" DECIMAL(5,2) NOT NULL,
    "sgst_amount" DECIMAL(15,2) NOT NULL,
    "round_off" DECIMAL(10,2) NOT NULL,
    "total_amount" DECIMAL(15,2) NOT NULL,
    "hsn_sac" VARCHAR(10) NOT NULL,
    "pdf_url" TEXT,
    "status" VARCHAR(20) NOT NULL DEFAULT 'issued',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "dsa_invoices_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "payout_pdfs_connector_id_idx" ON "payout_pdfs"("connector_id");

-- CreateIndex
CREATE UNIQUE INDEX "payout_pdfs_connector_id_month_year_key" ON "payout_pdfs"("connector_id", "month", "year");

-- CreateIndex
CREATE UNIQUE INDEX "dsa_invoices_invoice_number_key" ON "dsa_invoices"("invoice_number");

-- CreateIndex
CREATE INDEX "dsa_invoices_dsa_id_idx" ON "dsa_invoices"("dsa_id");

-- CreateIndex
CREATE INDEX "dsa_invoices_invoice_date_idx" ON "dsa_invoices"("invoice_date");

-- AddForeignKey
ALTER TABLE "payout_pdfs" ADD CONSTRAINT "payout_pdfs_connector_id_fkey" FOREIGN KEY ("connector_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payout_pdfs" ADD CONSTRAINT "payout_pdfs_generated_by_fkey" FOREIGN KEY ("generated_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "dsa_invoices" ADD CONSTRAINT "dsa_invoices_dsa_id_fkey" FOREIGN KEY ("dsa_id") REFERENCES "dsas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "dsa_invoices" ADD CONSTRAINT "dsa_invoices_issued_by_id_fkey" FOREIGN KEY ("issued_by_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
