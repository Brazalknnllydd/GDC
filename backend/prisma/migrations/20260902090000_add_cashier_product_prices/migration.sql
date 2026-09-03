CREATE TABLE "CashierProductPrice" (
    "id" SERIAL NOT NULL,
    "cashierId" INTEGER NOT NULL,
    "productId" INTEGER NOT NULL,
    "price" DECIMAL(10,2) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CashierProductPrice_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "CashierProductPrice_cashierId_productId_key" ON "CashierProductPrice"("cashierId", "productId");
CREATE INDEX "CashierProductPrice_productId_idx" ON "CashierProductPrice"("productId");

ALTER TABLE "CashierProductPrice" ADD CONSTRAINT "CashierProductPrice_cashierId_fkey" FOREIGN KEY ("cashierId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "CashierProductPrice" ADD CONSTRAINT "CashierProductPrice_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;
