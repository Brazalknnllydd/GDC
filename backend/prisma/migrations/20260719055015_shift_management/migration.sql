-- AlterTable
ALTER TABLE "Shift" ADD COLUMN     "expectedClosingCash" DECIMAL(10,2),
ADD COLUMN     "notes" TEXT,
ADD COLUMN     "status" TEXT NOT NULL DEFAULT 'OPEN';
