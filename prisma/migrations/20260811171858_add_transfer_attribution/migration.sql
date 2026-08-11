-- AlterTable
ALTER TABLE "Appointment" ADD COLUMN     "depositConfirmedAt" TIMESTAMP(3),
ADD COLUMN     "depositConfirmedByUserId" TEXT;

-- AlterTable
ALTER TABLE "CashSession" ADD COLUMN     "transferAmount" DOUBLE PRECISION;

-- AddForeignKey
ALTER TABLE "Appointment" ADD CONSTRAINT "Appointment_depositConfirmedByUserId_fkey" FOREIGN KEY ("depositConfirmedByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
