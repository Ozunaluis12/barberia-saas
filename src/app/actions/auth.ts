"use server";

import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { hashPassword, verifyPassword } from "@/lib/auth";
import { createSession, clearSession } from "@/lib/session";

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
  const shopName = String(formData.get("shopName") ?? "").trim();
  const ownerName = String(formData.get("ownerName") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");

  if (!shopName || !ownerName || !email || password.length < 6) {
    redirect("/signup?error=DATOS_INVALIDOS");
  }

  const existingUser = await prisma.user.findUnique({ where: { email } });
  if (existingUser) {
    redirect("/signup?error=EMAIL_EN_USO");
  }

  let slug = slugify(shopName) || "barberia";
  let attempt = 0;
  while (await prisma.shop.findUnique({ where: { slug } })) {
    attempt += 1;
    slug = `${slugify(shopName)}-${attempt + 1}`;
  }

  const passwordHash = await hashPassword(password);

  const shop = await prisma.shop.create({
    data: {
      name: shopName,
      slug,
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

  const user = shop.users[0];
  await createSession({ userId: user.id, shopId: shop.id, shopSlug: shop.slug, role: user.role });
  redirect("/dashboard");
}

export async function loginAction(formData: FormData) {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");

  const user = await prisma.user.findUnique({ where: { email }, include: { shop: true } });
  if (!user || !(await verifyPassword(password, user.passwordHash))) {
    redirect("/login?error=CREDENCIALES_INVALIDAS");
  }

  await createSession({
    userId: user!.id,
    shopId: user!.shopId,
    shopSlug: user!.shop.slug,
    role: user!.role,
  });
  redirect("/dashboard");
}

export async function logoutAction() {
  await clearSession();
  redirect("/login");
}
