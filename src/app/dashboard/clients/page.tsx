import { requireSession } from "@/lib/guard";
import { prisma } from "@/lib/db";

function riskBadge(strikes: number) {
  if (strikes === 0) {
    return <span className="rounded-full bg-green-500/20 px-2 py-1 text-xs text-green-400">Sin incidentes</span>;
  }
  if (strikes <= 2) {
    return (
      <span className="rounded-full bg-yellow-500/20 px-2 py-1 text-xs text-yellow-400">
        Atención · {strikes} {strikes === 1 ? "sanción" : "sanciones"}
      </span>
    );
  }
  return (
    <span className="rounded-full bg-red-500/20 px-2 py-1 text-xs text-red-400">
      Riesgo · {strikes} sanciones
    </span>
  );
}

export default async function ClientsPage() {
  const session = await requireSession();

  const clients = await prisma.client.findMany({
    where: { businessId: session.businessId },
    include: {
      appointments: {
        orderBy: { startTime: "desc" },
        take: 1,
        select: { startTime: true, status: true },
      },
      _count: { select: { appointments: true } },
    },
    orderBy: [{ strikes: "desc" }, { createdAt: "desc" }],
  });

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Clientes</h1>
        <a
          href="/api/export/clients"
          className="rounded-md border border-white/20 px-3 py-1.5 text-sm hover:border-gold hover:text-gold"
        >
          Exportar CSV
        </a>
      </div>
      <p className="mt-1 text-sm text-cream/60">
        Cada cancelación tardía o inasistencia queda registrada aquí para que cualquier miembro del
        equipo la vea antes de confirmarle otra cita a ese cliente.
      </p>

      <div className="mt-6 overflow-hidden rounded-lg border border-white/10">
        <table className="w-full text-sm">
          <thead className="bg-charcoal text-left text-cream/60">
            <tr>
              <th className="px-4 py-2">Cliente</th>
              <th className="px-4 py-2">Teléfono</th>
              <th className="px-4 py-2">Citas totales</th>
              <th className="px-4 py-2">Última cita</th>
              <th className="px-4 py-2">Estado</th>
            </tr>
          </thead>
          <tbody>
            {clients.map((c) => (
              <tr key={c.id} className="border-t border-white/5">
                <td className="px-4 py-2 font-medium">{c.name}</td>
                <td className="px-4 py-2 text-cream/70">{c.phone}</td>
                <td className="px-4 py-2 text-cream/70">{c._count.appointments}</td>
                <td className="px-4 py-2 text-cream/70">
                  {c.appointments[0]
                    ? c.appointments[0].startTime.toLocaleDateString("es", {
                        day: "2-digit",
                        month: "2-digit",
                        year: "numeric",
                      })
                    : "—"}
                </td>
                <td className="px-4 py-2">{riskBadge(c.strikes)}</td>
              </tr>
            ))}
            {clients.length === 0 && (
              <tr>
                <td className="px-4 py-6 text-center text-cream/40" colSpan={5}>
                  Aún no tienes clientes registrados.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
