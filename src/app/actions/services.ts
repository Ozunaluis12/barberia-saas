"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requireSession } from "@/lib/guard";

export async function createService(formData: FormData) {
  const session = await requireSession();
  const name = String(formData.get("name") ?? "").trim();
  const durationMinutes = Number(formData.get("durationMinutes") ?? 30);
  const price = Number(formData.get("price") ?? 0);

  if (!name || durationMinutes <= 0 || price < 0) return;

  await prisma.service.create({
    data: { businessId: session.businessId, name, durationMinutes, price },
  });

  revalidatePath("/dashboard/services");
}

export async function toggleServiceActive(serviceId: string) {
  const session = await requireSession();
  const service = await prisma.service.findFirst({ where: { id: serviceId, businessId: session.businessId } });
  if (!service) return;
  await prisma.service.update({ where: { id: serviceId }, data: { active: !service.active } });
  revalidatePath("/dashboard/services");
}
