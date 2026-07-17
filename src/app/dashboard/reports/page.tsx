import { requireSession } from "@/lib/guard";
import { prisma } from "@/lib/db";

export default async function ReportsPage({
  searchParams,
}: {
  searchParams: Promise<{ from?: string; to?: string }>;
}) {
  const session = await requireSession();
  const { from, to } = await searchParams;

  const rangeStart = from ? new Date(`${from}T00:00:00`) : new Date(new Date().setDate(new Date().getDate() - 30));
  const rangeEnd = to ? new Date(`${to}T23:59:59`) : new Date();

  const appointments = await prisma.appointment.findMany({
    where: {
      shopId: session.shopId,
      status: "COMPLETED",
      startTime: { gte: rangeStart, lte: rangeEnd },
    },
    include: { barber: true, service: true },
  });

  const byBarber = new Map<
    string,
    { name: string; commissionPercent: number; count: number; revenue: number }
  >();

  for (const a of appointments) {
    const entry = byBarber.get(a.barberId) ?? {
      name: a.barber.name,
      commissionPercent: a.barber.commissionPercent,
      count: 0,
      revenue: 0,
    };
    entry.count += 1;
    entry.revenue += a.service.price;
    byBarber.set(a.barberId, entry);
  }

  const rows = Array.from(byBarber.values()).map((r) => ({
    ...r,
    commission: r.revenue * (r.commissionPercent / 100),
    shopShare: r.revenue * (1 - r.commissionPercent / 100),
  }));

  const totals = rows.reduce(
    (acc, r) => ({
      revenue: acc.revenue + r.revenue,
      commission: acc.commission + r.commission,
      shopShare: acc.shopShare + r.shopShare,
    }),
    { revenue: 0, commission: 0, shopShare: 0 }
  );

  const fromValue = rangeStart.toISOString().slice(0, 10);
  const toValue = rangeEnd.toISOString().slice(0, 10);

  return (
    <div>
      <h1 className="text-2xl font-bold">Comisiones por barbero</h1>
      <p className="mt-1 text-sm text-cream/60">
        Calculado solo sobre citas marcadas como completadas. Ningún costo oculto para ti ni para tus
        barberos: lo que ves aquí es lo que se paga.
      </p>

      <form className="mt-6 flex items-end gap-4">
        <div>
          <label className="text-sm text-cream/70">Desde</label>
          <input
            type="date"
            name="from"
            defaultValue={fromValue}
            className="mt-1 block rounded-md border border-white/20 bg-ink px-3 py-2"
          />
        </div>
        <div>
          <label className="text-sm text-cream/70">Hasta</label>
          <input
            type="date"
            name="to"
            defaultValue={toValue}
            className="mt-1 block rounded-md border border-white/20 bg-ink px-3 py-2"
          />
        </div>
        <button className="rounded-md bg-gold px-4 py-2 font-semibold text-ink">Filtrar</button>
      </form>

      <div className="mt-6 overflow-hidden rounded-lg border border-white/10">
        <table className="w-full text-sm">
          <thead className="bg-charcoal text-left text-cream/60">
            <tr>
              <th className="px-4 py-2">Barbero</th>
              <th className="px-4 py-2">Citas completadas</th>
              <th className="px-4 py-2">Ingreso generado</th>
              <th className="px-4 py-2">% comisión</th>
              <th className="px-4 py-2">Le corresponde al barbero</th>
              <th className="px-4 py-2">Se queda la barbería</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.name} className="border-t border-white/5">
                <td className="px-4 py-2 font-medium">{r.name}</td>
                <td className="px-4 py-2">{r.count}</td>
                <td className="px-4 py-2">${r.revenue.toFixed(2)}</td>
                <td className="px-4 py-2">{r.commissionPercent}%</td>
                <td className="px-4 py-2 text-gold">${r.commission.toFixed(2)}</td>
                <td className="px-4 py-2">${r.shopShare.toFixed(2)}</td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td className="px-4 py-6 text-center text-cream/40" colSpan={6}>
                  No hay citas completadas en este rango.
                </td>
              </tr>
            )}
          </tbody>
          {rows.length > 0 && (
            <tfoot>
              <tr className="border-t border-white/10 bg-charcoal font-semibold">
                <td className="px-4 py-2" colSpan={2}>
                  Total
                </td>
                <td className="px-4 py-2">${totals.revenue.toFixed(2)}</td>
                <td className="px-4 py-2"></td>
                <td className="px-4 py-2 text-gold">${totals.commission.toFixed(2)}</td>
                <td className="px-4 py-2">${totals.shopShare.toFixed(2)}</td>
              </tr>
            </tfoot>
          )}
        </table>
      </div>
    </div>
  );
}
