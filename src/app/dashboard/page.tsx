import { requireSession } from "@/lib/guard";
import { prisma } from "@/lib/db";
import { getVocabulary } from "@/lib/vocabulary";

export default async function DashboardHome() {
  const session = await requireSession();
  const business = await prisma.business.findUnique({ where: { id: session.businessId } });
  const vocab = getVocabulary(business?.category ?? "OTHER");

  const now = new Date();
  const todayStart = new Date(now);
  todayStart.setHours(0, 0, 0, 0);
  const todayEnd = new Date(now);
  todayEnd.setHours(23, 59, 59, 999);

  const todayAppointments = await prisma.appointment.findMany({
    where: {
      businessId: session.businessId,
      startTime: { gte: todayStart, lte: todayEnd },
      status: { not: "CANCELLED" },
    },
    include: { staff: true, service: true },
    orderBy: { startTime: "asc" },
  });

  const [staffCount, serviceCount] = await Promise.all([
    prisma.staff.count({ where: { businessId: session.businessId, active: true } }),
    prisma.service.count({ where: { businessId: session.businessId, active: true } }),
  ]);

  const estimatedRevenue = todayAppointments.reduce(
    (sum, a) => sum + (a.priceCharged ?? a.service.price),
    0
  );

  return (
    <div>
      <h1 className="text-2xl font-bold">Resumen de hoy</h1>

      <div className="mt-6 grid grid-cols-3 gap-4">
        <div className="rounded-lg border border-white/10 bg-charcoal p-5">
          <p className="text-sm text-cream/60">Citas hoy</p>
          <p className="mt-1 text-3xl font-bold text-gold">{todayAppointments.length}</p>
        </div>
        <div className="rounded-lg border border-white/10 bg-charcoal p-5">
          <p className="text-sm text-cream/60">Ingreso estimado hoy</p>
          <p className="mt-1 text-3xl font-bold text-gold">${estimatedRevenue.toFixed(2)}</p>
        </div>
        <div className="rounded-lg border border-white/10 bg-charcoal p-5">
          <p className="text-sm text-cream/60">{vocab.staffPlural} activos / servicios</p>
          <p className="mt-1 text-3xl font-bold text-gold">
            {staffCount} / {serviceCount}
          </p>
        </div>
      </div>

      <h2 className="mt-8 text-lg font-semibold">Agenda de hoy</h2>
      <div className="mt-3 overflow-hidden rounded-lg border border-white/10">
        <table className="w-full text-sm">
          <thead className="bg-charcoal text-left text-cream/60">
            <tr>
              <th className="px-4 py-2">Hora</th>
              <th className="px-4 py-2">Cliente</th>
              <th className="px-4 py-2">{vocab.staffSingular}</th>
              <th className="px-4 py-2">Servicio</th>
              <th className="px-4 py-2">Origen</th>
            </tr>
          </thead>
          <tbody>
            {todayAppointments.map((a) => (
              <tr key={a.id} className="border-t border-white/5">
                <td className="px-4 py-2">
                  {a.startTime.toLocaleTimeString("es", { hour: "2-digit", minute: "2-digit" })}
                </td>
                <td className="px-4 py-2">{a.clientName}</td>
                <td className="px-4 py-2">{a.staff.name}</td>
                <td className="px-4 py-2">{a.service.name}</td>
                <td className="px-4 py-2 text-cream/60">
                  {a.source === "WALK_IN" ? vocab.walkInLabel : "Online"}
                </td>
              </tr>
            ))}
            {todayAppointments.length === 0 && (
              <tr>
                <td className="px-4 py-6 text-center text-cream/40" colSpan={5}>
                  No hay citas para hoy.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
