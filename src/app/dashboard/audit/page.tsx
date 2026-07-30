import { requireOwner } from "@/lib/guard";
import { prisma } from "@/lib/db";

const ACTION_LABEL: Record<string, string> = {
  "settings.update": "Cambió Configuración",
  "team.created": "Creó cuenta de Personal",
  "team.permissions_changed": "Cambió permisos de Personal",
  "cash.opened": "Abrió caja",
  "cash.closed": "Cerró caja",
  "payment.confirmed": "Confirmó pago anticipado",
  "payment.rejected": "Rechazó pago anticipado",
  "payment.refunded": "Reembolsó una cita",
};

export default async function AuditPage() {
  const session = await requireOwner();

  const logs = await prisma.auditLog.findMany({
    where: { organizationId: session.organizationId },
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  return (
    <div>
      <h1 className="text-2xl font-bold">Auditoría</h1>
      <p className="mt-1 text-sm text-cream/60">
        Registro de acciones sensibles (dinero y accesos) de toda tu organización — no todos los
        cambios quedan aquí, solo los que de verdad importa auditar.
      </p>

      <div className="mt-6 overflow-hidden rounded-lg border border-white/10">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-charcoal text-left text-cream/60">
              <tr>
                <th className="px-4 py-2">Fecha</th>
                <th className="px-4 py-2">Quién</th>
                <th className="px-4 py-2">Acción</th>
                <th className="px-4 py-2">Detalle</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((l) => (
                <tr key={l.id} className="border-t border-white/5">
                  <td className="px-4 py-2 text-cream/70">
                    {l.createdAt.toLocaleString("es", {
                      day: "2-digit",
                      month: "2-digit",
                      year: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </td>
                  <td className="px-4 py-2 font-medium">{l.userName}</td>
                  <td className="px-4 py-2 text-cream/70">{ACTION_LABEL[l.action] ?? l.action}</td>
                  <td className="px-4 py-2 text-cream/50">{l.details ?? "—"}</td>
                </tr>
              ))}
              {logs.length === 0 && (
                <tr>
                  <td className="px-4 py-6 text-center text-cream/40" colSpan={4}>
                    Todavía no hay entradas registradas.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
