"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requireOwner } from "@/lib/guard";

type ParsedService =
  | { error: "NOMBRE_REQUERIDO" | "DURACION_INVALIDA" | "PRECIO_INVALIDO" }
  | { data: { name: string; description: string | null; durationMinutes: number; price: number } };

function parseServiceInput(formData: FormData): ParsedService {
  const name = String(formData.get("name") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const durationMinutes = Number(formData.get("durationMinutes") ?? NaN);
  const price = Number(formData.get("price") ?? NaN);

  if (!name) return { error: "NOMBRE_REQUERIDO" };
  if (!Number.isFinite(durationMinutes) || durationMinutes <= 0) {
    return { error: "DURACION_INVALIDA" };
  }
  if (!Number.isFinite(price) || price < 0) return { error: "PRECIO_INVALIDO" };

  return { data: { name, description: description || null, durationMinutes, price } };
}

export async function createService(formData: FormData) {
  const session = await requireOwner();
  const parsed = parseServiceInput(formData);
  if ("error" in parsed) redirect(`/dashboard/catalog?error=${parsed.error}`);

  await prisma.service.create({ data: { businessId: session.businessId, ...parsed.data } });
  revalidatePath("/dashboard/catalog");
  redirect("/dashboard/catalog");
}

export async function updateService(serviceId: string, formData: FormData) {
  const session = await requireOwner();
  const service = await prisma.service.findFirst({ where: { id: serviceId, businessId: session.businessId } });
  if (!service) redirect("/dashboard/catalog?error=NO_ENCONTRADO");

  const parsed = parseServiceInput(formData);
  if ("error" in parsed) redirect(`/dashboard/catalog/service/${serviceId}?error=${parsed.error}`);

  await prisma.service.update({ where: { id: serviceId }, data: parsed.data });
  revalidatePath("/dashboard/catalog");
  redirect("/dashboard/catalog");
}

export async function toggleServiceActive(serviceId: string) {
  const session = await requireOwner();
  const service = await prisma.service.findFirst({ where: { id: serviceId, businessId: session.businessId } });
  if (!service) return;
  await prisma.service.update({ where: { id: serviceId }, data: { active: !service.active } });
  revalidatePath("/dashboard/catalog");
}
