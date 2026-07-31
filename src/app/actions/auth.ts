"use server";

import crypto from "crypto";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { hashPassword, verifyPassword } from "@/lib/auth";
import { createSession, clearSession } from "@/lib/session";
import { sendPasswordResetPin } from "@/lib/email";
import { BUSINESS_CATEGORIES } from "@/lib/vocabulary";
import { checkRateLimit, getClientIp } from "@/lib/rateLimit";
import { slugify } from "@/lib/slug";
import { sendAccountSetupPin } from "@/lib/email";

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

  // Campo honeypot: invisible para una persona, los bots de formularios lo suelen llenar.
  if (String(formData.get("website") ?? "").trim() !== "") {
    redirect("/signup?error=DATOS_INVALIDOS");
  }

  const ip = await getClientIp();
  if (!checkRateLimit(`signup:ip:${ip}`, 10, 15 * 60 * 1000)) {
    redirect("/signup?error=DEMASIADOS_INTENTOS");
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
    staffId: null,
  });
  redirect("/dashboard");
}

export async function loginAction(formData: FormData) {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");

  const ip = await getClientIp();
  if (!checkRateLimit(`login:ip:${ip}`, 15, 15 * 60 * 1000)) {
    redirect("/login?error=DEMASIADOS_INTENTOS");
  }

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
    staffId: user!.staffId,
  });
  redirect("/dashboard");
}

export async function logoutAction() {
  await clearSession();
  redirect("/login");
}

/** El hash incluye el userId para que dos personas con el mismo PIN de 6 dígitos no colisionen. */
function hashPin(userId: string, pin: string): string {
  return crypto.createHash("sha256").update(`${userId}:${pin}`).digest("hex");
}

function generatePin(): string {
  return crypto.randomInt(0, 1_000_000).toString().padStart(6, "0");
}

/**
 * Para cuentas que Soporte crea a nombre de un cliente (empresa nueva, socio
 * adicional): en vez de que Soporte escriba una contraseña, se le manda al
 * dueño un PIN para que la defina él mismo en /reset-password — mismo
 * mecanismo que "olvidé mi contraseña", solo que aquí es la primera vez.
 */
export async function createPasswordSetupToken(userId: string, email: string, businessName: string) {
  await prisma.passwordResetToken.deleteMany({ where: { userId, usedAt: null } });

  const pin = generatePin();
  await prisma.passwordResetToken.create({
    data: {
      userId,
      tokenHash: hashPin(userId, pin),
      expiresAt: new Date(Date.now() + 15 * 60 * 1000),
    },
  });

  await sendAccountSetupPin(email, pin, businessName);
}

/**
 * Siempre redirige al mismo "revisa tu correo" exista o no la cuenta, para no
 * filtrar qué correos están registrados en el sistema.
 */
export async function requestPasswordReset(formData: FormData) {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();

  const ip = await getClientIp();
  if (!checkRateLimit(`reset-request:ip:${ip}`, 5, 15 * 60 * 1000)) {
    redirect(`/reset-password?email=${encodeURIComponent(email)}&sent=1`);
  }

  const user = await prisma.user.findUnique({ where: { email } });
  if (user) {
    // Invalidamos códigos anteriores sin usar para que no queden varios activos.
    await prisma.passwordResetToken.deleteMany({ where: { userId: user.id, usedAt: null } });

    const pin = generatePin();
    await prisma.passwordResetToken.create({
      data: {
        userId: user.id,
        tokenHash: hashPin(user.id, pin),
        expiresAt: new Date(Date.now() + 15 * 60 * 1000),
      },
    });

    await sendPasswordResetPin(email, pin);
  }

  redirect(`/reset-password?email=${encodeURIComponent(email)}&sent=1`);
}

export type ResetPasswordResult = { ok: true } | { ok: false; error: string };

const GENERIC_PIN_ERROR = "Ese código es inválido o ya venció. Solicita uno nuevo.";

export async function verifyResetPin(formData: FormData): Promise<ResetPasswordResult> {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const pin = String(formData.get("pin") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  if (password.length < 6) {
    return { ok: false, error: "La contraseña debe tener al menos 6 caracteres." };
  }

  // El PIN es de solo 6 dígitos (1 millón de combinaciones): sin límite de intentos,
  // se podría adivinar por fuerza bruta en poco tiempo.
  const ip = await getClientIp();
  if (!checkRateLimit(`reset-verify:${ip}:${email}`, 10, 15 * 60 * 1000)) {
    return { ok: false, error: GENERIC_PIN_ERROR };
  }

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) return { ok: false, error: GENERIC_PIN_ERROR };

  const resetToken = await prisma.passwordResetToken.findUnique({
    where: { tokenHash: hashPin(user.id, pin) },
  });

  if (
    !resetToken ||
    resetToken.userId !== user.id ||
    resetToken.usedAt ||
    resetToken.expiresAt < new Date()
  ) {
    return { ok: false, error: GENERIC_PIN_ERROR };
  }

  const passwordHash = await hashPassword(password);
  await prisma.$transaction([
    prisma.user.update({ where: { id: resetToken.userId }, data: { passwordHash } }),
    prisma.passwordResetToken.update({ where: { id: resetToken.id }, data: { usedAt: new Date() } }),
  ]);

  return { ok: true };
}
