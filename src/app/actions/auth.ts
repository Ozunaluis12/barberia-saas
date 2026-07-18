"use server";

import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { hashPassword, verifyPassword } from "@/lib/auth";
import { createSession, clearSession } from "@/lib/session";
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

export async function signupAction(formData: FormData) {
  const businessName = String(formData.get("businessName") ?? "").trim();
  const ownerName = String(formData.get("ownerName") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");
  const categoryInput = String(formData.get("category") ?? "OTHER");
  const category = (BUSINESS_CATEGORIES as readonly string[]).includes(categoryInput)
    ? categoryInput
    : "OTHER";

  if (!businessName || !ownerName || !email || password.length < 6) {
    redirect("/signup?error=DATOS_INVALIDOS");
  }

  const existingUser = await prisma.user.findUnique({ where: { email } });
  if (existingUser) {
    redirect("/signup?error=EMAIL_EN_USO");
  }

  let slug = slugify(businessName) || "negocio";
  let attempt = 0;
  while (await prisma.business.findUnique({ where: { slug } })) {
    attempt += 1;
    slug = `${slugify(businessName)}-${attempt + 1}`;
  }

  const passwordHash = await hashPassword(password);

  const business = await prisma.business.create({
    data: {
      name: businessName,
      slug,
      category,
      users: {
        create: {
          name: ownerName,
          email,
          passwordHash,
          role: "OWNER",
        },
      },
    },
    include: { users: true },
  });

  const user = business.users[0];
  await createSession({
    userId: user.id,
    businessId: business.id,
    businessSlug: business.slug,
    role: user.role,
  });
  redirect("/dashboard");
}

export async function loginAction(formData: FormData) {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");

  const user = await prisma.user.findUnique({ where: { email }, include: { business: true } });
  if (!user || !(await verifyPassword(password, user.passwordHash))) {
    redirect("/login?error=CREDENCIALES_INVALIDAS");
  }

  await createSession({
    userId: user!.id,
    businessId: user!.businessId,
    businessSlug: user!.business.slug,
    role: user!.role,
  });
  redirect("/dashboard");
}

export async function logoutAction() {
  await clearSession();
  redirect("/login");
}
