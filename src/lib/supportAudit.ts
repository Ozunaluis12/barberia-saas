import { prisma } from "@/lib/db";
import type { SupportSessionPayload } from "@/lib/supportSession";

/** Registra una acción de Soporte en la misma bitácora que usa cada organización. */
export async function logSupportAudit(
  supportSession: SupportSessionPayload,
  target: { organizationId: string; businessId?: string },
  action: string,
  details?: string
) {
  await prisma.auditLog.create({
    data: {
      organizationId: target.organizationId,
      businessId: target.businessId,
      userId: null,
      userName: `Soporte: ${supportSession.name}`,
      action,
      details,
    },
  });
}
