-- AlterTable
ALTER TABLE "Sale" ADD COLUMN     "approvedByUserId" INTEGER,
ADD COLUMN     "isPrinted" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "notes" TEXT,
ADD COLUMN     "paymentReference" TEXT,
ADD COLUMN     "status" TEXT NOT NULL DEFAULT 'completed',
ADD COLUMN     "taxAmount" DECIMAL(10,2) NOT NULL DEFAULT 0,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT NOW();

-- AddForeignKey
ALTER TABLE "Sale" ADD CONSTRAINT "Sale_approvedByUserId_fkey" FOREIGN KEY ("approvedByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
