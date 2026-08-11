import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { requireSession } from "@/lib/guard";
import { prisma } from "@/lib/db";
import { formatCOP } from "@/lib/money";
import { canOperateDrawer, getSessionMovements } from "@/lib/cashSession";

const PAYMENT_LABEL: Record<string, string> = {
  CASH: "Efectivo",
  CARD_IN_PERSON: "Tarjeta",
  TRANSFER: "Transferencia",
};

export default async function CashSessionDetailPage({
  params,
}: {
  params: Promise<{ sessionId: string }>;
}) {
  const { sessionId } = await params;
  const session = await requireSession();
  const isOwner = session.role === "OWNER";

  const cashSession = await prisma.cashSession.findFirst({
    where: { id: sessionId, businessId: session.businessId },
    include: { staff: true, openedBy: true, closedBy: true },
  });
  if (!cashSession) notFound();

  const isOpen = cashSession.status === "OPEN";
  // Mientras la caja sigue abierta, solo el dueño puede consultar el
  // esperado en vivo — si quien la opera también pudiera verlo, el conteo a
  // ciegas del cierre dejaría de servir para algo.
  const allowed = isOpen ? isOwner : isOwner || canOperateDrawer(session, cashSession.staffId);
  if (!allowed) redirect("/dashboard/register?error=SIN_PERMISO");

  const { cashTotal, cardTotal, transferTotal, salesCount, movements } = await getSessionMovements(
    cashSession,
    cashSession.closedAt ?? new Date()
  );

  const drawerLabel = cashSession.staff?.name ?? "Caja general";
  const difference = cashSession.difference ?? 0;
  const matched = difference === 0;

  return (
    <div>
      <Link href="/dashboard/register" className="text-sm text-cream/50 hover:text-gold">
        ← Volver a Caja
      </Link>

      <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">{drawerLabel}</h1>
          <p className="mt-1 text-sm text-cream/60">
            {isOpen ? "Caja abierta" : "Caja cerrada"} · Abierta{" "}
            {cashSession.openedAt.toLocaleString("es", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" })}
            {" "}por {cashSession.openedBy.name} · Monto inicial {formatCOP(cashSession.openingAmount)}
          </p>
        </div>
        {!isOpen && (
          <div className="flex gap-2">
            <a
              href={`/api/receipt/cash-session/${cashSession.id}?tipo=resumida`}
              className="rounded-md border border-white/20 px-3 py-1.5 text-sm hover:border-gold hover:text-gold"
            >
              Tirilla resumida
            </a>
            <a
              href={`/api/receipt/cash-session/${cashSession.id}?tipo=detallada`}
              className="rounded-md border border-white/20 px-3 py-1.5 text-sm hover:border-gold hover:text-gold"
            >
              Tirilla detallada
            </a>
          </div>
        )}
      </div>

      {isOpen ? (
        <div className="mt-6 rounded-lg border border-white/10 bg-charcoal p-6">
          <p className="text-sm text-cream/60">
            Vista en vivo, solo visible para el dueño. Lo recaudado hasta ahora en esta caja:
          </p>
          <div className="mt-3 grid grid-cols-2 gap-4 sm:grid-cols-4">
            <div>
              <p className="text-xs uppercase tracking-wide text-cream/40">Efectivo</p>
              <p className="text-lg font-semibold">{formatCOP(cashSession.openingAmount + cashTotal)}</p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-wide text-cream/40">Tarjeta</p>
              <p className="text-lg font-semibold">{formatCOP(cardTotal)}</p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-wide text-cream/40">Transferencias</p>
              <p className="text-lg font-semibold">{formatCOP(transferTotal)}</p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-wide text-cream/40">Ventas</p>
              <p className="text-lg font-semibold">{salesCount}</p>
            </div>
          </div>
        </div>
      ) : (
        <div className="mt-6 overflow-hidden rounded-lg border border-white/10">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-charcoal text-left text-cream/60">
                <tr>
                  <th className="px-4 py-2"></th>
                  <th className="px-4 py-2">Recaudado</th>
                  <th className="px-4 py-2">Esperado</th>
                  <th className="px-4 py-2">Diferencia</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-t border-white/5">
                  <td className="px-4 py-2 font-medium">Efectivo</td>
                  <td className="px-4 py-2 text-cream/70">{formatCOP(cashSession.countedAmount ?? 0)}</td>
                  <td className="px-4 py-2 text-cream/70">{formatCOP(cashSession.expectedAmount ?? 0)}</td>
                  <td
                    className={`px-4 py-2 font-semibold ${
                      matched ? "text-cream/70" : difference > 0 ? "text-green-400" : "text-red-400"
                    }`}
                  >
                    {difference > 0 ? "+" : ""}
                    {formatCOP(difference)}
                  </td>
                </tr>
                <tr className="border-t border-white/5">
                  <td className="px-4 py-2 font-medium">Tarjeta en persona</td>
                  <td className="px-4 py-2 text-cream/70" colSpan={2}>
                    {formatCOP(cashSession.cardAmount ?? 0)}
                  </td>
                  <td className="px-4 py-2 text-cream/50">— confiado del sistema</td>
                </tr>
                <tr className="border-t border-white/5">
                  <td className="px-4 py-2 font-medium">Transferencias</td>
                  <td className="px-4 py-2 text-cream/70" colSpan={2}>
                    {formatCOP(cashSession.transferAmount ?? 0)}
                  </td>
                  <td className="px-4 py-2 text-cream/50">— anticipos/tarjetas de regalo confirmados</td>
                </tr>
                <tr className="border-t border-white/10 bg-charcoal/50">
                  <td className="px-4 py-2 font-semibold">Total</td>
                  <td className="px-4 py-2 font-semibold" colSpan={3}>
                    {formatCOP(
                      (cashSession.countedAmount ?? 0) + (cashSession.cardAmount ?? 0) + (cashSession.transferAmount ?? 0)
                    )}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
          <div
            className={`px-4 py-3 text-center text-sm font-semibold ${
              matched ? "bg-green-500/10 text-green-400" : difference > 0 ? "bg-green-500/10 text-green-400" : "bg-red-500/10 text-red-400"
            }`}
          >
            {matched
              ? "Recaudo coincide"
              : difference > 0
                ? `Sobrante de ${formatCOP(difference)}`
                : `Faltante de ${formatCOP(Math.abs(difference))}`}
          </div>
          {cashSession.notes && (
            <p className="border-t border-white/5 px-4 py-3 text-sm text-cream/60">
              <span className="font-medium text-cream/80">Notas:</span> {cashSession.notes}
            </p>
          )}
          <p className="border-t border-white/5 px-4 py-3 text-xs text-cream/40">
            Cerrada {cashSession.closedAt?.toLocaleString("es", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" })}
            {" "}por {cashSession.closedBy?.name ?? "—"}
          </p>
        </div>
      )}

      <h2 className="mt-8 text-lg font-semibold">Movimientos de la sesión</h2>
      <div className="mt-3 overflow-hidden rounded-lg border border-white/10">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-charcoal text-left text-cream/60">
              <tr>
                <th className="px-4 py-2">Hora</th>
                <th className="px-4 py-2">Concepto</th>
                <th className="px-4 py-2">Medio de pago</th>
                <th className="px-4 py-2">Valor</th>
              </tr>
            </thead>
            <tbody>
              {movements.map((m, i) => (
                <tr key={i} className="border-t border-white/5">
                  <td className="px-4 py-2 text-cream/60">
                    {m.at.toLocaleString("es", { hour: "2-digit", minute: "2-digit" })}
                  </td>
                  <td className="px-4 py-2">{m.label}</td>
                  <td className="px-4 py-2 text-cream/60">{PAYMENT_LABEL[m.method] ?? m.method}</td>
                  <td className="px-4 py-2 text-cream/70">{formatCOP(m.amount)}</td>
                </tr>
              ))}
              {movements.length === 0 && (
                <tr>
                  <td className="px-4 py-6 text-center text-cream/40" colSpan={4}>
                    Sin movimientos todavía.
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
