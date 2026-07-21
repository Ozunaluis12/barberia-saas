"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requirePermission } from "@/lib/guard";
import { uploadImage } from "@/lib/images";

type ParsedProduct =
  | { error: "NOMBRE_REQUERIDO" | "PRECIO_INVALIDO" }
  | { data: { name: string; description: string | null; price: number } };

function parseProductInput(formData: FormData): ParsedProduct {
  const name = String(formData.get("name") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const price = Number(formData.get("price") ?? NaN);

  if (!name) return { error: "NOMBRE_REQUERIDO" };
  if (!Number.isFinite(price) || price < 0) return { error: "PRECIO_INVALIDO" };

  return { data: { name, description: description || null, price } };
}

export async function createProduct(formData: FormData) {
  const session = await requirePermission("catalog");
  const parsed = parseProductInput(formData);
  if ("error" in parsed) redirect(`/dashboard/catalog?error=${parsed.error}`);

  const photo = formData.get("photo");
  const imageUrl = photo instanceof File ? await uploadImage(photo, "products") : null;

  await prisma.product.create({ data: { businessId: session.businessId, imageUrl, ...parsed.data } });
  revalidatePath("/dashboard/catalog");
  redirect("/dashboard/catalog");
}

export async function updateProduct(productId: string, formData: FormData) {
  const session = await requirePermission("catalog");
  const product = await prisma.product.findFirst({ where: { id: productId, businessId: session.businessId } });
  if (!product) redirect("/dashboard/catalog?error=NO_ENCONTRADO");

  const parsed = parseProductInput(formData);
  if ("error" in parsed) redirect(`/dashboard/catalog/${productId}?error=${parsed.error}`);

  const photo = formData.get("photo");
  const uploadedUrl = photo instanceof File ? await uploadImage(photo, "products") : null;
  const imageUrl = uploadedUrl ?? product!.imageUrl;

  await prisma.product.update({ where: { id: productId }, data: { imageUrl, ...parsed.data } });
  revalidatePath("/dashboard/catalog");
  redirect("/dashboard/catalog");
}

export async function toggleProductActive(productId: string) {
  const session = await requirePermission("catalog");
  const product = await prisma.product.findFirst({ where: { id: productId, businessId: session.businessId } });
  if (!product) return;
  await prisma.product.update({ where: { id: productId }, data: { active: !product.active } });
  revalidatePath("/dashboard/catalog");
}
