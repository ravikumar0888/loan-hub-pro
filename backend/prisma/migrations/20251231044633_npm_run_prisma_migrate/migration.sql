-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('admin', 'backoffice', 'connector');

-- CreateEnum
CREATE TYPE "LoanStatus" AS ENUM ('login', 'rejected', 'approved', 'disbursed', 'hold', 'relook', 'drop');

-- CreateEnum
CREATE TYPE "LoanType" AS ENUM ('PL', 'HL', 'BL');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "first_name" VARCHAR(100) NOT NULL,
    "last_name" VARCHAR(100) NOT NULL,
    "email" VARCHAR(255) NOT NULL,
    "mobile" VARCHAR(15) NOT NULL,
    "password_hash" VARCHAR(255) NOT NULL,
    "role" "UserRole" NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "banks" (
    "id" TEXT NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "banks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_bank_details" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "bank_id" TEXT NOT NULL,
    "loan_type" "LoanType" NOT NULL,
    "payout_ratio" DECIMAL(5,2) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_bank_details_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "dsas" (
    "id" TEXT NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "dsas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "dsa_bank_details" (
    "id" TEXT NOT NULL,
    "dsa_id" TEXT NOT NULL,
    "bank_id" TEXT NOT NULL,
    "loan_type" "LoanType" NOT NULL,
    "payout_ratio" DECIMAL(5,2) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "dsa_bank_details_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "customers" (
    "id" TEXT NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "mobile" VARCHAR(15) NOT NULL,
    "email" VARCHAR(255),
    "loan_type" "LoanType" NOT NULL,
    "loan_amount" DECIMAL(15,2) NOT NULL,
    "connector_id" TEXT,
    "lead_owner" VARCHAR(255),
    "sales_manager" VARCHAR(255),
    "status" "LoanStatus" NOT NULL,
    "application_date" DATE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "customers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "customer_remarks" (
    "id" TEXT NOT NULL,
    "customer_id" TEXT NOT NULL,
    "remark" TEXT NOT NULL,
    "created_by" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "customer_remarks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "password_reset_tokens" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "token" VARCHAR(255) NOT NULL,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "used" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "password_reset_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "users_mobile_key" ON "users"("mobile");

-- CreateIndex
CREATE INDEX "users_email_idx" ON "users"("email");

-- CreateIndex
CREATE INDEX "users_role_idx" ON "users"("role");

-- CreateIndex
CREATE UNIQUE INDEX "banks_name_key" ON "banks"("name");

-- CreateIndex
CREATE INDEX "user_bank_details_user_id_idx" ON "user_bank_details"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "user_bank_details_user_id_bank_id_loan_type_key" ON "user_bank_details"("user_id", "bank_id", "loan_type");

-- CreateIndex
CREATE UNIQUE INDEX "dsas_name_key" ON "dsas"("name");

-- CreateIndex
CREATE INDEX "dsa_bank_details_dsa_id_idx" ON "dsa_bank_details"("dsa_id");

-- CreateIndex
CREATE UNIQUE INDEX "dsa_bank_details_dsa_id_bank_id_loan_type_key" ON "dsa_bank_details"("dsa_id", "bank_id", "loan_type");

-- CreateIndex
CREATE INDEX "customers_status_idx" ON "customers"("status");

-- CreateIndex
CREATE INDEX "customers_connector_id_idx" ON "customers"("connector_id");

-- CreateIndex
CREATE INDEX "customers_application_date_idx" ON "customers"("application_date");

-- CreateIndex
CREATE INDEX "customer_remarks_customer_id_idx" ON "customer_remarks"("customer_id");

-- CreateIndex
CREATE UNIQUE INDEX "password_reset_tokens_token_key" ON "password_reset_tokens"("token");

-- CreateIndex
CREATE INDEX "password_reset_tokens_token_idx" ON "password_reset_tokens"("token");

-- AddForeignKey
ALTER TABLE "user_bank_details" ADD CONSTRAINT "user_bank_details_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_bank_details" ADD CONSTRAINT "user_bank_details_bank_id_fkey" FOREIGN KEY ("bank_id") REFERENCES "banks"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "dsa_bank_details" ADD CONSTRAINT "dsa_bank_details_dsa_id_fkey" FOREIGN KEY ("dsa_id") REFERENCES "dsas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "dsa_bank_details" ADD CONSTRAINT "dsa_bank_details_bank_id_fkey" FOREIGN KEY ("bank_id") REFERENCES "banks"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "customers" ADD CONSTRAINT "customers_connector_id_fkey" FOREIGN KEY ("connector_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "customer_remarks" ADD CONSTRAINT "customer_remarks_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "customers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "customer_remarks" ADD CONSTRAINT "customer_remarks_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "password_reset_tokens" ADD CONSTRAINT "password_reset_tokens_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
