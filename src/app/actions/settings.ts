"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requirePermission, requireSession } from "@/lib/guard";
import { BUSINESS_CATEGORIES } from "@/lib/vocabulary";
import { uploadImage } from "@/lib/images";
import { logAudit } from "@/lib/audit";

export async function updateBusinessSettings(formData: FormData) {
  const session = await requirePermission("settings");
  const phone = String(formData.get("phone") ?? "").trim();
  const address = String(formData.get("address") ?? "").trim();
  const cancellationNoticeHours = Math.max(0, Number(formData.get("cancellationNoticeHours") ?? 3));
  const categoryInput = String(formData.get("category") ?? "BARBERSHOP");
  const category = (BUSINESS_CATEGORIES as readonly string[]).includes(categoryInput)
    ? categoryInput
    : "BARBERSHOP";
  const VALID_REMINDER_CHANNELS = ["EMAIL", "SMS", "WHATSAPP"];
  const reminderChannels = formData
    .getAll("reminderChannels")
    .map(String)
    .filter((c) => VALID_REMINDER_CHANNELS.includes(c))
    .join(",");
  const reminderHoursBefore = Math.max(1, Number(formData.get("reminderHoursBefore") ?? 24));
  const loyaltyEnabled = formData.get("loyaltyEnabled") === "on";
  const loyaltyPointsPerVisit = Math.max(1, Number(formData.get("loyaltyPointsPerVisit") ?? 1));
  const loyaltyRewardThreshold = Math.max(1, Number(formData.get("loyaltyRewardThreshold") ?? 10));
  const referralBonusPoints = Math.max(0, Number(formData.get("referralBonusPoints") ?? 0));
  const cashDiscrepancyAlertThreshold = Math.max(
    0,
    Number(formData.get("cashDiscrepancyAlertThreshold") ?? 5)
  );

  const advancePaymentEnabled = formData.get("advancePaymentEnabled") === "on";
  const advancePaymentAmountInput = String(formData.get("advancePaymentAmount") ?? "").trim();
  const advancePaymentAmount = advancePaymentAmountInput === "" ? null : Math.max(0, Number(advancePaymentAmountInput));
  const advancePaymentExpirationHours = Math.max(1, Number(formData.get("advancePaymentExpirationHours") ?? 2));
  const paymentBrebKey = String(formData.get("paymentBrebKey") ?? "").trim();
  const paymentAccountInfo = String(formData.get("paymentAccountInfo") ?? "").trim();

  const business = await prisma.business.findUnique({ where: { id: session.businessId } });
  const qrPhoto = formData.get("paymentQr");
  const uploadedQrUrl = qrPhoto instanceof File ? await uploadImage(qrPhoto, "payment-qr") : null;
  const paymentQrUrl = uploadedQrUrl ?? business?.paymentQrUrl ?? null;

  if (advancePaymentEnabled && !paymentQrUrl && !paymentBrebKey && !paymentAccountInfo) {
    redirect("/dashboard/settings?error=DATOS_PAGO_REQUERIDOS");
  }

  await prisma.business.update({
    where: { id: session.businessId },
    data: {
      phone: phone || null,
      address: address || null,
      cancellationNoticeHours,
      category,
      reminderChannels,
      reminderHoursBefore,
      loyaltyEnabled,
      loyaltyPointsPerVisit,
      loyaltyRewardThreshold,
      referralBonusPoints,
      cashDiscrepancyAlertThreshold,
      advancePaymentEnabled,
      advancePaymentAmount,
      advancePaymentExpirationHours,
      paymentQrUrl,
      paymentBrebKey: paymentBrebKey || null,
      paymentAccountInfo: paymentAccountInfo || null,
    },
  });

  await logAudit(session, "settings.update");

  revalidatePath("/dashboard/settings");
}

export async function dismissOnboarding() {
  const session = await requireSession();
  await prisma.business.update({ where: { id: session.businessId }, data: { onboardingDismissed: true } });
  revalidatePath("/dashboard");
}
