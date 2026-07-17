"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requireSession } from "@/lib/guard";

export async function createBarber(formData: FormData) {
  const session = await requireSession();
  const name = String(formData.get("name") ?? "").trim();
  const commissionPercent = Number(formData.get("commissionPercent") ?? 50);
  const workStart = String(formData.get("workStart") ?? "09:00");
  const workEnd = String(formData.get("workEnd") ?? "19:00");
  const workDays = formData.getAll("workDays").map(String).join(",") || "1,2,3,4,5,6";

  if (!name) return;

  await prisma.barber.create({
    data: {
      shopId: session.shopId,
      name,
      commissionPercent,
      workStart,
      workEnd,
      workDays,
    },
  });

  revalidatePath("/dashboard/barbers");
}

export async function toggleBarberActive(barberId: string) {
  const session = await requireSession();
  const barber = await prisma.barber.findFirst({ where: { id: barberId, shopId: session.shopId } });
  if (!barber) return;
  await prisma.barber.update({ where: { id: barberId }, data: { active: !barber.active } });
  revalidatePath("/dashboard/barbers");
}
