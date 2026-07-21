import Link from "next/link";
import { requirePermission } from "@/lib/guard";
import { prisma } from "@/lib/db";
import { createService, toggleServiceActive } from "@/app/actions/services";
import { createProduct, toggleProductActive } from "@/app/actions/products";
import { getVocabulary } from "@/lib/vocabulary";

const ERRORS: Record<string, string> = {
  NOMBRE_REQUERIDO: "El nombre es obligatorio.",
  DURACION_INVALIDA: "La duración debe ser un número mayor a 0.",
  PRECIO_INVALIDO: "El precio no puede ser negativo.",
  NO_ENCONTRADO: "No se encontró ese elemento.",
};

export default async function CatalogPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const session = await requirePermission("catalog");
  const { error } = await searchParams;
  const business = await prisma.business.findUnique({ where: { id: session.businessId } });
  const vocab = getVocabulary(business?.category ?? "OTHER");

  const [services, products] = await Promise.all([
    prisma.service.findMany({ where: { businessId: session.businessId }, orderBy: { createdAt: "asc" } }),
    prisma.product.findMany({ where: { businessId: session.businessId }, orderBy: { createdAt: "asc" } }),
  ]);

  return (
    <div>
      <h1 className="text-2xl font-bold">Catálogo</h1>
      <p className="mt-1 text-sm text-cream/60">
        Servicios que agendas como citas, y productos que vendes directo en el local.
      </p>

      {error && (
        <p className="mt-4 rounded-md bg-red-500/10 px-3 py-2 text-sm text-red-400">
          {ERRORS[error] ?? "Ocurrió un error, intenta de nuevo."}
        </p>
      )}

      {/* Servicios */}
      <h2 className="mt-8 text-lg font-semibold">Servicios</h2>
      <div className="mt-3 overflow-hidden rounded-lg border border-white/10">
        <table className="w-full text-sm">
          <thead className="bg-charcoal text-left text-cream/60">
            <tr>
              <th className="px-4 py-2">Nombre</th>
              <th className="px-4 py-2">Duración</th>
              <th className="px-4 py-2">Precio</th>
              <th className="px-4 py-2">Estado</th>
              <th className="px-4 py-2"></th>
            </tr>
          </thead>
          <tbody>
            {services.map((s) => (
              <tr key={s.id} className="border-t border-white/5">
                <td className="px-4 py-2 font-medium">
                  {s.name}
                  {s.description && <p className="text-xs font-normal text-cream/50">{s.description}</p>}
                </td>
                <td className="px-4 py-2 text-cream/70">{s.durationMinutes} min</td>
                <td className="px-4 py-2 text-cream/70">${s.price.toFixed(2)}</td>
                <td className="px-4 py-2">
                  <span
                    className={`rounded-full px-2 py-1 text-xs ${
                      s.active ? "bg-green-500/20 text-green-400" : "bg-white/10 text-cream/50"
                    }`}
                  >
                    {s.active ? "Activo" : "Inactivo"}
                  </span>
                </td>
                <td className="px-4 py-2 text-right">
                  <div className="flex justify-end gap-3">
                    <Link
                      href={`/dashboard/catalog/service/${s.id}`}
                      className="text-xs text-gold hover:underline"
                    >
                      Editar
                    </Link>
                    <form action={toggleServiceActive.bind(null, s.id)}>
                      <button className="text-xs text-gold hover:underline">
                        {s.active ? "Desactivar" : "Activar"}
                      </button>
                    </form>
                  </div>
                </td>
              </tr>
            ))}
            {services.length === 0 && (
              <tr>
                <td className="px-4 py-6 text-center text-cream/40" colSpan={5}>
                  Aún no has agregado servicios.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="mt-4 max-w-lg rounded-lg border border-white/10 bg-charcoal p-6">
        <h3 className="font-semibold">Agregar servicio</h3>
        <form action={createService} className="mt-4 space-y-4">
          <div>
            <label className="text-sm text-cream/70">Nombre</label>
            <input
              name="name"
              required
              placeholder={vocab.servicePlaceholder}
              className="mt-1 w-full rounded-md border border-white/20 bg-ink px-3 py-2 outline-none focus:border-gold"
            />
          </div>
          <div>
            <label className="text-sm text-cream/70">Descripción (opcional)</label>
            <textarea
              name="description"
              rows={2}
              className="mt-1 w-full rounded-md border border-white/20 bg-ink px-3 py-2 outline-none focus:border-gold"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm text-cream/70">Duración (minutos)</label>
              <input
                type="number"
                name="durationMinutes"
                defaultValue={30}
                min={5}
                className="mt-1 w-full rounded-md border border-white/20 bg-ink px-3 py-2 outline-none focus:border-gold"
              />
            </div>
            <div>
              <label className="text-sm text-cream/70">Precio</label>
              <input
                type="number"
                name="price"
                step="0.01"
                min={0}
                className="mt-1 w-full rounded-md border border-white/20 bg-ink px-3 py-2 outline-none focus:border-gold"
              />
            </div>
          </div>
          <button
            type="submit"
            className="rounded-md bg-gold px-4 py-2 font-semibold text-ink hover:bg-gold/90"
          >
            Guardar servicio
          </button>
        </form>
      </div>

      {/* Productos */}
      <h2 className="mt-10 text-lg font-semibold">Productos</h2>
      <div className="mt-3 overflow-hidden rounded-lg border border-white/10">
        <table className="w-full text-sm">
          <thead className="bg-charcoal text-left text-cream/60">
            <tr>
              <th className="px-4 py-2">Nombre</th>
              <th className="px-4 py-2">Precio</th>
              <th className="px-4 py-2">Estado</th>
              <th className="px-4 py-2"></th>
            </tr>
          </thead>
          <tbody>
            {products.map((p) => (
              <tr key={p.id} className="border-t border-white/5">
                <td className="px-4 py-2 font-medium">
                  {p.name}
                  {p.description && <p className="text-xs font-normal text-cream/50">{p.description}</p>}
                </td>
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
                  <div className="flex justify-end gap-3">
                    <Link
                      href={`/dashboard/catalog/product/${p.id}`}
                      className="text-xs text-gold hover:underline"
                    >
                      Editar
                    </Link>
                    <form action={toggleProductActive.bind(null, p.id)}>
                      <button className="text-xs text-gold hover:underline">
                        {p.active ? "Desactivar" : "Activar"}
                      </button>
                    </form>
                  </div>
                </td>
              </tr>
            ))}
            {products.length === 0 && (
              <tr>
                <td className="px-4 py-6 text-center text-cream/40" colSpan={4}>
                  Aún no has agregado productos.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="mt-4 max-w-lg rounded-lg border border-white/10 bg-charcoal p-6">
        <h3 className="font-semibold">Agregar producto</h3>
        <form action={createProduct} className="mt-4 space-y-4">
          <div>
            <label className="text-sm text-cream/70">Nombre</label>
            <input
              name="name"
              required
              placeholder="Shampoo profesional"
              className="mt-1 w-full rounded-md border border-white/20 bg-ink px-3 py-2 outline-none focus:border-gold"
            />
          </div>
          <div>
            <label className="text-sm text-cream/70">Descripción (opcional)</label>
            <textarea
              name="description"
              rows={2}
              className="mt-1 w-full rounded-md border border-white/20 bg-ink px-3 py-2 outline-none focus:border-gold"
            />
          </div>
          <div>
            <label className="text-sm text-cream/70">Precio</label>
            <input
              type="number"
              name="price"
              step="0.01"
              min={0}
              className="mt-1 w-full rounded-md border border-white/20 bg-ink px-3 py-2 outline-none focus:border-gold"
            />
          </div>
          <button
            type="submit"
            className="rounded-md bg-gold px-4 py-2 font-semibold text-ink hover:bg-gold/90"
          >
            Guardar producto
          </button>
        </form>
      </div>
    </div>
  );
}
