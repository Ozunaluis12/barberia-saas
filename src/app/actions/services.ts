"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requirePermission } from "@/lib/guard";
import { uploadImage } from "@/lib/images";

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
  const session = await requirePermission("catalog");
  const parsed = parseServiceInput(formData);
  if ("error" in parsed) redirect(`/dashboard/services?error=${parsed.error}`);

  const photo = formData.get("photo");
  const imageUrl = photo instanceof File ? await uploadImage(photo, "services") : null;

  await prisma.service.create({ data: { businessId: session.businessId, imageUrl, ...parsed.data } });
  revalidatePath("/dashboard/services");
  redirect("/dashboard/services");
}

export async function updateService(serviceId: string, formData: FormData) {
  const session = await requirePermission("catalog");
  const service = await prisma.service.findFirst({ where: { id: serviceId, businessId: session.businessId } });
  if (!service) redirect("/dashboard/services?error=NO_ENCONTRADO");

  const parsed = parseServiceInput(formData);
  if ("error" in parsed) redirect(`/dashboard/services/${serviceId}?error=${parsed.error}`);

  const photo = formData.get("photo");
  const uploadedUrl = photo instanceof File ? await uploadImage(photo, "services") : null;
  const imageUrl = uploadedUrl ?? service!.imageUrl;

  await prisma.service.update({ where: { id: serviceId }, data: { imageUrl, ...parsed.data } });
  revalidatePath("/dashboard/services");
  redirect("/dashboard/services");
}

export async function toggleServiceActive(serviceId: string) {
  const session = await requirePermission("catalog");
  const service = await prisma.service.findFirst({ where: { id: serviceId, businessId: session.businessId } });
  if (!service) return;
  await prisma.service.update({ where: { id: serviceId }, data: { active: !service.active } });
  revalidatePath("/dashboard/services");
}
