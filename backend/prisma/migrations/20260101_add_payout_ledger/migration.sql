-- CreateTable
CREATE TABLE "payout_ledger" (
    "id" TEXT NOT NULL,
    "connector_id" TEXT NOT NULL,
    "customer_id" TEXT,
    "entry_type" TEXT NOT NULL,
    "amount" DECIMAL(15,2) NOT NULL,
    "description" TEXT NOT NULL,
    "month" INTEGER NOT NULL,
    "year" INTEGER NOT NULL,
    "created_by" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "payout_ledger_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "payout_ledger_connector_id_idx" ON "payout_ledger"("connector_id");

-- CreateIndex
CREATE INDEX "payout_ledger_connector_id_month_year_idx" ON "payout_ledger"("connector_id", "month", "year");

-- CreateIndex
CREATE INDEX "payout_ledger_entry_type_idx" ON "payout_ledger"("entry_type");

-- AddForeignKey
ALTER TABLE "payout_ledger" ADD CONSTRAINT "payout_ledger_connector_id_fkey" FOREIGN KEY ("connector_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payout_ledger" ADD CONSTRAINT "payout_ledger_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
