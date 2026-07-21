import { requirePermission } from "@/lib/guard";
import { prisma } from "@/lib/db";

export default async function AnalyticsPage({
  searchParams,
}: {
  searchParams: Promise<{ from?: string; to?: string }>;
}) {
  const session = await requirePermission("reports");
  const { from, to } = await searchParams;

  const rangeStart = from ? new Date(`${from}T00:00:00`) : new Date(new Date().setDate(new Date().getDate() - 30));
  const rangeEnd = to ? new Date(`${to}T23:59:59`) : new Date();

  const [appointments, productSales] = await Promise.all([
    prisma.appointment.findMany({
      where: { businessId: session.businessId, status: "COMPLETED", startTime: { gte: rangeStart, lte: rangeEnd } },
      include: { service: true },
    }),
    prisma.productSale.findMany({
      where: { businessId: session.businessId, createdAt: { gte: rangeStart, lte: rangeEnd } },
      include: { product: true },
    }),
  ]);

  // Horas pico
  const byHour = new Map<number, number>();
  for (const a of appointments) {
    const h = a.startTime.getHours();
    byHour.set(h, (byHour.get(h) ?? 0) + 1);
  }
  const peakHours = Array.from(byHour.entries())
    .sort((a, b) => a[0] - b[0])
    .map(([hour, count]) => ({ hour, count }));
  const maxHourCount = Math.max(1, ...peakHours.map((h) => h.count));

  // Servicio más vendido
  const byService = new Map<string, { name: string; count: number }>();
  for (const a of appointments) {
    const entry = byService.get(a.serviceId) ?? { name: a.service.name, count: 0 };
    entry.count += 1;
    byService.set(a.serviceId, entry);
  }
  const topServices = Array.from(byService.values())
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  // Producto más vendido
  const byProduct = new Map<string, { name: string; count: number }>();
  for (const s of productSales) {
    const entry = byProduct.get(s.productId) ?? { name: s.product.name, count: 0 };
    entry.count += s.quantity;
    byProduct.set(s.productId, entry);
  }
  const topProducts = Array.from(byProduct.values())
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  // Tasa de clientes recurrentes: de los que tuvieron >=1 cita completada en el rango, cuántos tienen >=2
  const apptCountByClient = new Map<string, number>();
  for (const a of appointments) {
    apptCountByClient.set(a.clientId, (apptCountByClient.get(a.clientId) ?? 0) + 1);
  }
  const clientsWithAtLeastOne = apptCountByClient.size;
  const clientsWithTwoOrMore = Array.from(apptCountByClient.values()).filter((c) => c >= 2).length;
  const repeatRate = clientsWithAtLeastOne === 0 ? 0 : (clientsWithTwoOrMore / clientsWithAtLeastOne) * 100;

  const fromValue = rangeStart.toISOString().slice(0, 10);
  const toValue = rangeEnd.toISOString().slice(0, 10);

  return (
    <div>
      <h1 className="text-2xl font-bold">Analítica</h1>
      <p className="mt-1 text-sm text-cream/60">
        Calculado sobre citas completadas y ventas de producto en el rango elegido.
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

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <div className="rounded-lg border border-white/10 bg-charcoal p-6">
          <h2 className="text-lg font-semibold">Horas pico</h2>
          <div className="mt-4 space-y-2">
            {peakHours.map((h) => (
              <div key={h.hour} className="flex items-center gap-3 text-sm">
                <span className="w-12 shrink-0 text-cream/60">{h.hour}:00</span>
                <div className="h-4 flex-1 rounded bg-white/5">
                  <div
                    className="h-4 rounded bg-gold"
                    style={{ width: `${(h.count / maxHourCount) * 100}%` }}
                  />
                </div>
                <span className="w-6 shrink-0 text-right text-cream/60">{h.count}</span>
              </div>
            ))}
            {peakHours.length === 0 && (
              <p className="text-sm text-cream/40">No hay citas completadas en este rango.</p>
            )}
          </div>
        </div>

        <div className="rounded-lg border border-white/10 bg-charcoal p-6">
          <h2 className="text-lg font-semibold">Clientes recurrentes</h2>
          <p className="mt-4 text-4xl font-bold text-gold">{repeatRate.toFixed(0)}%</p>
          <p className="mt-1 text-sm text-cream/60">
            {clientsWithTwoOrMore} de {clientsWithAtLeastOne} clientes con actividad en el rango
            tuvieron 2 o más citas completadas.
          </p>
        </div>

        <div className="rounded-lg border border-white/10 bg-charcoal p-6">
          <h2 className="text-lg font-semibold">Servicios más vendidos</h2>
          <div className="mt-4 space-y-2">
            {topServices.map((s, i) => (
              <div key={s.name} className="flex items-center justify-between text-sm">
                <span>{i + 1}. {s.name}</span>
                <span className="text-gold">{s.count}</span>
              </div>
            ))}
            {topServices.length === 0 && (
              <p className="text-sm text-cream/40">No hay citas completadas en este rango.</p>
            )}
          </div>
        </div>

        <div className="rounded-lg border border-white/10 bg-charcoal p-6">
          <h2 className="text-lg font-semibold">Productos más vendidos</h2>
          <div className="mt-4 space-y-2">
            {topProducts.map((p, i) => (
              <div key={p.name} className="flex items-center justify-between text-sm">
                <span>{i + 1}. {p.name}</span>
                <span className="text-gold">{p.count}</span>
              </div>
            ))}
            {topProducts.length === 0 && (
              <p className="text-sm text-cream/40">No hay ventas de producto en este rango.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
