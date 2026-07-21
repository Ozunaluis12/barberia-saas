import { requireSession } from "@/lib/guard";
import { prisma } from "@/lib/db";
import { getVocabulary } from "@/lib/vocabulary";

const STATUS_LABEL: Record<string, string> = {
  CONFIRMED: "Confirmada",
  COMPLETED: "Completada",
  CANCELLED: "Cancelada",
  NO_SHOW: "No asistió",
};

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

export default async function CalendarPage({
  searchParams,
}: {
  searchParams: Promise<{ date?: string; business?: string }>;
}) {
  const session = await requireSession();
  const { date, business: businessParam } = await searchParams;
  const day = date ?? todayISO();
  const isOwner = session.role === "OWNER";

  const dayStart = new Date(`${day}T00:00:00`);
  const dayEnd = new Date(`${day}T23:59:59`);

  const branches = isOwner
    ? await prisma.business.findMany({
        where: { organizationId: session.organizationId },
        orderBy: { name: "asc" },
      })
    : [];

  const viewingAll = isOwner && businessParam === "all";
  const selectedBusinessId =
    isOwner && businessParam && businessParam !== "all" ? businessParam : session.businessId;

  const appointments = await prisma.appointment.findMany({
    where: viewingAll
      ? { business: { organizationId: session.organizationId }, startTime: { gte: dayStart, lte: dayEnd } }
      : { businessId: selectedBusinessId, startTime: { gte: dayStart, lte: dayEnd } },
    include: { staff: true, service: true, business: true },
    orderBy: { startTime: "asc" },
  });

  const currentBusiness = await prisma.business.findUnique({ where: { id: session.businessId } });
  const vocab = getVocabulary(currentBusiness?.category ?? "OTHER");
  const colSpan = viewingAll ? 6 : 5;

  return (
    <div>
      <h1 className="text-2xl font-bold">Calendario</h1>
      <p className="mt-1 text-sm text-cream/60">
        Agenda del día {isOwner ? "por sucursal, o todas juntas" : "de tu sucursal"}.
      </p>

      <form className="mt-6 flex flex-wrap items-end gap-4">
        <div>
          <label className="text-sm text-cream/70">Fecha</label>
          <input
            type="date"
            name="date"
            defaultValue={day}
            className="mt-1 block rounded-md border border-white/20 bg-ink px-3 py-2"
          />
        </div>
        {isOwner && (
          <div>
            <label className="text-sm text-cream/70">Sucursal</label>
            <select
              name="business"
              defaultValue={businessParam ?? session.businessId}
              className="mt-1 block rounded-md border border-white/20 bg-ink px-3 py-2"
            >
              <option value="all">Todas las sucursales</option>
              {branches.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name}
                </option>
              ))}
            </select>
          </div>
        )}
        <button className="rounded-md bg-gold px-4 py-2 font-semibold text-ink">Ver</button>
      </form>

      <div className="mt-6 overflow-hidden rounded-lg border border-white/10">
        <table className="w-full text-sm">
          <thead className="bg-charcoal text-left text-cream/60">
            <tr>
              <th className="px-4 py-2">Hora</th>
              {viewingAll && <th className="px-4 py-2">Sucursal</th>}
              <th className="px-4 py-2">Cliente</th>
              <th className="px-4 py-2">{vocab.staffSingular}</th>
              <th className="px-4 py-2">Servicio</th>
              <th className="px-4 py-2">Estado</th>
            </tr>
          </thead>
          <tbody>
            {appointments.map((a) => (
              <tr key={a.id} className="border-t border-white/5">
                <td className="px-4 py-2">
                  {a.startTime.toLocaleTimeString("es", { hour: "2-digit", minute: "2-digit" })}
                </td>
                {viewingAll && <td className="px-4 py-2 text-cream/60">{a.business.name}</td>}
                <td className="px-4 py-2">{a.clientName}</td>
                <td className="px-4 py-2">{a.staff.name}</td>
                <td className="px-4 py-2">{a.service.name}</td>
                <td className="px-4 py-2 text-cream/70">{STATUS_LABEL[a.status] ?? a.status}</td>
              </tr>
            ))}
            {appointments.length === 0 && (
              <tr>
                <td className="px-4 py-6 text-center text-cream/40" colSpan={colSpan}>
                  No hay citas para este día.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
