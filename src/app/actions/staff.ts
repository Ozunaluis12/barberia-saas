"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requireSession } from "@/lib/guard";

export async function createStaff(formData: FormData) {
  const session = await requireSession();
  const name = String(formData.get("name") ?? "").trim();
  const commissionInput = String(formData.get("commissionPercent") ?? "").trim();
  const commissionPercent = commissionInput === "" ? null : Number(commissionInput);
  const workStart = String(formData.get("workStart") ?? "09:00");
  const workEnd = String(formData.get("workEnd") ?? "19:00");
  const workDays = formData.getAll("workDays").map(String).join(",") || "1,2,3,4,5,6";

  if (!name) return;

  await prisma.staff.create({
    data: {
      businessId: session.businessId,
      name,
      commissionPercent,
      workStart,
      workEnd,
      workDays,
    },
  });

  revalidatePath("/dashboard/staff");
}

export async function toggleStaffActive(staffId: string) {
  const session = await requireSession();
  const staff = await prisma.staff.findFirst({ where: { id: staffId, businessId: session.businessId } });
  if (!staff) return;
  await prisma.staff.update({ where: { id: staffId }, data: { active: !staff.active } });
  revalidatePath("/dashboard/staff");
}
