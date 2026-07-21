"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requireOwner } from "@/lib/guard";
import { createSession } from "@/lib/session";
import { BUSINESS_CATEGORIES } from "@/lib/vocabulary";

const DIACRITICS_REGEX = new RegExp("[\\u0300-\\u036f]", "g");

function slugify(input: string): string {
  return input
    .toLowerCase()
    .normalize("NFD")
    .replace(DIACRITICS_REGEX, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

/** El dueño agrega otra sucursal bajo la misma organización. */
export async function createLocation(formData: FormData) {
  const session = await requireOwner();
  const name = String(formData.get("name") ?? "").trim();
  const address = String(formData.get("address") ?? "").trim();
  const categoryInput = String(formData.get("category") ?? "BARBERSHOP");
  const category = (BUSINESS_CATEGORIES as readonly string[]).includes(categoryInput)
    ? categoryInput
    : "BARBERSHOP";

  if (!name) redirect("/dashboard/locations?error=NOMBRE_REQUERIDO");

  let slug = slugify(name) || "sucursal";
  let attempt = 0;
  while (await prisma.business.findUnique({ where: { slug } })) {
    attempt += 1;
    slug = `${slugify(name)}-${attempt + 1}`;
  }

  await prisma.business.create({
    data: {
      organizationId: session.organizationId,
      name,
      slug,
      category,
      address: address || null,
    },
  });

  revalidatePath("/dashboard/locations");
  redirect("/dashboard/locations");
}

/** El dueño cambia cuál sucursal está administrando en esta sesión. */
export async function switchLocation(businessId: string) {
  const session = await requireOwner();

  const target = await prisma.business.findFirst({
    where: { id: businessId, organizationId: session.organizationId },
  });
  if (!target) return;

  await createSession({
    userId: session.userId,
    organizationId: session.organizationId,
    businessId: target.id,
    businessSlug: target.slug,
    role: session.role,
  });

  redirect("/dashboard");
}
