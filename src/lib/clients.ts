import { prisma } from "@/lib/db";

export async function findOrCreateClient(businessId: string, name: string, phone: string) {
  const cleanPhone = phone.trim();
  return prisma.client.upsert({
    where: { businessId_phone: { businessId, phone: cleanPhone } },
    update: { name: name.trim() },
    create: { businessId, name: name.trim(), phone: cleanPhone },
  });
}

/** No-show o cancelación tardía: ambas cuentan como sanción para el cliente. */
export async function applyClientStrike(clientId: string) {
  await prisma.client.update({
    where: { id: clientId },
    data: { strikes: { increment: 1 } },
  });
}
