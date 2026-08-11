import { redirect } from "next/navigation";
import { requirePermission } from "@/lib/guard";
import { prisma } from "@/lib/db";
import {
  issueGiftCard,
  cancelGiftCard,
  confirmGiftCardPayment,
  rejectGiftCardPayment,
} from "@/app/actions/giftCards";
import { formatCOP } from "@/lib/money";

const ERRORS: Record<string, string> = {
  MONTO_INVALIDO: "El monto debe ser mayor a 0.",
  TARJETA_YA_USADA: "Esa tarjeta ya tiene saldo redimido — no se puede cancelar.",
};

const STATUS_LABEL: Record<string, { label: string; className: string }> = {
  PENDING_PAYMENT: { label: "Por confirmar", className: "bg-yellow-500/20 text-yellow-400" },
  ACTIVE: { label: "Activa", className: "bg-green-500/20 text-green-400" },
  CANCELLED: { label: "Cancelada", className: "bg-white/10 text-cream/50" },
};

export default async function GiftCardsPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const session = await requirePermission("catalog");
  const { error } = await searchParams;

  const business = await prisma.business.findUnique({ where: { id: session.businessId } });
  if (!business?.giftCardsEnabled) redirect("/dashboard");

  const cards = await prisma.giftCard.findMany({
    where: { businessId: session.businessId },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div>
      <h1 className="text-2xl font-bold">Tarjetas de regalo</h1>
      <p className="mt-1 text-sm text-cream/60">
        Emítelas en persona o confirma las que un cliente compró en línea. El saldo se redime
        desde Citas, Catálogo o Tiendita.
      </p>

      {error && (
        <p className="mt-4 rounded-md bg-red-500/10 px-3 py-2 text-sm text-red-400">
          {ERRORS[error] ?? "Ocurrió un error, intenta de nuevo."}
        </p>
      )}

      <div className="mt-6 overflow-hidden rounded-lg border border-white/10">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-charcoal text-left text-cream/60">
              <tr>
                <th className="px-4 py-2">Código</th>
                <th className="px-4 py-2">Saldo</th>
                <th className="px-4 py-2">Destinatario / Comprador</th>
                <th className="px-4 py-2">Vence</th>
                <th className="px-4 py-2">Estado</th>
                <th className="px-4 py-2"></th>
              </tr>
            </thead>
            <tbody>
              {cards.map((c) => {
                const status = STATUS_LABEL[c.status] ?? { label: c.status, className: "bg-white/10 text-cream/50" };
                return (
                  <tr key={c.id} className="border-t border-white/5">
                    <td className="px-4 py-2 font-mono font-medium">{c.code}</td>
                    <td className="px-4 py-2 text-cream/70">
                      {formatCOP(c.balance)} <span className="text-cream/40">/ {formatCOP(c.initialAmount)}</span>
                    </td>
                    <td className="px-4 py-2 text-cream/70">
                      {c.recipientName ?? c.purchaserName ?? "—"}
                      {c.recipientName && c.purchaserName && (
                        <span className="text-cream/40"> (de {c.purchaserName})</span>
                      )}
                    </td>
                    <td className="px-4 py-2 text-cream/70">
                      {c.expiresAt ? c.expiresAt.toLocaleDateString("es") : "—"}
                    </td>
                    <td className="px-4 py-2">
                      <span className={`rounded-full px-2 py-1 text-xs ${status.className}`}>{status.label}</span>
                    </td>
                    <td className="px-4 py-2 text-right">
                      {c.status === "PENDING_PAYMENT" && (
                        <div className="flex justify-end gap-2 text-xs">
                          <form action={confirmGiftCardPayment.bind(null, c.id)}>
                            <button className="text-green-400 hover:underline">Confirmar</button>
                          </form>
                          <form action={rejectGiftCardPayment.bind(null, c.id)}>
                            <button className="text-red-400 hover:underline">Rechazar</button>
                          </form>
                        </div>
                      )}
                      {c.status === "ACTIVE" && c.balance === c.initialAmount && (
                        <form action={cancelGiftCard.bind(null, c.id)}>
                          <button className="text-xs text-red-400 hover:underline">Cancelar</button>
                        </form>
                      )}
                    </td>
                  </tr>
                );
              })}
              {cards.length === 0 && (
                <tr>
                  <td className="px-4 py-6 text-center text-cream/40" colSpan={6}>
                    Aún no hay tarjetas de regalo.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="mt-8 max-w-lg rounded-lg border border-white/10 bg-charcoal p-6">
        <h2 className="text-lg font-semibold">Emitir tarjeta de regalo</h2>
        <p className="mt-1 text-sm text-cream/60">
          Para cuando el cliente la compra en persona y paga ahí mismo.
        </p>
        <form action={issueGiftCard} className="mt-4 space-y-4">
          <div>
            <label className="text-sm text-cream/70">Monto</label>
            <input
              type="number"
              name="amount"
              min={0}
              step="1"
              required
              className="mt-1 w-full rounded-md border border-white/20 bg-ink px-3 py-2 outline-none focus:border-gold"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm text-cream/70">Para (destinatario, opcional)</label>
              <input
                name="recipientName"
                className="mt-1 w-full rounded-md border border-white/20 bg-ink px-3 py-2 outline-none focus:border-gold"
              />
            </div>
            <div>
              <label className="text-sm text-cream/70">Su teléfono (opcional)</label>
              <input
                name="recipientPhone"
                className="mt-1 w-full rounded-md border border-white/20 bg-ink px-3 py-2 outline-none focus:border-gold"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm text-cream/70">Comprador (opcional)</label>
              <input
                name="purchaserName"
                className="mt-1 w-full rounded-md border border-white/20 bg-ink px-3 py-2 outline-none focus:border-gold"
              />
            </div>
            <div>
              <label className="text-sm text-cream/70">Su teléfono (opcional)</label>
              <input
                name="purchaserPhone"
                className="mt-1 w-full rounded-md border border-white/20 bg-ink px-3 py-2 outline-none focus:border-gold"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm text-cream/70">Vence (opcional)</label>
              <input
                type="date"
                name="expiresAt"
                className="mt-1 w-full rounded-md border border-white/20 bg-ink px-3 py-2 outline-none focus:border-gold"
              />
            </div>
            <div>
              <label className="text-sm text-cream/70">Método de pago</label>
              <select
                name="paymentMethod"
                className="mt-1 w-full rounded-md border border-white/20 bg-ink px-3 py-2 outline-none focus:border-gold"
              >
                <option value="CASH">Efectivo</option>
                <option value="CARD_IN_PERSON">Tarjeta</option>
              </select>
            </div>
          </div>
          <button type="submit" className="rounded-md bg-gold px-4 py-2 font-semibold text-ink hover:bg-gold/90">
            Emitir tarjeta
          </button>
        </form>
      </div>
    </div>
  );
}
