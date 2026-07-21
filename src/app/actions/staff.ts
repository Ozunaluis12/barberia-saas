"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requirePermission } from "@/lib/guard";
import { uploadImage } from "@/lib/images";

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

  const photo = formData.get("photo");
  const photoUrl = photo instanceof File ? await uploadImage(photo, "staff") : null;

  await prisma.staff.create({ data: { businessId: session.businessId, photoUrl, ...parsed.data } });
  revalidatePath("/dashboard/staff");
  redirect("/dashboard/staff");
}

export async function updateStaff(staffId: string, formData: FormData) {
  const session = await requirePermission("staff");
  const staff = await prisma.staff.findFirst({ where: { id: staffId, businessId: session.businessId } });
  if (!staff) redirect("/dashboard/staff?error=NO_ENCONTRADO");

  const parsed = parseStaffInput(formData);
  if ("error" in parsed) redirect(`/dashboard/staff/${staffId}?error=${parsed.error}`);

  const photo = formData.get("photo");
  const uploadedUrl = photo instanceof File ? await uploadImage(photo, "staff") : null;
  const photoUrl = uploadedUrl ?? staff!.photoUrl;

  await prisma.staff.update({ where: { id: staffId }, data: { photoUrl, ...parsed.data } });
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

export async function addStaffTimeOff(staffId: string, formData: FormData) {
  const session = await requirePermission("staff");
  const staff = await prisma.staff.findFirst({ where: { id: staffId, businessId: session.businessId } });
  if (!staff) redirect("/dashboard/staff?error=NO_ENCONTRADO");

  const startDate = String(formData.get("startDate") ?? "");
  const endDate = String(formData.get("endDate") ?? "");
  const reason = String(formData.get("reason") ?? "").trim() || null;

  if (!startDate || !endDate || startDate > endDate) {
    redirect(`/dashboard/staff/${staffId}?error=RANGO_INVALIDO`);
  }

  await prisma.staffTimeOff.create({
    data: {
      staffId,
      startDate: new Date(`${startDate}T00:00:00`),
      endDate: new Date(`${endDate}T23:59:59`),
      reason,
    },
  });
  revalidatePath(`/dashboard/staff/${staffId}`);
  redirect(`/dashboard/staff/${staffId}`);
}

export async function removeStaffTimeOff(timeOffId: string) {
  const session = await requirePermission("staff");
  const timeOff = await prisma.staffTimeOff.findFirst({
    where: { id: timeOffId, staff: { businessId: session.businessId } },
  });
  if (!timeOff) return;
  await prisma.staffTimeOff.delete({ where: { id: timeOffId } });
  revalidatePath(`/dashboard/staff/${timeOff.staffId}`);
}
