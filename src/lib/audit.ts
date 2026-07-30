import { prisma } from "@/lib/db";
import type { SessionPayload } from "@/lib/session";

/** Registra una acción sensible (dinero o accesos) — no instrumenta todo el sistema, solo lo que importa auditar. */
export async function logAudit(session: SessionPayload, action: string, details?: string) {
  const user = await prisma.user.findUnique({ where: { id: session.userId }, select: { name: true } });

  await prisma.auditLog.create({
    data: {
      organizationId: session.organizationId,
      businessId: session.businessId,
      userId: session.userId,
      userName: user?.name ?? "—",
      action,
      details,
    },
  });
}
