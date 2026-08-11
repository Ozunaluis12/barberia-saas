-- AlterTable
ALTER TABLE "Appointment" ADD COLUMN     "giftCardCode" TEXT,
ADD COLUMN     "giftCardRedeemed" DOUBLE PRECISION;

-- AlterTable
ALTER TABLE "Business" ADD COLUMN     "giftCardsEnabled" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "ProductSale" ADD COLUMN     "giftCardCode" TEXT,
ADD COLUMN     "giftCardRedeemed" DOUBLE PRECISION;

-- AlterTable
ALTER TABLE "StoreSale" ADD COLUMN     "giftCardCode" TEXT,
ADD COLUMN     "giftCardRedeemed" DOUBLE PRECISION;

-- CreateTable
CREATE TABLE "GiftCard" (
    "id" TEXT NOT NULL,
    "businessId" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "initialAmount" DOUBLE PRECISION NOT NULL,
    "balance" DOUBLE PRECISION NOT NULL,
    "recipientName" TEXT,
    "recipientPhone" TEXT,
    "purchaserName" TEXT,
    "purchaserPhone" TEXT,
    "purchaserEmail" TEXT,
    "expiresAt" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "paymentMethod" TEXT,
    "issuedByUserId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "confirmedAt" TIMESTAMP(3),

    CONSTRAINT "GiftCard_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "GiftCard_code_key" ON "GiftCard"("code");

-- CreateIndex
CREATE INDEX "GiftCard_businessId_status_idx" ON "GiftCard"("businessId", "status");

-- AddForeignKey
ALTER TABLE "GiftCard" ADD CONSTRAINT "GiftCard_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "Business"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GiftCard" ADD CONSTRAINT "GiftCard_issuedByUserId_fkey" FOREIGN KEY ("issuedByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
