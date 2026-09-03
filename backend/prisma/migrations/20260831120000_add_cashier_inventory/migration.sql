ALTER TABLE "Sale"
ADD COLUMN "recipientUserId" INTEGER,
ADD COLUMN "saleType" TEXT NOT NULL DEFAULT 'CUSTOMER';

ALTER TABLE "SaleItem"
ADD COLUMN "sourceCashierId" INTEGER;

CREATE TABLE "CashierInventory" (
    "id" SERIAL NOT NULL,
    "cashierId" INTEGER NOT NULL,
    "productId" INTEGER NOT NULL,
    "sourceCashierId" INTEGER NOT NULL,
    "quantity" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CashierInventory_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "CashierInventory_cashierId_productId_sourceCashierId_key"
ON "CashierInventory"("cashierId", "productId", "sourceCashierId");

CREATE INDEX "CashierInventory_cashierId_productId_idx"
ON "CashierInventory"("cashierId", "productId");

ALTER TABLE "Sale"
ADD CONSTRAINT "Sale_recipientUserId_fkey"
FOREIGN KEY ("recipientUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "CashierInventory"
ADD CONSTRAINT "CashierInventory_cashierId_fkey"
FOREIGN KEY ("cashierId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "CashierInventory"
ADD CONSTRAINT "CashierInventory_productId_fkey"
FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "CashierInventory"
ADD CONSTRAINT "CashierInventory_sourceCashierId_fkey"
FOREIGN KEY ("sourceCashierId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "SaleItem"
ADD CONSTRAINT "SaleItem_sourceCashierId_fkey"
FOREIGN KEY ("sourceCashierId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
