import { requirePermission } from "@/lib/guard";
import { prisma } from "@/lib/db";
import { updateBusinessSettings } from "@/app/actions/settings";
import { CATEGORY_OPTIONS } from "@/lib/vocabulary";

const ERRORS: Record<string, string> = {
  DATOS_PAGO_REQUERIDOS:
    "Para exigir pago anticipado necesitas configurar al menos un QR, llave Bre-B o cuenta.",
};

export default async function SettingsPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const session = await requirePermission("settings");
  const { error } = await searchParams;
  const business = await prisma.business.findUnique({ where: { id: session.businessId } });
  if (!business) return null;

  return (
    <div>
      <h1 className="text-2xl font-bold">Configuración</h1>

      {error && (
        <p className="mt-4 rounded-md bg-red-500/10 px-3 py-2 text-sm text-red-400">
          {ERRORS[error] ?? "Ocurrió un error, intenta de nuevo."}
        </p>
      )}

      <form action={updateBusinessSettings} encType="multipart/form-data" className="mt-6 space-y-6">
        <div className="max-w-lg rounded-lg border border-white/10 bg-charcoal p-6">
          <h2 className="text-lg font-semibold">Datos del negocio</h2>
          <div className="mt-4 space-y-4">
            <div>
              <label className="text-sm text-cream/70">Tipo de negocio</label>
              <select
                name="category"
                defaultValue={business.category}
                className="mt-1 w-full rounded-md border border-white/20 bg-ink px-3 py-2 outline-none focus:border-gold"
              >
                {CATEGORY_OPTIONS.map((c) => (
                  <option key={c.value} value={c.value}>
                    {c.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-sm text-cream/70">Teléfono del negocio</label>
              <input
                name="phone"
                defaultValue={business.phone ?? ""}
                className="mt-1 w-full rounded-md border border-white/20 bg-ink px-3 py-2 outline-none focus:border-gold"
              />
            </div>
            <div>
              <label className="text-sm text-cream/70">Dirección</label>
              <input
                name="address"
                defaultValue={business.address ?? ""}
                className="mt-1 w-full rounded-md border border-white/20 bg-ink px-3 py-2 outline-none focus:border-gold"
              />
            </div>
          </div>
        </div>

        <div className="max-w-lg rounded-lg border border-white/10 bg-charcoal p-6">
          <h2 className="text-lg font-semibold">Política de cancelación</h2>
          <p className="mt-1 text-sm text-cream/60">
            Si un cliente cancela con menos anticipación que este mínimo, la cancelación queda
            marcada como tardía y suma una sanción a su historial (visible en{" "}
            <span className="text-gold">Clientes</span>). Una inasistencia (no-show) siempre suma
            sanción, sin importar este valor.
          </p>
          <div className="mt-4">
            <label className="text-sm text-cream/70">Horas mínimas de anticipación</label>
            <input
              type="number"
              name="cancellationNoticeHours"
              min={0}
              defaultValue={business.cancellationNoticeHours}
              className="mt-1 w-full rounded-md border border-white/20 bg-ink px-3 py-2 outline-none focus:border-gold"
            />
          </div>
        </div>

        <div className="max-w-lg rounded-lg border border-white/10 bg-charcoal p-6">
          <h2 className="text-lg font-semibold">Recordatorios de citas</h2>
          <p className="mt-1 text-sm text-cream/60">
            Todavía no está conectado un proveedor real de envío (próximamente WhatsApp, SMS y
            correo). Puedes dejar configurado el canal y la anticipación desde ahora.
          </p>
          <div className="mt-4 space-y-4">
            <div>
              <label className="text-sm text-cream/70">Canal</label>
              <select
                name="reminderChannel"
                defaultValue={business.reminderChannel}
                className="mt-1 w-full rounded-md border border-white/20 bg-ink px-3 py-2 outline-none focus:border-gold"
              >
                <option value="NONE">Sin recordatorios</option>
                <option value="EMAIL">Correo</option>
                <option value="SMS">SMS</option>
                <option value="WHATSAPP">WhatsApp</option>
              </select>
            </div>
            <div>
              <label className="text-sm text-cream/70">Horas de anticipación</label>
              <input
                type="number"
                name="reminderHoursBefore"
                min={1}
                defaultValue={business.reminderHoursBefore}
                className="mt-1 w-full rounded-md border border-white/20 bg-ink px-3 py-2 outline-none focus:border-gold"
              />
            </div>
          </div>
        </div>

        <div className="max-w-lg rounded-lg border border-white/10 bg-charcoal p-6">
          <h2 className="text-lg font-semibold">Programa de puntos</h2>
          <p className="mt-1 text-sm text-cream/60">
            Cuando está activo, cada cliente suma puntos por cada cita marcada como completada y
            puede canjear una recompensa al llegar al umbral (visible en su ficha en{" "}
            <span className="text-gold">Clientes</span>).
          </p>
          <div className="mt-4 space-y-4">
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                name="loyaltyEnabled"
                defaultChecked={business.loyaltyEnabled}
              />
              Activar programa de puntos
            </label>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm text-cream/70">Puntos por visita</label>
                <input
                  type="number"
                  name="loyaltyPointsPerVisit"
                  min={1}
                  defaultValue={business.loyaltyPointsPerVisit}
                  className="mt-1 w-full rounded-md border border-white/20 bg-ink px-3 py-2 outline-none focus:border-gold"
                />
              </div>
              <div>
                <label className="text-sm text-cream/70">Puntos para recompensa</label>
                <input
                  type="number"
                  name="loyaltyRewardThreshold"
                  min={1}
                  defaultValue={business.loyaltyRewardThreshold}
                  className="mt-1 w-full rounded-md border border-white/20 bg-ink px-3 py-2 outline-none focus:border-gold"
                />
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-lg rounded-lg border border-white/10 bg-charcoal p-6">
          <h2 className="text-lg font-semibold">Caja</h2>
          <p className="mt-1 text-sm text-cream/60">
            Si al cerrar una caja la diferencia entre lo esperado y lo contado supera este monto
            (a favor o en contra), te avisamos por correo.
          </p>
          <div className="mt-4">
            <label className="text-sm text-cream/70">Umbral de alerta ($)</label>
            <input
              type="number"
              name="cashDiscrepancyAlertThreshold"
              step="0.01"
              min={0}
              defaultValue={business.cashDiscrepancyAlertThreshold}
              className="mt-1 w-full rounded-md border border-white/20 bg-ink px-3 py-2 outline-none focus:border-gold"
            />
          </div>
        </div>

        <div className="max-w-lg rounded-lg border border-white/10 bg-charcoal p-6">
          <h2 className="text-lg font-semibold">Pago anticipado</h2>
          <p className="mt-1 text-sm text-cream/60">
            Sin pasarela conectada, el cliente paga por transferencia/QR/Bre-B directo a tu
            cuenta y envía el comprobante por WhatsApp. Tú confirmas el pago manualmente desde{" "}
            <span className="text-gold">Citas</span> — si no lo confirmas a tiempo, el horario se
            libera solo.
          </p>
          <div className="mt-4 space-y-4">
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                name="advancePaymentEnabled"
                defaultChecked={business.advancePaymentEnabled}
              />
              Exigir pago anticipado para reservar en línea
            </label>

            <div className="flex items-center gap-4">
              {business.paymentQrUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={business.paymentQrUrl}
                  alt="QR de pago"
                  className="h-20 w-20 rounded-md object-cover"
                />
              ) : (
                <div className="flex h-20 w-20 items-center justify-center rounded-md bg-white/5 text-xs text-cream/40">
                  Sin QR
                </div>
              )}
              <div className="flex-1">
                <label className="text-sm text-cream/70">Imagen del QR (opcional)</label>
                <input
                  type="file"
                  name="paymentQr"
                  accept="image/*"
                  className="mt-1 w-full text-sm text-cream/70 file:mr-3 file:rounded-md file:border-0 file:bg-gold file:px-3 file:py-1.5 file:text-sm file:font-semibold file:text-ink"
                />
              </div>
            </div>

            <div>
              <label className="text-sm text-cream/70">Llave Bre-B (opcional)</label>
              <input
                name="paymentBrebKey"
                defaultValue={business.paymentBrebKey ?? ""}
                className="mt-1 w-full rounded-md border border-white/20 bg-ink px-3 py-2 outline-none focus:border-gold"
              />
            </div>

            <div>
              <label className="text-sm text-cream/70">Cuenta(s) bancaria(s) (opcional)</label>
              <textarea
                name="paymentAccountInfo"
                rows={3}
                placeholder="Banco, tipo de cuenta, número, titular"
                defaultValue={business.paymentAccountInfo ?? ""}
                className="mt-1 w-full rounded-md border border-white/20 bg-ink px-3 py-2 outline-none focus:border-gold"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm text-cream/70">
                  Monto de la seña (vacío = precio completo)
                </label>
                <input
                  type="number"
                  name="advancePaymentAmount"
                  step="0.01"
                  min={0}
                  placeholder="Precio completo"
                  defaultValue={business.advancePaymentAmount ?? ""}
                  className="mt-1 w-full rounded-md border border-white/20 bg-ink px-3 py-2 outline-none focus:border-gold"
                />
              </div>
              <div>
                <label className="text-sm text-cream/70">Horas para confirmar el pago</label>
                <input
                  type="number"
                  name="advancePaymentExpirationHours"
                  min={1}
                  defaultValue={business.advancePaymentExpirationHours}
                  className="mt-1 w-full rounded-md border border-white/20 bg-ink px-3 py-2 outline-none focus:border-gold"
                />
              </div>
            </div>
          </div>
        </div>

        <button
          type="submit"
          className="rounded-md bg-gold px-4 py-2 font-semibold text-ink hover:bg-gold/90"
        >
          Guardar cambios
        </button>
      </form>
    </div>
  );
}
