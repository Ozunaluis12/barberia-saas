import { requirePermission } from "@/lib/guard";
import { prisma } from "@/lib/db";
import { createServicePackage, toggleServicePackageActive, sellServicePackage } from "@/app/actions/packages";

const ERRORS: Record<string, string> = {
  SERVICIO_INVALIDO: "Elige un servicio válido.",
  NOMBRE_REQUERIDO: "El nombre del paquete es obligatorio.",
  SESIONES_INVALIDAS: "El número de sesiones debe ser un entero mayor a 0.",
  PRECIO_INVALIDO: "El precio no puede ser negativo.",
  PAQUETE_INVALIDO: "No se encontró ese paquete.",
  CLIENTE_REQUERIDO: "Nombre y teléfono del cliente son obligatorios.",
};

export default async function PackagesPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const session = await requirePermission("catalog");
  const { error } = await searchParams;

  const [packages, services, recentPurchases] = await Promise.all([
    prisma.servicePackage.findMany({
      where: { businessId: session.businessId },
      include: { service: true },
      orderBy: { createdAt: "desc" },
    }),
    prisma.service.findMany({ where: { businessId: session.businessId, active: true } }),
    prisma.clientPackagePurchase.findMany({
      where: { businessId: session.businessId },
      include: { client: true, servicePackage: true },
      orderBy: { purchasedAt: "desc" },
      take: 15,
    }),
  ]);

  return (
    <div>
      <h1 className="text-2xl font-bold">Paquetes de sesiones</h1>
      <p className="mt-1 text-sm text-cream/60">
        Un cliente paga por adelantado varias sesiones de un servicio y las va consumiendo en
        citas sin cita previa, sin pagar cada vez. No aplica a la reserva pública en línea.
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
                <th className="px-4 py-2">Paquete</th>
                <th className="px-4 py-2">Servicio</th>
                <th className="px-4 py-2">Sesiones</th>
                <th className="px-4 py-2">Precio</th>
                <th className="px-4 py-2">Estado</th>
                <th className="px-4 py-2"></th>
                <th className="px-4 py-2"></th>
              </tr>
            </thead>
            <tbody>
              {packages.map((p) => (
                <tr key={p.id} className="border-t border-white/5">
                  <td className="px-4 py-2 font-medium">{p.name}</td>
                  <td className="px-4 py-2 text-cream/70">{p.service.name}</td>
                  <td className="px-4 py-2 text-cream/70">{p.sessionCount}</td>
                  <td className="px-4 py-2 text-cream/70">${p.price.toFixed(2)}</td>
                  <td className="px-4 py-2">
                    <span
                      className={`rounded-full px-2 py-1 text-xs ${
                        p.active ? "bg-green-500/20 text-green-400" : "bg-white/10 text-cream/50"
                      }`}
                    >
                      {p.active ? "Activo" : "Inactivo"}
                    </span>
                  </td>
                  <td className="px-4 py-2 text-right">
                    <form action={toggleServicePackageActive.bind(null, p.id)}>
                      <button className="text-xs text-gold hover:underline">
                        {p.active ? "Desactivar" : "Activar"}
                      </button>
                    </form>
                  </td>
                  <td className="px-4 py-2 text-right">
                    {p.active && (
                      <form
                        action={sellServicePackage.bind(null, p.id)}
                        className="flex flex-wrap items-center justify-end gap-1"
                      >
                        <input
                          name="clientName"
                          placeholder="Cliente"
                          required
                          className="w-24 rounded-md border border-white/20 bg-ink px-1.5 py-1 text-xs outline-none focus:border-gold"
                        />
                        <input
                          name="clientPhone"
                          placeholder="Teléfono"
                          required
                          className="w-24 rounded-md border border-white/20 bg-ink px-1.5 py-1 text-xs outline-none focus:border-gold"
                        />
                        <button className="text-xs text-gold hover:underline">Vender</button>
                      </form>
                    )}
                  </td>
                </tr>
              ))}
              {packages.length === 0 && (
                <tr>
                  <td className="px-4 py-6 text-center text-cream/40" colSpan={7}>
                    Aún no has creado paquetes.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <h2 className="mt-10 text-lg font-semibold">Ventas recientes de paquetes</h2>
      <div className="mt-3 overflow-hidden rounded-lg border border-white/10">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-charcoal text-left text-cream/60">
              <tr>
                <th className="px-4 py-2">Fecha</th>
                <th className="px-4 py-2">Cliente</th>
                <th className="px-4 py-2">Paquete</th>
                <th className="px-4 py-2">Sesiones restantes</th>
              </tr>
            </thead>
            <tbody>
              {recentPurchases.map((p) => (
                <tr key={p.id} className="border-t border-white/5">
                  <td className="px-4 py-2 text-cream/70">
                    {p.purchasedAt.toLocaleDateString("es", { day: "2-digit", month: "2-digit", year: "numeric" })}
                  </td>
                  <td className="px-4 py-2 font-medium">{p.client.name}</td>
                  <td className="px-4 py-2 text-cream/70">{p.servicePackage.name}</td>
                  <td className="px-4 py-2 text-cream/70">
                    {p.sessionsRemaining} / {p.servicePackage.sessionCount}
                  </td>
                </tr>
              ))}
              {recentPurchases.length === 0 && (
                <tr>
                  <td className="px-4 py-6 text-center text-cream/40" colSpan={4}>
                    Aún no se ha vendido ningún paquete.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="mt-8 max-w-lg rounded-lg border border-white/10 bg-charcoal p-6">
        <h2 className="text-lg font-semibold">Crear paquete</h2>
        <form action={createServicePackage} className="mt-4 space-y-4">
          <div>
            <label className="text-sm text-cream/70">Servicio</label>
            <select
              name="serviceId"
              required
              className="mt-1 w-full rounded-md border border-white/20 bg-ink px-3 py-2 outline-none focus:border-gold"
            >
              {services.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-sm text-cream/70">Nombre del paquete</label>
            <input
              name="name"
              required
              placeholder="5 cortes"
              className="mt-1 w-full rounded-md border border-white/20 bg-ink px-3 py-2 outline-none focus:border-gold"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm text-cream/70">Número de sesiones</label>
              <input
                type="number"
                name="sessionCount"
                min={1}
                required
                className="mt-1 w-full rounded-md border border-white/20 bg-ink px-3 py-2 outline-none focus:border-gold"
              />
            </div>
            <div>
              <label className="text-sm text-cream/70">Precio del paquete</label>
              <input
                type="number"
                name="price"
                step="0.01"
                min={0}
                required
                className="mt-1 w-full rounded-md border border-white/20 bg-ink px-3 py-2 outline-none focus:border-gold"
              />
            </div>
          </div>
          <button
            type="submit"
            className="rounded-md bg-gold px-4 py-2 font-semibold text-ink hover:bg-gold/90"
          >
            Crear paquete
          </button>
        </form>
      </div>
    </div>
  );
}
