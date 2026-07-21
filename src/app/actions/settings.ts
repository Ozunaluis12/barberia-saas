"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requirePermission } from "@/lib/guard";
import { BUSINESS_CATEGORIES } from "@/lib/vocabulary";

export async function updateBusinessSettings(formData: FormData) {
  const session = await requirePermission("settings");
  const phone = String(formData.get("phone") ?? "").trim();
  const address = String(formData.get("address") ?? "").trim();
  const cancellationNoticeHours = Math.max(0, Number(formData.get("cancellationNoticeHours") ?? 3));
  const categoryInput = String(formData.get("category") ?? "BARBERSHOP");
  const category = (BUSINESS_CATEGORIES as readonly string[]).includes(categoryInput)
    ? categoryInput
    : "BARBERSHOP";
  const reminderChannelInput = String(formData.get("reminderChannel") ?? "NONE");
  const reminderChannel = ["NONE", "EMAIL", "SMS", "WHATSAPP"].includes(reminderChannelInput)
    ? reminderChannelInput
    : "NONE";
  const reminderHoursBefore = Math.max(1, Number(formData.get("reminderHoursBefore") ?? 24));
  const loyaltyEnabled = formData.get("loyaltyEnabled") === "on";
  const loyaltyPointsPerVisit = Math.max(1, Number(formData.get("loyaltyPointsPerVisit") ?? 1));
  const loyaltyRewardThreshold = Math.max(1, Number(formData.get("loyaltyRewardThreshold") ?? 10));

  await prisma.business.update({
    where: { id: session.businessId },
    data: {
      phone: phone || null,
      address: address || null,
      cancellationNoticeHours,
      category,
      reminderChannel,
      reminderHoursBefore,
      loyaltyEnabled,
      loyaltyPointsPerVisit,
      loyaltyRewardThreshold,
    },
  });

  revalidatePath("/dashboard/settings");
}
