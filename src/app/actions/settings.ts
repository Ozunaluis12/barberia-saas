"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requireSession } from "@/lib/guard";

export async function updateShopSettings(formData: FormData) {
  const session = await requireSession();
  const phone = String(formData.get("phone") ?? "").trim();
  const address = String(formData.get("address") ?? "").trim();
  const cancellationNoticeHours = Math.max(0, Number(formData.get("cancellationNoticeHours") ?? 3));

  await prisma.shop.update({
    where: { id: session.shopId },
    data: {
      phone: phone || null,
      address: address || null,
      cancellationNoticeHours,
    },
  });

  revalidatePath("/dashboard/settings");
}
