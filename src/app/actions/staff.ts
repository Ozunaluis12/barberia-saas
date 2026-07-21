"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requirePermission } from "@/lib/guard";

type ParsedStaff =
  | { error: "NOMBRE_REQUERIDO" | "COMISION_INVALIDA" | "HORARIO_INVALIDO" }
  | {
      data: {
        name: string;
        commissionPercent: number | null;
        workStart: string;
        workEnd: string;
        workDays: string;
      };
    };

function parseStaffInput(formData: FormData): ParsedStaff {
  const name = String(formData.get("name") ?? "").trim();
  const commissionInput = String(formData.get("commissionPercent") ?? "").trim();
  const workStart = String(formData.get("workStart") ?? "09:00");
  const workEnd = String(formData.get("workEnd") ?? "19:00");
  const workDays = formData.getAll("workDays").map(String).join(",") || "1,2,3,4,5,6";

  if (!name) return { error: "NOMBRE_REQUERIDO" };

  let commissionPercent: number | null = null;
  if (commissionInput !== "") {
    const parsed = Number(commissionInput);
    if (!Number.isFinite(parsed) || parsed < 0 || parsed > 100) {
      return { error: "COMISION_INVALIDA" };
    }
    commissionPercent = parsed;
  }

  if (!/^\d{2}:\d{2}$/.test(workStart) || !/^\d{2}:\d{2}$/.test(workEnd) || workStart >= workEnd) {
    return { error: "HORARIO_INVALIDO" };
  }

  return { data: { name, commissionPercent, workStart, workEnd, workDays } };
}

export async function createStaff(formData: FormData) {
  const session = await requirePermission("staff");
  const parsed = parseStaffInput(formData);
  if ("error" in parsed) redirect(`/dashboard/staff?error=${parsed.error}`);

  await prisma.staff.create({ data: { businessId: session.businessId, ...parsed.data } });
  revalidatePath("/dashboard/staff");
  redirect("/dashboard/staff");
}

export async function updateStaff(staffId: string, formData: FormData) {
  const session = await requirePermission("staff");
  const staff = await prisma.staff.findFirst({ where: { id: staffId, businessId: session.businessId } });
  if (!staff) redirect("/dashboard/staff?error=NO_ENCONTRADO");

  const parsed = parseStaffInput(formData);
  if ("error" in parsed) redirect(`/dashboard/staff/${staffId}?error=${parsed.error}`);

  await prisma.staff.update({ where: { id: staffId }, data: parsed.data });
  revalidatePath("/dashboard/staff");
  redirect("/dashboard/staff");
}

export async function toggleStaffActive(staffId: string) {
  const session = await requirePermission("staff");
  const staff = await prisma.staff.findFirst({ where: { id: staffId, businessId: session.businessId } });
  if (!staff) return;
  await prisma.staff.update({ where: { id: staffId }, data: { active: !staff.active } });
  revalidatePath("/dashboard/staff");
}
