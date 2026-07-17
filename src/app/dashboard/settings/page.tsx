import { requireSession } from "@/lib/guard";
import { prisma } from "@/lib/db";
import { updateShopSettings } from "@/app/actions/settings";

export default async function SettingsPage() {
  const session = await requireSession();
  const shop = await prisma.shop.findUnique({ where: { id: session.shopId } });
  if (!shop) return null;

  return (
    <div>
      <h1 className="text-2xl font-bold">Configuración</h1>

      <div className="mt-6 max-w-lg rounded-lg border border-white/10 bg-charcoal p-6">
        <h2 className="text-lg font-semibold">Política de cancelación</h2>
        <p className="mt-1 text-sm text-cream/60">
          Si un cliente cancela con menos anticipación que este mínimo, la cancelación queda
          marcada como tardía y suma una sanción a su historial (visible en{" "}
          <span className="text-gold">Clientes</span>). Una inasistencia (no-show) siempre suma
          sanción, sin importar este valor.
        </p>

        <form action={updateShopSettings} className="mt-4 space-y-4">
          <div>
            <label className="text-sm text-cream/70">Horas mínimas de anticipación</label>
            <input
              type="number"
              name="cancellationNoticeHours"
              min={0}
              defaultValue={shop.cancellationNoticeHours}
              className="mt-1 w-full rounded-md border border-white/20 bg-ink px-3 py-2 outline-none focus:border-gold"
            />
          </div>
          <div>
            <label className="text-sm text-cream/70">Teléfono de la barbería</label>
            <input
              name="phone"
              defaultValue={shop.phone ?? ""}
              className="mt-1 w-full rounded-md border border-white/20 bg-ink px-3 py-2 outline-none focus:border-gold"
            />
          </div>
          <div>
            <label className="text-sm text-cream/70">Dirección</label>
            <input
              name="address"
              defaultValue={shop.address ?? ""}
              className="mt-1 w-full rounded-md border border-white/20 bg-ink px-3 py-2 outline-none focus:border-gold"
            />
          </div>
          <button
            type="submit"
            className="rounded-md bg-gold px-4 py-2 font-semibold text-ink hover:bg-gold/90"
          >
            Guardar cambios
          </button>
        </form>
      </div>
    </div>
  );
}
