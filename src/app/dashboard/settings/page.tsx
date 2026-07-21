import { requirePermission } from "@/lib/guard";
import { prisma } from "@/lib/db";
import { updateBusinessSettings } from "@/app/actions/settings";
import { CATEGORY_OPTIONS } from "@/lib/vocabulary";

export default async function SettingsPage() {
  const session = await requirePermission("settings");
  const business = await prisma.business.findUnique({ where: { id: session.businessId } });
  if (!business) return null;

  return (
    <div>
      <h1 className="text-2xl font-bold">Configuración</h1>

      <form action={updateBusinessSettings} className="mt-6 space-y-6">
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

        <button
          type="submit"
          className="rounded-md bg-gold px-4 py-2 font-semibold text-ink hover:bg-gold/90"
        >
          Guardar cambios
        </button>
      </form>

      <div className="mt-6 max-w-lg rounded-lg border border-white/10 bg-charcoal p-6">
        <h2 className="text-lg font-semibold">Pagos en línea</h2>
        <p className="mt-2 text-sm text-cream/60">
          Todavía no está conectado un proveedor de pagos (próximamente). Por ahora, marca cada
          cita como pagada en efectivo o con tarjeta directamente desde{" "}
          <span className="text-gold">Citas</span>.
        </p>
      </div>
    </div>
  );
}
