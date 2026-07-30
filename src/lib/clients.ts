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

function randomReferralCode(): string {
  return Math.random().toString(36).slice(2, 8).toUpperCase();
}

async function generateUniqueReferralCode(): Promise<string> {
  let code = randomReferralCode();
  while (await prisma.client.findUnique({ where: { referralCode: code } })) {
    code = randomReferralCode();
  }
  return code;
}

export async function findOrCreateClient(
  organizationId: string,
  name: string,
  phone: string,
  email?: string,
  referral?: {
    code?: string;
    business?: { loyaltyEnabled: boolean; referralBonusPoints: number };
  }
) {
  const cleanPhone = normalizePhone(phone);
  const existing = await prisma.client.findUnique({
    where: { organizationId_phone: { organizationId, phone: cleanPhone } },
  });
  if (existing) {
    return prisma.client.update({
      where: { id: existing.id },
      data: { name: name.trim(), ...(email?.trim() ? { email: email.trim() } : {}) },
    });
  }

  // El crédito de referido solo aplica en la PRIMERA reserva de un cliente nuevo.
  let referredById: string | null = null;
  if (referral?.code) {
    const referrer = await prisma.client.findFirst({
      where: { organizationId, referralCode: referral.code.trim().toUpperCase() },
    });
    if (referrer) {
      referredById = referrer.id;
      if (referral.business?.loyaltyEnabled && referral.business.referralBonusPoints > 0) {
        await prisma.client.update({
          where: { id: referrer.id },
          data: { loyaltyPoints: { increment: referral.business.referralBonusPoints } },
        });
      }
    }
  }

  return prisma.client.create({
    data: {
      organizationId,
      name: name.trim(),
      phone: cleanPhone,
      email: email?.trim() || null,
      referralCode: await generateUniqueReferralCode(),
      referredById,
    },
  });
}

/** No-show o cancelación tardía: ambas cuentan como sanción para el cliente. */
export async function applyClientStrike(clientId: string) {
  await prisma.client.update({
    where: { id: clientId },
    data: { strikes: { increment: 1 } },
  });
}
