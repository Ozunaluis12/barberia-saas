import { prisma } from "@/lib/db";

/**
 * Deja solo dígitos para que "555-0101", "(555) 0101" y "5550101" se traten
 * como el mismo cliente. Si no parece un teléfono real (ej. el placeholder
 * "N/A" de un walk-in sin teléfono), lo deja tal cual para no forzar de más.
 */
function normalizePhone(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  return digits.length >= 7 ? digits : phone.trim();
}

export async function findOrCreateClient(businessId: string, name: string, phone: string) {
  const cleanPhone = normalizePhone(phone);
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
