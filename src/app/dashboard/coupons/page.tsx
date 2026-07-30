import { requirePermission } from "@/lib/guard";
import { prisma } from "@/lib/db";
import { createCoupon, toggleCouponActive } from "@/app/actions/coupons";

const ERRORS: Record<string, string> = {
  CODIGO_REQUERIDO: "El código es obligatorio.",
  CODIGO_EN_USO: "Ya existe un cupón con ese código.",
  DESCUENTO_INVALIDO: "El descuento debe ser mayor a 0 (y máximo 100 si es porcentaje).",
  USOS_INVALIDOS: "El máximo de usos debe ser un número entero mayor a 0.",
};

export default async function CouponsPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const session = await requirePermission("catalog");
  const { error } = await searchParams;

  const coupons = await prisma.coupon.findMany({
    where: { businessId: session.businessId },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div>
      <h1 className="text-2xl font-bold">Cupones</h1>
      <p className="mt-1 text-sm text-cream/60">
        Códigos de descuento que el cliente puede aplicar al reservar en línea. No aplican a
        ventas de producto ni a citas sin cita previa.
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
                <th className="px-4 py-2">Descuento</th>
                <th className="px-4 py-2">Usos</th>
                <th className="px-4 py-2">Vence</th>
                <th className="px-4 py-2">Estado</th>
                <th className="px-4 py-2"></th>
              </tr>
            </thead>
            <tbody>
              {coupons.map((c) => (
                <tr key={c.id} className="border-t border-white/5">
                  <td className="px-4 py-2 font-medium">{c.code}</td>
                  <td className="px-4 py-2 text-cream/70">
                    {c.discountType === "PERCENT" ? `${c.discountValue}%` : `$${c.discountValue.toFixed(2)}`}
                  </td>
                  <td className="px-4 py-2 text-cream/70">
                    {c.usedCount}
                    {c.maxUses !== null ? ` / ${c.maxUses}` : ""}
                  </td>
                  <td className="px-4 py-2 text-cream/70">
                    {c.expiresAt
                      ? c.expiresAt.toLocaleDateString("es", { day: "2-digit", month: "2-digit", year: "numeric" })
                      : "—"}
                  </td>
                  <td className="px-4 py-2">
                    <span
                      className={`rounded-full px-2 py-1 text-xs ${
                        c.active ? "bg-green-500/20 text-green-400" : "bg-white/10 text-cream/50"
                      }`}
                    >
                      {c.active ? "Activo" : "Inactivo"}
                    </span>
                  </td>
                  <td className="px-4 py-2 text-right">
                    <form action={toggleCouponActive.bind(null, c.id)}>
                      <button className="text-xs text-gold hover:underline">
                        {c.active ? "Desactivar" : "Activar"}
                      </button>
                    </form>
                  </td>
                </tr>
              ))}
              {coupons.length === 0 && (
                <tr>
                  <td className="px-4 py-6 text-center text-cream/40" colSpan={6}>
                    Aún no has creado cupones.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="mt-8 max-w-lg rounded-lg border border-white/10 bg-charcoal p-6">
        <h2 className="text-lg font-semibold">Crear cupón</h2>
        <form action={createCoupon} className="mt-4 space-y-4">
          <div>
            <label className="text-sm text-cream/70">Código</label>
            <input
              name="code"
              required
              placeholder="VERANO20"
              className="mt-1 w-full rounded-md border border-white/20 bg-ink px-3 py-2 uppercase outline-none focus:border-gold"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm text-cream/70">Tipo de descuento</label>
              <select
                name="discountType"
                defaultValue="PERCENT"
                className="mt-1 w-full rounded-md border border-white/20 bg-ink px-3 py-2 outline-none focus:border-gold"
              >
                <option value="PERCENT">Porcentaje</option>
                <option value="FIXED">Monto fijo</option>
              </select>
            </div>
            <div>
              <label className="text-sm text-cream/70">Valor</label>
              <input
                type="number"
                name="discountValue"
                step="0.01"
                min={0}
                required
                className="mt-1 w-full rounded-md border border-white/20 bg-ink px-3 py-2 outline-none focus:border-gold"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm text-cream/70">Máximo de usos (opcional)</label>
              <input
                type="number"
                name="maxUses"
                min={1}
                placeholder="Ilimitado"
                className="mt-1 w-full rounded-md border border-white/20 bg-ink px-3 py-2 outline-none focus:border-gold"
              />
            </div>
            <div>
              <label className="text-sm text-cream/70">Vence (opcional)</label>
              <input
                type="date"
                name="expiresAt"
                className="mt-1 w-full rounded-md border border-white/20 bg-ink px-3 py-2 outline-none focus:border-gold"
              />
            </div>
          </div>
          <button
            type="submit"
            className="rounded-md bg-gold px-4 py-2 font-semibold text-ink hover:bg-gold/90"
          >
            Crear cupón
          </button>
        </form>
      </div>
    </div>
  );
}
