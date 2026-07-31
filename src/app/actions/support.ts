"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requireSupportSession } from "@/lib/supportGuard";
import { logSupportAudit } from "@/lib/supportAudit";

async function loadBusinessOrThrow(businessId: string) {
  const business = await prisma.business.findUnique({ where: { id: businessId } });
  if (!business) throw new Error("Empresa no encontrada");
  return business;
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
