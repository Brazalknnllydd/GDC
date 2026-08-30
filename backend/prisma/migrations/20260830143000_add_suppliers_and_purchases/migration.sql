CREATE TABLE "Supplier" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "phone" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Supplier_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "SupplierPurchase" (
    "id" SERIAL NOT NULL,
    "supplierId" INTEGER NOT NULL,
    "purchaseDate" TIMESTAMP(3) NOT NULL,
    "chequeCreditDate" TIMESTAMP(3) NOT NULL,
    "referenceNumber" TEXT,
    "notes" TEXT,
    "totalAmount" DECIMAL(10,2) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SupplierPurchase_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "SupplierPurchaseItem" (
    "id" SERIAL NOT NULL,
    "purchaseId" INTEGER NOT NULL,
    "productId" INTEGER NOT NULL,
    "quantity" DOUBLE PRECISION NOT NULL,
    "unitCost" DECIMAL(10,2) NOT NULL,
    "salePrice" DECIMAL(10,2) NOT NULL,
    "lineTotal" DECIMAL(10,2) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SupplierPurchaseItem_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "Supplier_name_key" ON "Supplier"("name");
CREATE INDEX "SupplierPurchase_supplierId_idx" ON "SupplierPurchase"("supplierId");
CREATE INDEX "SupplierPurchase_purchaseDate_idx" ON "SupplierPurchase"("purchaseDate");
CREATE INDEX "SupplierPurchaseItem_purchaseId_idx" ON "SupplierPurchaseItem"("purchaseId");
CREATE INDEX "SupplierPurchaseItem_productId_idx" ON "SupplierPurchaseItem"("productId");

ALTER TABLE "SupplierPurchase" ADD CONSTRAINT "SupplierPurchase_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES "Supplier"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "SupplierPurchaseItem" ADD CONSTRAINT "SupplierPurchaseItem_purchaseId_fkey" FOREIGN KEY ("purchaseId") REFERENCES "SupplierPurchase"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "SupplierPurchaseItem" ADD CONSTRAINT "SupplierPurchaseItem_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
