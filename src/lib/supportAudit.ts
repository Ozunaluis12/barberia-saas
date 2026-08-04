import { prisma } from "@/lib/db";
import type { SupportSessionPayload } from "@/lib/supportSession";

/**
 * Registra una acción de Soporte en la misma bitácora que usa cada organización.
 * `target: null` es para acciones internas sin empresa asociada (ej. gestionar el
 * equipo de soporte) — quedan en la bitácora igual, solo que sin organizationId.
 */
export async function logSupportAudit(
  supportSession: SupportSessionPayload,
  target: { organizationId: string; businessId?: string } | null,
  action: string,
  details?: string
) {
  await prisma.auditLog.create({
    data: {
      organizationId: target?.organizationId ?? null,
      businessId: target?.businessId,
      userId: null,
      userName: `Soporte: ${supportSession.name}`,
      action,
      details,
    },
  });
}
