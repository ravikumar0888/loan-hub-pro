/*
  Warnings:

  - A unique constraint covering the columns `[application_id]` on the table `customers` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateEnum
CREATE TYPE "CaseType" AS ENUM ('fresh', 'bt', 'bt_topup');

-- AlterEnum
ALTER TYPE "UserRole" ADD VALUE 'subadmin';

-- AlterTable
ALTER TABLE "customers" ADD COLUMN     "application_id" VARCHAR(50),
ADD COLUMN     "bank_id" TEXT,
ADD COLUMN     "case_type" "CaseType",
ADD COLUMN     "created_by" TEXT,
ADD COLUMN     "current_address" TEXT,
ADD COLUMN     "current_company_exp" VARCHAR(50),
ADD COLUMN     "date_of_birth" DATE,
ADD COLUMN     "dsa_id" TEXT,
ADD COLUMN     "home_type" VARCHAR(50),
ADD COLUMN     "mother_name" VARCHAR(255),
ADD COLUMN     "nominee_date_of_birth" DATE,
ADD COLUMN     "nominee_name" VARCHAR(255),
ADD COLUMN     "nominee_relation" VARCHAR(100),
ADD COLUMN     "official_email" VARCHAR(255),
ADD COLUMN     "pan_no" VARCHAR(10),
ADD COLUMN     "pdf_url" TEXT,
ADD COLUMN     "personal_email" VARCHAR(255),
ADD COLUMN     "postal_address" TEXT,
ADD COLUMN     "reference1_address" TEXT,
ADD COLUMN     "reference1_mobile" VARCHAR(15),
ADD COLUMN     "reference1_name" VARCHAR(255),
ADD COLUMN     "reference2_address" TEXT,
ADD COLUMN     "reference2_mobile" VARCHAR(15),
ADD COLUMN     "reference2_name" VARCHAR(255),
ADD COLUMN     "spouse_name" VARCHAR(255),
ADD COLUMN     "total_work_experience" VARCHAR(50),
ALTER COLUMN "lead_owner" SET DATA TYPE TEXT;

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "created_by" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "customers_application_id_key" ON "customers"("application_id");

-- CreateIndex
CREATE INDEX "customers_dsa_id_idx" ON "customers"("dsa_id");

-- CreateIndex
CREATE INDEX "customers_bank_id_idx" ON "customers"("bank_id");

-- CreateIndex
CREATE INDEX "customers_created_by_idx" ON "customers"("created_by");

-- CreateIndex
CREATE INDEX "customers_lead_owner_idx" ON "customers"("lead_owner");

-- CreateIndex
CREATE INDEX "users_created_by_idx" ON "users"("created_by");

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "customers" ADD CONSTRAINT "customers_dsa_id_fkey" FOREIGN KEY ("dsa_id") REFERENCES "dsas"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "customers" ADD CONSTRAINT "customers_bank_id_fkey" FOREIGN KEY ("bank_id") REFERENCES "banks"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "customers" ADD CONSTRAINT "customers_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "customers" ADD CONSTRAINT "customers_lead_owner_fkey" FOREIGN KEY ("lead_owner") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
