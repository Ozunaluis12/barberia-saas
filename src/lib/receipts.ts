import { prisma } from "@/lib/db";
import type { Prisma, PrismaClient } from "@prisma/client";

type DbClient = PrismaClient | Prisma.TransactionClient;

/**
 * Asigna el siguiente número consecutivo de factura/recibo de un negocio.
 * Un solo UPDATE con increment es atómico en Postgres — dos ventas al mismo
 * tiempo nunca terminan con el mismo número.
 */
export async function assignReceiptNumber(businessId: string, db: DbClient = prisma): Promise<number> {
  const business = await db.business.update({
    where: { id: businessId },
    data: { nextReceiptNumber: { increment: 1 } },
    select: { nextReceiptNumber: true },
  });
  return business.nextReceiptNumber - 1;
}
