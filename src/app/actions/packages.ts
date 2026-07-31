"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requirePermission, requireSession } from "@/lib/guard";
import { findOrCreateClient, normalizePhone } from "@/lib/clients";

export async function createServicePackage(formData: FormData) {
  const session = await requirePermission("catalog");
  const serviceId = String(formData.get("serviceId") ?? "");
  const name = String(formData.get("name") ?? "").trim();
  const sessionCount = Number(formData.get("sessionCount") ?? NaN);
  const price = Number(formData.get("price") ?? NaN);

  const service = await prisma.service.findFirst({ where: { id: serviceId, businessId: session.businessId } });
  if (!service) redirect("/dashboard/packages?error=SERVICIO_INVALIDO");
  if (!name) redirect("/dashboard/packages?error=NOMBRE_REQUERIDO");
  if (!Number.isInteger(sessionCount) || sessionCount <= 0) {
    redirect("/dashboard/packages?error=SESIONES_INVALIDAS");
  }
  if (!Number.isFinite(price) || price < 0) redirect("/dashboard/packages?error=PRECIO_INVALIDO");

  await prisma.servicePackage.create({
    data: { businessId: session.businessId, serviceId, name, sessionCount, price },
  });

  revalidatePath("/dashboard/packages");
  redirect("/dashboard/packages");
}

export async function toggleServicePackageActive(servicePackageId: string) {
  const session = await requirePermission("catalog");
  const pkg = await prisma.servicePackage.findFirst({
    where: { id: servicePackageId, businessId: session.businessId },
  });
  if (!pkg) return;
  await prisma.servicePackage.update({ where: { id: servicePackageId }, data: { active: !pkg.active } });
  revalidatePath("/dashboard/packages");
}

export async function sellServicePackage(servicePackageId: string, formData: FormData) {
  const session = await requirePermission("catalog");
  const pkg = await prisma.servicePackage.findFirst({
    where: { id: servicePackageId, businessId: session.businessId },
  });
  if (!pkg) redirect("/dashboard/packages?error=PAQUETE_INVALIDO");

  const clientName = String(formData.get("clientName") ?? "").trim();
  const clientPhone = String(formData.get("clientPhone") ?? "").trim();
  if (!clientName || !clientPhone) redirect("/dashboard/packages?error=CLIENTE_REQUERIDO");

  const client = await findOrCreateClient(session.organizationId, clientName, clientPhone);

  await prisma.clientPackagePurchase.create({
    data: {
      businessId: session.businessId,
      clientId: client.id,
      servicePackageId: pkg!.id,
      sessionsRemaining: pkg!.sessionCount,
    },
  });

  revalidatePath("/dashboard/packages");
  redirect("/dashboard/packages");
}

export type PackageBalance = {
  purchaseId: string;
  packageName: string;
  sessionsRemaining: number;
} | null;

/** Saldo de paquete disponible para un cliente y servicio, para ofrecer usarlo en un walk-in. */
export async function findClientPackageBalance(clientPhone: string, serviceId: string): Promise<PackageBalance> {
  const session = await requireSession();
  const phone = normalizePhone(clientPhone.trim());
  if (!phone || !serviceId) return null;

  const client = await prisma.client.findUnique({
    where: { organizationId_phone: { organizationId: session.organizationId, phone } },
  });
  if (!client) return null;

  const purchase = await prisma.clientPackagePurchase.findFirst({
    where: {
      businessId: session.businessId,
      clientId: client.id,
      sessionsRemaining: { gt: 0 },
      servicePackage: { serviceId },
      OR: [{ expiresAt: null }, { expiresAt: { gte: new Date() } }],
    },
    include: { servicePackage: true },
  });
  if (!purchase) return null;

  return {
    purchaseId: purchase.id,
    packageName: purchase.servicePackage.name,
    sessionsRemaining: purchase.sessionsRemaining,
  };
}
