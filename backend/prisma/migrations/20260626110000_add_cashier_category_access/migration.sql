CREATE TABLE "CashierCategoryAccess" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "categoryId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CashierCategoryAccess_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "CashierCategoryAccess_userId_categoryId_key"
ON "CashierCategoryAccess"("userId", "categoryId");

ALTER TABLE "CashierCategoryAccess"
ADD CONSTRAINT "CashierCategoryAccess_userId_fkey"
FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "CashierCategoryAccess"
ADD CONSTRAINT "CashierCategoryAccess_categoryId_fkey"
FOREIGN KEY ("categoryId") REFERENCES "Category"("id") ON DELETE CASCADE ON UPDATE CASCADE;
