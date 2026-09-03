CREATE TABLE "CashierExpense" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "shiftId" INTEGER,
    "amount" DECIMAL(10,2) NOT NULL,
    "description" TEXT NOT NULL,
    "expenseDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CashierExpense_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "CashierExpense_userId_expenseDate_idx" ON "CashierExpense"("userId", "expenseDate");
CREATE INDEX "CashierExpense_shiftId_idx" ON "CashierExpense"("shiftId");

ALTER TABLE "CashierExpense" ADD CONSTRAINT "CashierExpense_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "CashierExpense" ADD CONSTRAINT "CashierExpense_shiftId_fkey" FOREIGN KEY ("shiftId") REFERENCES "Shift"("id") ON DELETE SET NULL ON UPDATE CASCADE;
