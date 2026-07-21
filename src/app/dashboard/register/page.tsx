import { requireSession } from "@/lib/guard";
import { prisma } from "@/lib/db";
import { getVocabulary } from "@/lib/vocabulary";
import { openCashSession, closeCashSession } from "@/app/actions/cashRegister";

const ERRORS: Record<string, string> = {
  CAJA_YA_ABIERTA: "Ya hay una caja abierta para esa selección.",
  CAJA_NO_ENCONTRADA: "No se encontró esa caja abierta.",
};

export default async function RegisterPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const session = await requireSession();
  const { error } = await searchParams;

  const business = await prisma.business.findUnique({ where: { id: session.businessId } });
  const vocab = getVocabulary(business?.category ?? "OTHER");

  const [openSessions, closedSessions, staffMembers] = await Promise.all([
    prisma.cashSession.findMany({
      where: { businessId: session.businessId, status: "OPEN" },
      include: { staff: true },
      orderBy: { openedAt: "asc" },
    }),
    prisma.cashSession.findMany({
      where: { businessId: session.businessId, status: "CLOSED" },
      include: { staff: true },
      orderBy: { closedAt: "desc" },
      take: 30,
    }),
    prisma.staff.findMany({
      where: { businessId: session.businessId, active: true },
      orderBy: { name: "asc" },
    }),
  ]);

  const now = new Date();
  const openSessionsWithExpected = await Promise.all(
    openSessions.map(async (s) => {
      const agg = await prisma.appointment.aggregate({
        where: {
          businessId: session.businessId,
          ...(s.staffId ? { staffId: s.staffId } : {}),
          paymentMethod: "CASH",
          paymentStatus: "PAID",
          paidAt: { gte: s.openedAt, lte: now },
        },
        _sum: { priceCharged: true },
      });
      // Las ventas de producto no se pueden atribuir a un miembro puntual del
      // roster, así que solo suman al esperado de la caja general.
      const productAgg = s.staffId
        ? { _sum: { total: null as number | null } }
        : await prisma.productSale.aggregate({
            where: {
              businessId: session.businessId,
              paymentMethod: "CASH",
              createdAt: { gte: s.openedAt, lte: now },
            },
            _sum: { total: true },
          });
      return {
        ...s,
        liveExpected: s.openingAmount + (agg._sum.priceCharged ?? 0) + (productAgg._sum.total ?? 0),
      };
    })
  );

  return (
    <div>
      <h1 className="text-2xl font-bold">Caja</h1>
      <p className="mt-1 text-sm text-cream/60">
        Abre una caja general o por {vocab.staffSingular.toLowerCase()}. Al cerrarla, comparamos
        lo esperado (efectivo cobrado durante la sesión) contra lo contado, y la diferencia queda
        guardada para siempre.
      </p>

      {error && (
        <p className="mt-4 rounded-md bg-red-500/10 px-3 py-2 text-sm text-red-400">
          {ERRORS[error] ?? "Ocurrió un error, intenta de nuevo."}
        </p>
      )}

      <h2 className="mt-8 text-lg font-semibold">Cajas abiertas</h2>
      <div className="mt-3 space-y-4">
        {openSessionsWithExpected.map((s) => (
          <div key={s.id} className="rounded-lg border border-white/10 bg-charcoal p-6">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <p className="font-semibold">{s.staff ? s.staff.name : "Caja general"}</p>
                <p className="text-xs text-cream/50">
                  Abierta {s.openedAt.toLocaleString("es", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" })}{" "}
                  · Monto inicial ${s.openingAmount.toFixed(2)}
                </p>
              </div>
              <p className="text-lg font-bold text-gold">${s.liveExpected.toFixed(2)} esperado</p>
            </div>
            <form action={closeCashSession.bind(null, s.id)} className="mt-4 flex flex-wrap items-end gap-3">
              <div>
                <label className="text-sm text-cream/70">Monto contado</label>
                <input
                  type="number"
                  name="countedAmount"
                  step="0.01"
                  min={0}
                  required
                  className="mt-1 block w-40 rounded-md border border-white/20 bg-ink px-3 py-2 outline-none focus:border-gold"
                />
              </div>
              <div className="flex-1">
                <label className="text-sm text-cream/70">Notas (opcional)</label>
                <input
                  name="notes"
                  className="mt-1 block w-full rounded-md border border-white/20 bg-ink px-3 py-2 outline-none focus:border-gold"
                />
              </div>
              <button
                type="submit"
                className="rounded-md bg-gold px-4 py-2 font-semibold text-ink hover:bg-gold/90"
              >
                Cerrar caja
              </button>
            </form>
          </div>
        ))}
        {openSessionsWithExpected.length === 0 && (
          <p className="rounded-lg border border-white/10 bg-charcoal p-6 text-center text-sm text-cream/40">
            No hay cajas abiertas.
          </p>
        )}
      </div>

      <div className="mt-6 max-w-lg rounded-lg border border-white/10 bg-charcoal p-6">
        <h3 className="font-semibold">Abrir caja</h3>
        <form action={openCashSession} className="mt-4 space-y-4">
          <div>
            <label className="text-sm text-cream/70">{vocab.staffSingular}</label>
            <select
              name="staffId"
              defaultValue=""
              className="mt-1 w-full rounded-md border border-white/20 bg-ink px-3 py-2 outline-none focus:border-gold"
            >
              <option value="">Caja general (todo el negocio)</option>
              {staffMembers.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-sm text-cream/70">Monto inicial</label>
            <input
              type="number"
              name="openingAmount"
              step="0.01"
              min={0}
              defaultValue={0}
              className="mt-1 w-full rounded-md border border-white/20 bg-ink px-3 py-2 outline-none focus:border-gold"
            />
          </div>
          <button
            type="submit"
            className="rounded-md bg-gold px-4 py-2 font-semibold text-ink hover:bg-gold/90"
          >
            Abrir caja
          </button>
        </form>
      </div>

      <h2 className="mt-10 text-lg font-semibold">Historial de cierres</h2>
      <div className="mt-3 overflow-hidden rounded-lg border border-white/10">
        <table className="w-full text-sm">
          <thead className="bg-charcoal text-left text-cream/60">
            <tr>
              <th className="px-4 py-2">Cerrada</th>
              <th className="px-4 py-2">{vocab.staffSingular}</th>
              <th className="px-4 py-2">Esperado</th>
              <th className="px-4 py-2">Contado</th>
              <th className="px-4 py-2">Diferencia</th>
              <th className="px-4 py-2">Notas</th>
            </tr>
          </thead>
          <tbody>
            {closedSessions.map((s) => (
              <tr key={s.id} className="border-t border-white/5">
                <td className="px-4 py-2 text-cream/70">
                  {s.closedAt?.toLocaleString("es", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" })}
                </td>
                <td className="px-4 py-2">{s.staff ? s.staff.name : "General"}</td>
                <td className="px-4 py-2 text-cream/70">${(s.expectedAmount ?? 0).toFixed(2)}</td>
                <td className="px-4 py-2 text-cream/70">${(s.countedAmount ?? 0).toFixed(2)}</td>
                <td
                  className={`px-4 py-2 font-semibold ${
                    (s.difference ?? 0) === 0
                      ? "text-cream/70"
                      : (s.difference ?? 0) > 0
                        ? "text-green-400"
                        : "text-red-400"
                  }`}
                >
                  {(s.difference ?? 0) > 0 ? "+" : ""}
                  {(s.difference ?? 0).toFixed(2)}
                </td>
                <td className="px-4 py-2 text-cream/50">{s.notes ?? "—"}</td>
              </tr>
            ))}
            {closedSessions.length === 0 && (
              <tr>
                <td className="px-4 py-6 text-center text-cream/40" colSpan={6}>
                  Aún no hay cierres registrados.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
