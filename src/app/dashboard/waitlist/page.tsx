import { requireSession } from "@/lib/guard";
import { prisma } from "@/lib/db";

export default async function WaitlistPage() {
  const session = await requireSession();

  const entries = await prisma.waitlistEntry.findMany({
    where: { businessId: session.businessId },
    include: { service: true, staff: true },
    orderBy: [{ notifiedAt: "asc" }, { day: "asc" }, { createdAt: "asc" }],
    take: 100,
  });

  return (
    <div>
      <h1 className="text-2xl font-bold">Lista de espera</h1>
      <p className="mt-1 text-sm text-cream/60">
        Clientes que pidieron que se les avise si se libera un horario en un día sin cupo. Al
        cancelarse una cita de ese día/servicio, se les envía un aviso por WhatsApp automáticamente
        (si está configurado).
      </p>

      <div className="mt-6 overflow-hidden rounded-lg border border-white/10">
        <table className="w-full text-sm">
          <thead className="bg-charcoal text-left text-cream/60">
            <tr>
              <th className="px-4 py-2">Día pedido</th>
              <th className="px-4 py-2">Servicio</th>
              <th className="px-4 py-2">Con quién</th>
              <th className="px-4 py-2">Cliente</th>
              <th className="px-4 py-2">Teléfono</th>
              <th className="px-4 py-2">Estado</th>
            </tr>
          </thead>
          <tbody>
            {entries.map((e) => (
              <tr key={e.id} className="border-t border-white/5">
                <td className="px-4 py-2 text-cream/70">{e.day}</td>
                <td className="px-4 py-2">{e.service.name}</td>
                <td className="px-4 py-2 text-cream/70">{e.staff ? e.staff.name : "Cualquiera"}</td>
                <td className="px-4 py-2 font-medium">{e.clientName}</td>
                <td className="px-4 py-2 text-cream/70">{e.clientPhone}</td>
                <td className="px-4 py-2">
                  {e.notifiedAt ? (
                    <span className="rounded-full bg-green-500/20 px-2 py-1 text-xs text-green-400">
                      Avisado
                    </span>
                  ) : (
                    <span className="rounded-full bg-yellow-500/20 px-2 py-1 text-xs text-yellow-400">
                      Esperando
                    </span>
                  )}
                </td>
              </tr>
            ))}
            {entries.length === 0 && (
              <tr>
                <td className="px-4 py-6 text-center text-cream/40" colSpan={6}>
                  No hay nadie en la lista de espera.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
