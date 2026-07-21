import { requirePermission } from "@/lib/guard";
import { prisma } from "@/lib/db";
import { getVocabulary } from "@/lib/vocabulary";
import { closePayrollPeriod } from "@/app/actions/payroll";

const PAYROLL_ERRORS: Record<string, string> = {
  RANGO_INVALIDO: "Elige un rango de fechas válido antes de cerrar el período.",
  SIN_DATOS: "No hay citas completadas con ingreso en ese rango, no se cerró ningún pago.",
};

export default async function ReportsPage({
  searchParams,
}: {
  searchParams: Promise<{ from?: string; to?: string; error?: string; paid?: string }>;
}) {
  const session = await requirePermission("reports");
  const business = await prisma.business.findUnique({ where: { id: session.businessId } });
  const vocab = getVocabulary(business?.category ?? "OTHER");
  const { from, to, error, paid } = await searchParams;

  const rangeStart = from ? new Date(`${from}T00:00:00`) : new Date(new Date().setDate(new Date().getDate() - 30));
  const rangeEnd = to ? new Date(`${to}T23:59:59`) : new Date();

  const appointments = await prisma.appointment.findMany({
    where: {
      businessId: session.businessId,
      status: "COMPLETED",
      startTime: { gte: rangeStart, lte: rangeEnd },
    },
    include: { staff: true, service: true },
  });

  const byStaff = new Map<
    string,
    { name: string; commissionPercent: number | null; count: number; revenue: number }
  >();

  for (const a of appointments) {
    const entry = byStaff.get(a.staffId) ?? {
      name: a.staff.name,
      commissionPercent: a.staff.commissionPercent,
      count: 0,
      revenue: 0,
    };
    entry.count += 1;
    entry.revenue += a.priceCharged ?? a.service.price;
    byStaff.set(a.staffId, entry);
  }

  const rows = Array.from(byStaff.values()).map((r) => {
    const commission = r.commissionPercent === null ? null : r.revenue * (r.commissionPercent / 100);
    return {
      ...r,
      commission,
      businessShare: r.revenue - (commission ?? 0),
    };
  });

  const totals = rows.reduce(
    (acc, r) => ({
      revenue: acc.revenue + r.revenue,
      commission: acc.commission + (r.commission ?? 0),
      businessShare: acc.businessShare + r.businessShare,
    }),
    { revenue: 0, commission: 0, businessShare: 0 }
  );

  const fromValue = rangeStart.toISOString().slice(0, 10);
  const toValue = rangeEnd.toISOString().slice(0, 10);

  const payoutHistory = await prisma.payrollPayout.findMany({
    where: { businessId: session.businessId },
    include: { staff: true },
    orderBy: { periodStart: "desc" },
    take: 30,
  });

  return (
    <div>
      <h1 className="text-2xl font-bold">Reporte de desempeño por {vocab.staffSingular.toLowerCase()}</h1>
      <p className="mt-1 text-sm text-cream/60">
        Calculado solo sobre citas marcadas como completadas. Si no configuraste comisión para
        alguien, aquí solo se muestra el ingreso que generó.
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
        <a
          href={`/api/export/reports?from=${fromValue}&to=${toValue}`}
          className="rounded-md border border-white/20 px-4 py-2 text-sm hover:border-gold hover:text-gold"
        >
          Exportar CSV
        </a>
      </form>

      {error && (
        <p className="mt-4 rounded-md bg-red-500/10 px-3 py-2 text-sm text-red-400">
          {PAYROLL_ERRORS[error] ?? "Ocurrió un error, intenta de nuevo."}
        </p>
      )}
      {paid && (
        <p className="mt-4 rounded-md bg-green-500/10 px-3 py-2 text-sm text-green-400">
          Período cerrado y marcado como pagado.
        </p>
      )}

      <form action={closePayrollPeriod} className="mt-4 flex items-center gap-3">
        <input type="hidden" name="from" value={fromValue} />
        <input type="hidden" name="to" value={toValue} />
        <button
          type="submit"
          className="rounded-md border border-gold px-4 py-2 text-sm font-semibold text-gold hover:bg-gold/10"
        >
          Cerrar y marcar como pagado este período
        </button>
        <p className="text-xs text-cream/50">
          Congela estos montos en el historial de abajo — útil para no calcular el mismo rango
          dos veces.
        </p>
      </form>

      <div className="mt-6 overflow-hidden rounded-lg border border-white/10">
        <table className="w-full text-sm">
          <thead className="bg-charcoal text-left text-cream/60">
            <tr>
              <th className="px-4 py-2">{vocab.staffSingular}</th>
              <th className="px-4 py-2">Citas completadas</th>
              <th className="px-4 py-2">Ingreso generado</th>
              <th className="px-4 py-2">% comisión</th>
              <th className="px-4 py-2">Le corresponde</th>
              <th className="px-4 py-2">Se queda el negocio</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.name} className="border-t border-white/5">
                <td className="px-4 py-2 font-medium">{r.name}</td>
                <td className="px-4 py-2">{r.count}</td>
                <td className="px-4 py-2">${r.revenue.toFixed(2)}</td>
                <td className="px-4 py-2">{r.commissionPercent === null ? "—" : `${r.commissionPercent}%`}</td>
                <td className="px-4 py-2 text-gold">
                  {r.commission === null ? "—" : `$${r.commission.toFixed(2)}`}
                </td>
                <td className="px-4 py-2">${r.businessShare.toFixed(2)}</td>
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
                <td className="px-4 py-2">${totals.businessShare.toFixed(2)}</td>
              </tr>
            </tfoot>
          )}
        </table>
      </div>

      <h2 className="mt-10 text-lg font-semibold">Historial de pagos por período</h2>
      <div className="mt-3 overflow-hidden rounded-lg border border-white/10">
        <table className="w-full text-sm">
          <thead className="bg-charcoal text-left text-cream/60">
            <tr>
              <th className="px-4 py-2">Período</th>
              <th className="px-4 py-2">{vocab.staffSingular}</th>
              <th className="px-4 py-2">Ingreso</th>
              <th className="px-4 py-2">% comisión</th>
              <th className="px-4 py-2">Pagado</th>
              <th className="px-4 py-2">Cerrado</th>
            </tr>
          </thead>
          <tbody>
            {payoutHistory.map((p) => (
              <tr key={p.id} className="border-t border-white/5">
                <td className="px-4 py-2 text-cream/70">
                  {p.periodStart.toLocaleDateString("es", { day: "2-digit", month: "2-digit" })} –{" "}
                  {p.periodEnd.toLocaleDateString("es", { day: "2-digit", month: "2-digit", year: "numeric" })}
                </td>
                <td className="px-4 py-2 font-medium">{p.staff.name}</td>
                <td className="px-4 py-2 text-cream/70">${p.revenue.toFixed(2)}</td>
                <td className="px-4 py-2 text-cream/70">
                  {p.commissionPercent === null ? "—" : `${p.commissionPercent}%`}
                </td>
                <td className="px-4 py-2 text-gold">${p.commissionAmount.toFixed(2)}</td>
                <td className="px-4 py-2 text-cream/50">
                  {p.createdAt.toLocaleDateString("es", { day: "2-digit", month: "2-digit", year: "numeric" })}
                </td>
              </tr>
            ))}
            {payoutHistory.length === 0 && (
              <tr>
                <td className="px-4 py-6 text-center text-cream/40" colSpan={6}>
                  Todavía no has cerrado ningún período de pago.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
