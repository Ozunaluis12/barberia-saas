import { prisma } from "@/lib/db";

export async function findOrCreateClient(shopId: string, name: string, phone: string) {
  const cleanPhone = phone.trim();
  return prisma.client.upsert({
    where: { shopId_phone: { shopId, phone: cleanPhone } },
    update: { name: name.trim() },
    create: { shopId, name: name.trim(), phone: cleanPhone },
  });
}
