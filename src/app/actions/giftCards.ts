"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requirePermission, requireSession } from "@/lib/guard";
import { sendWhatsAppMessage } from "@/lib/notifications";
import { logAudit } from "@/lib/audit";
import { checkRateLimit, getClientIp } from "@/lib/rateLimit";
import { formatCOP } from "@/lib/money";

// Sin 0/O/1/I — para que se pueda leer y transcribir por WhatsApp/teléfono sin confusión.
const CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

function randomCode(length = 8): string {
  let code = "";
  for (let i = 0; i < length; i++) {
    code += CODE_ALPHABET[Math.floor(Math.random() * CODE_ALPHABET.length)];
  }
  return code;
}

async function generateGiftCardCode(): Promise<string> {
  let code = randomCode();
  while (await prisma.giftCard.findUnique({ where: { code } })) {
    code = randomCode();
  }
  return code;
}

async function requireGiftCardsEnabled(businessId: string) {
  const business = await prisma.business.findUnique({ where: { id: businessId } });
  if (!business?.giftCardsEnabled) redirect("/dashboard");
  return business;
}

function parseExpiresAt(formData: FormData): Date | null {
  const raw = String(formData.get("expiresAt") ?? "").trim();
  return raw ? new Date(`${raw}T23:59:59`) : null;
}

export async function issueGiftCard(formData: FormData) {
  const session = await requirePermission("catalog");
  await requireGiftCardsEnabled(session.businessId);

  const amount = Number(formData.get("amount") ?? NaN);
  if (!Number.isFinite(amount) || amount <= 0) {
    redirect("/dashboard/gift-cards?error=MONTO_INVALIDO");
  }

  const recipientName = String(formData.get("recipientName") ?? "").trim() || null;
  const recipientPhone = String(formData.get("recipientPhone") ?? "").trim() || null;
  const purchaserName = String(formData.get("purchaserName") ?? "").trim() || null;
  const purchaserPhone = String(formData.get("purchaserPhone") ?? "").trim() || null;
  const paymentMethodInput = String(formData.get("paymentMethod") ?? "CASH");
  const paymentMethod = ["CASH", "CARD_IN_PERSON"].includes(paymentMethodInput) ? paymentMethodInput : "CASH";
  const expiresAt = parseExpiresAt(formData);

  const code = await generateGiftCardCode();
  await prisma.giftCard.create({
    data: {
      businessId: session.businessId,
      code,
      initialAmount: amount,
      balance: amount,
      recipientName,
      recipientPhone,
      purchaserName,
      purchaserPhone,
      expiresAt,
      status: "ACTIVE",
      paymentMethod,
      issuedByUserId: session.userId,
      confirmedAt: new Date(),
    },
  });

  await logAudit(session, "giftcard.issued", `${code}: ${formatCOP(amount)}`);

  revalidatePath("/dashboard/gift-cards");
  redirect("/dashboard/gift-cards");
}

export async function cancelGiftCard(cardId: string) {
  const session = await requirePermission("catalog");
  const card = await prisma.giftCard.findFirst({ where: { id: cardId, businessId: session.businessId } });
  if (!card || card.status !== "ACTIVE") return;
  if (card.balance !== card.initialAmount) {
    redirect("/dashboard/gift-cards?error=TARJETA_YA_USADA");
  }

  await prisma.giftCard.update({ where: { id: cardId }, data: { status: "CANCELLED" } });
  await logAudit(session, "giftcard.cancelled", card.code);
  revalidatePath("/dashboard/gift-cards");
}

export async function confirmGiftCardPayment(cardId: string) {
  const session = await requirePermission("catalog");
  const card = await prisma.giftCard.findFirst({
    where: { id: cardId, businessId: session.businessId, status: "PENDING_PAYMENT" },
    include: { business: true },
  });
  if (!card) return;

  await prisma.giftCard.update({
    where: { id: cardId },
    data: { status: "ACTIVE", confirmedAt: new Date(), paymentMethod: "TRANSFER" },
  });

  const notifyPhone = card.purchaserPhone ?? card.recipientPhone;
  if (notifyPhone) {
    await sendWhatsAppMessage(
      notifyPhone,
      `¡Gracias! Confirmamos tu pago de la tarjeta de regalo de ${card.business.name} por ${formatCOP(card.initialAmount)}. Tu código es: ${card.code}`
    );
  }

  await logAudit(session, "giftcard.confirmed", `${card.code}: ${formatCOP(card.initialAmount)}`);

  revalidatePath("/dashboard/gift-cards");
}

export async function rejectGiftCardPayment(cardId: string) {
  const session = await requirePermission("catalog");
  const card = await prisma.giftCard.findFirst({
    where: { id: cardId, businessId: session.businessId, status: "PENDING_PAYMENT" },
    include: { business: true },
  });
  if (!card) return;

  await prisma.giftCard.update({ where: { id: cardId }, data: { status: "CANCELLED" } });

  const notifyPhone = card.purchaserPhone ?? card.recipientPhone;
  if (notifyPhone) {
    await sendWhatsAppMessage(
      notifyPhone,
      `Hola, no pudimos confirmar tu pago de la tarjeta de regalo de ${card.business.name}. Si fue un error, escríbenos o intenta comprarla de nuevo.`
    );
  }

  await logAudit(session, "giftcard.rejected", card.code);

  revalidatePath("/dashboard/gift-cards");
}

/** Compra pública: sin sesión, el cliente ve el QR/cuenta del negocio y manda comprobante por WhatsApp. */
export async function purchaseGiftCardOnline(formData: FormData) {
  const businessSlug = String(formData.get("businessSlug") ?? "");
  const website = String(formData.get("website") ?? "").trim(); // honeypot

  if (website !== "") {
    redirect(`/regalo/${businessSlug}?error=DATOS_INVALIDOS`);
  }

  const business = await prisma.business.findUnique({ where: { slug: businessSlug } });
  if (!business || !business.giftCardsEnabled) {
    redirect(`/regalo/${businessSlug}?error=NO_DISPONIBLE`);
  }

  const amount = Number(formData.get("amount") ?? NaN);
  const purchaserName = String(formData.get("purchaserName") ?? "").trim();
  const purchaserPhone = String(formData.get("purchaserPhone") ?? "").trim();
  const purchaserEmail = String(formData.get("purchaserEmail") ?? "").trim();
  const recipientName = String(formData.get("recipientName") ?? "").trim();
  const recipientPhone = String(formData.get("recipientPhone") ?? "").trim();

  if (!Number.isFinite(amount) || amount <= 0 || !purchaserName || !purchaserPhone) {
    redirect(`/regalo/${businessSlug}?error=DATOS_INVALIDOS`);
  }

  const ip = await getClientIp();
  if (
    !checkRateLimit(`giftcard:phone:${purchaserPhone}`, 5, 10 * 60 * 1000) ||
    !checkRateLimit(`giftcard:ip:${ip}`, 20, 10 * 60 * 1000)
  ) {
    redirect(`/regalo/${businessSlug}?error=DEMASIADOS_INTENTOS`);
  }

  const expiresAt = parseExpiresAt(formData);
  const code = await generateGiftCardCode();

  const card = await prisma.giftCard.create({
    data: {
      businessId: business.id,
      code,
      initialAmount: amount,
      balance: amount,
      recipientName: recipientName || null,
      recipientPhone: recipientPhone || null,
      purchaserName,
      purchaserPhone,
      purchaserEmail: purchaserEmail || null,
      expiresAt,
      status: "PENDING_PAYMENT",
    },
  });

  if (business.phone) {
    await sendWhatsAppMessage(
      business.phone,
      `Nueva compra de tarjeta de regalo: ${purchaserName} pidió una de ${formatCOP(amount)}. Confírmala desde el panel cuando recibas el comprobante.`
    );
  }

  redirect(`/regalo/tarjeta/${card.id}`);
}

export type GiftCardResolution =
  | { ok: true; giftCardId: string; amount: number }
  | { ok: false; error: "TARJETA_INVALIDA" | "TARJETA_VENCIDA" | "TARJETA_SIN_SALDO" };

/**
 * Valida un código de tarjeta de regalo contra un total a cobrar y devuelve
 * cuánto se puede redimir (nunca más del saldo ni del total) — reutilizado
 * por sellProduct y sellStoreItem, que la aplican dentro de su propia
 * transacción de venta en vez de como un paso aparte.
 */
export async function resolveGiftCardRedemption(
  businessId: string,
  code: string,
  total: number
): Promise<GiftCardResolution> {
  const card = await prisma.giftCard.findFirst({ where: { code, businessId } });
  if (!card || card.status !== "ACTIVE") return { ok: false, error: "TARJETA_INVALIDA" };
  if (card.expiresAt && card.expiresAt < new Date()) return { ok: false, error: "TARJETA_VENCIDA" };
  if (card.balance <= 0) return { ok: false, error: "TARJETA_SIN_SALDO" };

  return { ok: true, giftCardId: card.id, amount: Math.min(card.balance, total) };
}

export async function redeemGiftCardForAppointment(appointmentId: string, formData: FormData) {
  const session = await requireSession();
  await requireGiftCardsEnabled(session.businessId);

  const appt = await prisma.appointment.findFirst({
    where: { id: appointmentId, businessId: session.businessId },
    include: { service: true },
  });
  if (!appt) redirect("/dashboard/appointments?error=NO_ENCONTRADO");
  if (appt!.giftCardCode) redirect("/dashboard/appointments?error=TARJETA_YA_APLICADA");

  const code = String(formData.get("giftCardCode") ?? "").trim().toUpperCase();
  if (!code) redirect("/dashboard/appointments?error=CODIGO_REQUERIDO");

  const total = appt!.priceCharged ?? appt!.service.price;
  const alreadyCovered = appt!.depositAmount ?? 0;
  const remaining = Math.max(0, total - alreadyCovered);

  const resolution = await resolveGiftCardRedemption(session.businessId, code, remaining);
  if (!resolution.ok) redirect(`/dashboard/appointments?error=${resolution.error}`);
  if (resolution.amount <= 0) redirect("/dashboard/appointments?error=NADA_QUE_REDIMIR");

  await prisma.$transaction([
    prisma.giftCard.update({ where: { id: resolution.giftCardId }, data: { balance: { decrement: resolution.amount } } }),
    prisma.appointment.update({
      where: { id: appointmentId },
      data: { giftCardCode: code, giftCardRedeemed: resolution.amount },
    }),
  ]);

  revalidatePath("/dashboard/appointments");
  redirect("/dashboard/appointments");
}
