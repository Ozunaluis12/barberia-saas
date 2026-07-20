"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requireOwner } from "@/lib/guard";
import { BUSINESS_CATEGORIES } from "@/lib/vocabulary";

export async function updateBusinessSettings(formData: FormData) {
  const session = await requireOwner();
  const phone = String(formData.get("phone") ?? "").trim();
  const address = String(formData.get("address") ?? "").trim();
  const cancellationNoticeHours = Math.max(0, Number(formData.get("cancellationNoticeHours") ?? 3));
  const categoryInput = String(formData.get("category") ?? "OTHER");
  const category = (BUSINESS_CATEGORIES as readonly string[]).includes(categoryInput)
    ? categoryInput
    : "OTHER";
  const reminderChannelInput = String(formData.get("reminderChannel") ?? "NONE");
  const reminderChannel = ["NONE", "EMAIL", "SMS", "WHATSAPP"].includes(reminderChannelInput)
    ? reminderChannelInput
    : "NONE";
  const reminderHoursBefore = Math.max(1, Number(formData.get("reminderHoursBefore") ?? 24));

  await prisma.business.update({
    where: { id: session.businessId },
    data: {
      phone: phone || null,
      address: address || null,
      cancellationNoticeHours,
      category,
      reminderChannel,
      reminderHoursBefore,
    },
  });

  revalidatePath("/dashboard/settings");
}
