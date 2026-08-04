"use server";

import crypto from "crypto";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requireSupportSession } from "@/lib/supportGuard";
import { logSupportAudit } from "@/lib/supportAudit";
import { hashPassword } from "@/lib/auth";
import { createPasswordSetupToken } from "@/app/actions/auth";
import { uploadImage } from "@/lib/images";
import { slugify } from "@/lib/slug";
import { BUSINESS_CATEGORIES } from "@/lib/vocabulary";

async function loadBusinessOrThrow(businessId: string) {
  const business = await prisma.business.findUnique({ where: { id: businessId } });
  if (!business) throw new Error("Empresa no encontrada");
  return business;
}

/** Contraseña inutilizable hasta que la persona la defina por PIN — nunca se comunica. */
async function placeholderPasswordHash(): Promise<string> {
  return hashPassword(crypto.randomUUID());
}

export async function setBusinessStatusAction(formData: FormData) {
  const session = await requireSupportSession();
  const businessId = String(formData.get("businessId") ?? "");
  const status = String(formData.get("status") ?? "");
  const reason = String(formData.get("reason") ?? "").trim() || null;
  if (status !== "ACTIVE" && status !== "SUSPENDED") throw new Error("Estado inválido");

  const business = await loadBusinessOrThrow(businessId);

  await prisma.business.update({
    where: { id: businessId },
    data: {
      subscriptionStatus: status,
      suspendedAt: status === "SUSPENDED" ? new Date() : null,
      suspendedReason: status === "SUSPENDED" ? reason : null,
    },
  });

  await logSupportAudit(
    session,
    { organizationId: business.organizationId, businessId },
    status === "SUSPENDED" ? "SUPPORT_SUSPEND_BUSINESS" : "SUPPORT_ACTIVATE_BUSINESS",
    reason ?? undefined
  );

  revalidatePath("/soporte");
  revalidatePath(`/soporte/empresas/${businessId}`);
}

export async function updateSubscriptionAction(formData: FormData) {
  const session = await requireSupportSession();
  const businessId = String(formData.get("businessId") ?? "");
  const plan = String(formData.get("plan") ?? "GRATIS");
  const renewsAtRaw = String(formData.get("subscriptionRenewsAt") ?? "");
  const notes = String(formData.get("subscriptionNotes") ?? "").trim() || null;

  const business = await loadBusinessOrThrow(businessId);

  await prisma.business.update({
    where: { id: businessId },
    data: {
      plan,
      subscriptionRenewsAt: renewsAtRaw ? new Date(renewsAtRaw) : null,
      subscriptionNotes: notes,
    },
  });

  await logSupportAudit(
    session,
    { organizationId: business.organizationId, businessId },
    "SUPPORT_UPDATE_SUBSCRIPTION",
    `plan=${plan} renueva=${renewsAtRaw || "—"}`
  );

  revalidatePath(`/soporte/empresas/${businessId}`);
}

export async function toggleStaffActiveAction(formData: FormData) {
  const session = await requireSupportSession();
  const userId = String(formData.get("userId") ?? "");
  const businessId = String(formData.get("businessId") ?? "");

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user || user.businessId !== businessId) throw new Error("Cuenta no encontrada");

  const business = await loadBusinessOrThrow(businessId);
  const nextActive = !user.active;

  await prisma.user.update({ where: { id: userId }, data: { active: nextActive } });

  await logSupportAudit(
    session,
    { organizationId: business.organizationId, businessId },
    nextActive ? "SUPPORT_ACTIVATE_STAFF" : "SUPPORT_DEACTIVATE_STAFF",
    user.email
  );

  revalidatePath(`/soporte/empresas/${businessId}`);
}

export async function createBusinessAction(formData: FormData) {
  const session = await requireSupportSession();
  const businessName = String(formData.get("businessName") ?? "").trim();
  const ownerName = String(formData.get("ownerName") ?? "").trim();
  const ownerEmail = String(formData.get("ownerEmail") ?? "").trim().toLowerCase();
  const categoryInput = String(formData.get("category") ?? "BARBERSHOP");
  const category = (BUSINESS_CATEGORIES as readonly string[]).includes(categoryInput)
    ? categoryInput
    : "BARBERSHOP";
  const phone = String(formData.get("phone") ?? "").trim() || null;
  const address = String(formData.get("address") ?? "").trim() || null;

  if (!businessName || !ownerName || !ownerEmail) {
    redirect("/soporte/empresas/nueva?error=DATOS_INVALIDOS");
  }

  const existingUser = await prisma.user.findUnique({ where: { email: ownerEmail } });
  if (existingUser) redirect("/soporte/empresas/nueva?error=EMAIL_EN_USO");

  let slug = slugify(businessName) || "negocio";
  let attempt = 0;
  while (await prisma.business.findUnique({ where: { slug } })) {
    attempt += 1;
    slug = `${slugify(businessName)}-${attempt + 1}`;
  }

  const passwordHash = await placeholderPasswordHash();

  const organization = await prisma.organization.create({
    data: {
      name: businessName,
      locations: {
        create: {
          name: businessName,
          slug,
          category,
          phone,
          address,
          users: {
            create: { name: ownerName, email: ownerEmail, passwordHash, role: "OWNER" },
          },
        },
      },
    },
    include: { locations: { include: { users: true } } },
  });

  const business = organization.locations[0];
  const owner = business.users[0];

  await createPasswordSetupToken(owner.id, owner.email, business.name);

  await logSupportAudit(
    session,
    { organizationId: organization.id, businessId: business.id },
    "SUPPORT_CREATE_BUSINESS",
    `${businessName} (${ownerEmail})`
  );

  revalidatePath("/soporte");
  redirect(`/soporte/empresas/${business.id}`);
}

export async function addStaffAction(formData: FormData) {
  const session = await requireSupportSession();
  const businessId = String(formData.get("businessId") ?? "");
  const name = String(formData.get("name") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const role = String(formData.get("role") ?? "STAFF");

  if (role !== "OWNER" && role !== "STAFF") throw new Error("Rol inválido");
  const business = await loadBusinessOrThrow(businessId);

  if (!name || !email) {
    redirect(`/soporte/empresas/${businessId}?error=DATOS_INVALIDOS`);
  }

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) redirect(`/soporte/empresas/${businessId}?error=EMAIL_EN_USO`);

  const passwordHash = await placeholderPasswordHash();
  const user = await prisma.user.create({
    data: { businessId, name, email, passwordHash, role },
  });

  await createPasswordSetupToken(user.id, user.email, business.name);

  await logSupportAudit(
    session,
    { organizationId: business.organizationId, businessId },
    "SUPPORT_ADD_STAFF",
    `${name} (${email}), rol: ${role}`
  );

  revalidatePath(`/soporte/empresas/${businessId}`);
}

export async function updateStaffRoleAction(formData: FormData) {
  const session = await requireSupportSession();
  const userId = String(formData.get("userId") ?? "");
  const businessId = String(formData.get("businessId") ?? "");
  const role = String(formData.get("role") ?? "");
  if (role !== "OWNER" && role !== "STAFF") throw new Error("Rol inválido");

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user || user.businessId !== businessId) throw new Error("Cuenta no encontrada");
  const business = await loadBusinessOrThrow(businessId);

  if (user.role === "OWNER" && role === "STAFF") {
    const otherActiveOwners = await prisma.user.count({
      where: { businessId, role: "OWNER", active: true, id: { not: userId } },
    });
    if (otherActiveOwners === 0) {
      redirect(`/soporte/empresas/${businessId}?error=ULTIMO_DUENO`);
    }
  }

  await prisma.user.update({ where: { id: userId }, data: { role } });

  await logSupportAudit(
    session,
    { organizationId: business.organizationId, businessId },
    "SUPPORT_CHANGE_ROLE",
    `${user.email}: ${user.role} → ${role}`
  );

  revalidatePath(`/soporte/empresas/${businessId}`);
}

export async function deleteStaffAction(formData: FormData) {
  const session = await requireSupportSession();
  const userId = String(formData.get("userId") ?? "");
  const businessId = String(formData.get("businessId") ?? "");

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user || user.businessId !== businessId) throw new Error("Cuenta no encontrada");
  const business = await loadBusinessOrThrow(businessId);

  const [cashSessions, productSales, payrollPayouts, teamSize] = await Promise.all([
    prisma.cashSession.count({ where: { OR: [{ openedByUserId: userId }, { closedByUserId: userId }] } }),
    prisma.productSale.count({ where: { soldByUserId: userId } }),
    prisma.payrollPayout.count({ where: { paidByUserId: userId } }),
    prisma.user.count({ where: { businessId } }),
  ]);

  if (cashSessions > 0 || productSales > 0 || payrollPayouts > 0) {
    await logSupportAudit(
      session,
      { organizationId: business.organizationId, businessId },
      "SUPPORT_DELETE_STAFF_BLOCKED",
      `${user.email}: tiene historial (caja/ventas/nómina), se sugirió desactivar`
    );
    redirect(`/soporte/empresas/${businessId}?error=TIENE_HISTORIAL`);
  }

  if (teamSize <= 1) {
    redirect(`/soporte/empresas/${businessId}?error=ULTIMA_CUENTA`);
  }

  await prisma.user.delete({ where: { id: userId } });

  await logSupportAudit(
    session,
    { organizationId: business.organizationId, businessId },
    "SUPPORT_DELETE_STAFF",
    user.email
  );

  revalidatePath(`/soporte/empresas/${businessId}`);
}

export async function updateBusinessLogoAction(formData: FormData) {
  const session = await requireSupportSession();
  const businessId = String(formData.get("businessId") ?? "");
  const business = await loadBusinessOrThrow(businessId);

  const logoFile = formData.get("logo");
  if (!(logoFile instanceof File) || logoFile.size === 0) {
    redirect(`/soporte/empresas/${businessId}?error=LOGO_REQUERIDO`);
  }

  const logoUrl = await uploadImage(logoFile as File, "logos");
  if (!logoUrl) redirect(`/soporte/empresas/${businessId}?error=ERROR_SUBIENDO_LOGO`);

  await prisma.business.update({ where: { id: businessId }, data: { logoUrl } });

  await logSupportAudit(
    session,
    { organizationId: business.organizationId, businessId },
    "SUPPORT_UPDATE_LOGO"
  );

  revalidatePath(`/soporte/empresas/${businessId}`);
}

export async function updateBusinessInfoAction(formData: FormData) {
  const session = await requireSupportSession();
  const businessId = String(formData.get("businessId") ?? "");
  const business = await loadBusinessOrThrow(businessId);

  const name = String(formData.get("name") ?? "").trim();
  const categoryInput = String(formData.get("category") ?? business.category);
  const category = (BUSINESS_CATEGORIES as readonly string[]).includes(categoryInput)
    ? categoryInput
    : business.category;
  const phone = String(formData.get("phone") ?? "").trim() || null;
  const address = String(formData.get("address") ?? "").trim() || null;

  if (!name) redirect(`/soporte/empresas/${businessId}?error=DATOS_INVALIDOS`);

  await prisma.business.update({
    where: { id: businessId },
    data: { name, category, phone, address },
  });

  await logSupportAudit(
    session,
    { organizationId: business.organizationId, businessId },
    "SUPPORT_UPDATE_BUSINESS_INFO",
    `nombre=${name} categoría=${category}`
  );

  revalidatePath(`/soporte/empresas/${businessId}`);
}

export async function recordSubscriptionPaymentAction(formData: FormData) {
  const session = await requireSupportSession();
  const businessId = String(formData.get("businessId") ?? "");
  const business = await loadBusinessOrThrow(businessId);

  const amount = Number(formData.get("amount") ?? 0);
  const periodStartRaw = String(formData.get("periodStart") ?? "");
  const periodEndRaw = String(formData.get("periodEnd") ?? "");
  const notes = String(formData.get("notes") ?? "").trim() || null;

  if (!amount || amount <= 0 || !periodStartRaw || !periodEndRaw) {
    redirect(`/soporte/empresas/${businessId}?error=DATOS_INVALIDOS`);
  }

  const periodStart = new Date(periodStartRaw);
  const periodEnd = new Date(periodEndRaw);

  await prisma.subscriptionInvoice.create({
    data: {
      businessId,
      amount,
      periodStart,
      periodEnd,
      notes,
      recordedByName: session.name,
    },
  });

  await prisma.business.update({ where: { id: businessId }, data: { subscriptionRenewsAt: periodEnd } });

  await logSupportAudit(
    session,
    { organizationId: business.organizationId, businessId },
    "SUPPORT_RECORD_PAYMENT",
    `monto=${amount} periodo=${periodStartRaw}..${periodEndRaw}`
  );

  revalidatePath(`/soporte/empresas/${businessId}`);
}

export async function createSupportUserAction(formData: FormData) {
  const session = await requireSupportSession();
  const name = String(formData.get("name") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");

  if (!name || !email || password.length < 6) {
    redirect("/soporte/equipo?error=DATOS_INVALIDOS");
  }

  const existing = await prisma.supportUser.findUnique({ where: { email } });
  if (existing) redirect("/soporte/equipo?error=EMAIL_EN_USO");

  const passwordHash = await hashPassword(password);
  await prisma.supportUser.create({ data: { name, email, passwordHash } });

  await logSupportAudit(session, null, "SUPPORT_TEAM_ADD", `${name} (${email})`);

  revalidatePath("/soporte/equipo");
}

export async function toggleSupportUserActiveAction(formData: FormData) {
  const session = await requireSupportSession();
  const supportUserId = String(formData.get("supportUserId") ?? "");

  const target = await prisma.supportUser.findUnique({ where: { id: supportUserId } });
  if (!target) throw new Error("Cuenta no encontrada");

  if (target.active) {
    const otherActive = await prisma.supportUser.count({
      where: { active: true, id: { not: supportUserId } },
    });
    if (otherActive === 0) {
      redirect("/soporte/equipo?error=ULTIMA_CUENTA_SOPORTE");
    }
  }

  const nextActive = !target.active;
  await prisma.supportUser.update({ where: { id: supportUserId }, data: { active: nextActive } });

  await logSupportAudit(
    session,
    null,
    nextActive ? "SUPPORT_TEAM_ACTIVATE" : "SUPPORT_TEAM_DEACTIVATE",
    target.email
  );

  revalidatePath("/soporte/equipo");
}

export async function deleteBusinessAction(formData: FormData) {
  const session = await requireSupportSession();
  const businessId = String(formData.get("businessId") ?? "");
  const confirmSlug = String(formData.get("confirmSlug") ?? "").trim();
  const business = await loadBusinessOrThrow(businessId);

  if (confirmSlug !== business.slug) {
    redirect(`/soporte/empresas/${businessId}?error=CONFIRMACION_INVALIDA`);
  }

  await logSupportAudit(
    session,
    { organizationId: business.organizationId, businessId },
    "SUPPORT_DELETE_BUSINESS",
    `${business.name} (/${business.slug})`
  );

  await prisma.business.delete({ where: { id: businessId } });

  const remainingLocations = await prisma.business.count({ where: { organizationId: business.organizationId } });
  if (remainingLocations === 0) {
    await prisma.organization.delete({ where: { id: business.organizationId } });
  }

  revalidatePath("/soporte");
  redirect("/soporte");
}
