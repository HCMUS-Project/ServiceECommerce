-- AlterTable
ALTER TABLE "Review" ADD COLUMN     "type" TEXT NOT NULL DEFAULT 'ecommerce';

-- AlterTable
ALTER TABLE "Voucher" ADD COLUMN     "type" TEXT NOT NULL DEFAULT 'ecommerce';
