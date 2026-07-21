"use server";

import crypto from "crypto";
import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { prisma } from "@/lib/db";
import { hashPassword, verifyPassword } from "@/lib/auth";
import { createSession, clearSession } from "@/lib/session";
import { sendPasswordResetEmail } from "@/lib/email";
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
  const categoryInput = String(formData.get("category") ?? "BARBERSHOP");
  const category = (BUSINESS_CATEGORIES as readonly string[]).includes(categoryInput)
    ? categoryInput
    : "BARBERSHOP";

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

  const organization = await prisma.organization.create({
    data: {
      name: businessName,
      locations: {
        create: {
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
      },
    },
    include: { locations: { include: { users: true } } },
  });

  const business = organization.locations[0];
  const user = business.users[0];
  await createSession({
    userId: user.id,
    organizationId: organization.id,
    businessId: business.id,
    businessSlug: business.slug,
    role: user.role,
    permissions: user.permissions,
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
  if (!user!.active) {
    redirect("/login?error=CUENTA_DESACTIVADA");
  }

  await createSession({
    userId: user!.id,
    organizationId: user!.business.organizationId,
    businessId: user!.businessId,
    businessSlug: user!.business.slug,
    role: user!.role,
    permissions: user!.permissions,
  });
  redirect("/dashboard");
}

export async function logoutAction() {
  await clearSession();
  redirect("/login");
}

function hashToken(token: string): string {
  return crypto.createHash("sha256").update(token).digest("hex");
}

async function getOrigin(): Promise<string> {
  const h = await headers();
  const host = h.get("host") ?? "localhost:3000";
  const protocol = host.startsWith("localhost") ? "http" : "https";
  return `${protocol}://${host}`;
}

/**
 * Siempre redirige al mismo "revisa tu correo" exista o no la cuenta, para no
 * filtrar qué correos están registrados en el sistema.
 */
export async function requestPasswordReset(formData: FormData) {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();

  const user = await prisma.user.findUnique({ where: { email } });
  if (user) {
    // Invalidamos tokens anteriores sin usar para que no queden varios enlaces activos.
    await prisma.passwordResetToken.deleteMany({ where: { userId: user.id, usedAt: null } });

    const rawToken = crypto.randomBytes(32).toString("hex");
    await prisma.passwordResetToken.create({
      data: {
        userId: user.id,
        tokenHash: hashToken(rawToken),
        expiresAt: new Date(Date.now() + 60 * 60 * 1000),
      },
    });

    const origin = await getOrigin();
    await sendPasswordResetEmail(email, `${origin}/reset-password/${rawToken}`);
  }

  redirect("/forgot-password?sent=1");
}

export type ResetPasswordResult = { ok: true } | { ok: false; error: string };

export async function resetPassword(rawToken: string, formData: FormData): Promise<ResetPasswordResult> {
  const password = String(formData.get("password") ?? "");
  if (password.length < 6) {
    return { ok: false, error: "La contraseña debe tener al menos 6 caracteres." };
  }

  const resetToken = await prisma.passwordResetToken.findUnique({
    where: { tokenHash: hashToken(rawToken) },
  });

  if (!resetToken || resetToken.usedAt || resetToken.expiresAt < new Date()) {
    return { ok: false, error: "Este enlace ya no es válido. Solicita uno nuevo." };
  }

  const passwordHash = await hashPassword(password);
  await prisma.$transaction([
    prisma.user.update({ where: { id: resetToken.userId }, data: { passwordHash } }),
    prisma.passwordResetToken.update({ where: { id: resetToken.id }, data: { usedAt: new Date() } }),
  ]);

  return { ok: true };
}
