import Link from "next/link";
import { redirect } from "next/navigation";
import { requirePermission } from "@/lib/guard";
import { prisma } from "@/lib/db";
import { createStoreItem, toggleStoreItemActive, sellStoreItem } from "@/app/actions/store";
import { formatCOP } from "@/lib/money";

const ERRORS: Record<string, string> = {
  NOMBRE_REQUERIDO: "El nombre es obligatorio.",
  PRECIO_INVALIDO: "El precio no puede ser negativo.",
  COSTO_INVALIDO: "El costo no puede ser negativo.",
  STOCK_INVALIDO: "El stock debe ser un número entero mayor o igual a 0.",
  MINSTOCK_INVALIDO: "El stock mínimo debe ser un número entero mayor o igual a 0.",
  NO_ENCONTRADO: "No se encontró ese producto.",
  CANTIDAD_INVALIDA: "La cantidad a vender debe ser mayor a 0.",
  STOCK_INSUFICIENTE: "No hay suficiente stock para vender esa cantidad.",
  TARJETA_INVALIDA: "Ese código de tarjeta de regalo no es válido.",
  TARJETA_VENCIDA: "Esa tarjeta de regalo ya venció.",
  TARJETA_SIN_SALDO: "Esa tarjeta de regalo no tiene saldo.",
};

export default async function StorePage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const session = await requirePermission("catalog");
  const { error } = await searchParams;

  const business = await prisma.business.findUnique({ where: { id: session.businessId } });
  if (!business?.storeEnabled) redirect("/dashboard");

  const [items, recentSales, recentRestocks] = await Promise.all([
    prisma.storeItem.findMany({
      where: { businessId: session.businessId },
      orderBy: { createdAt: "asc" },
    }),
    prisma.storeSale.findMany({
      where: { businessId: session.businessId },
      include: { storeItem: true },
      orderBy: { createdAt: "desc" },
      take: 15,
    }),
    prisma.storeRestock.findMany({
      where: { businessId: session.businessId },
      include: { storeItem: true, restockedBy: true },
      orderBy: { createdAt: "desc" },
      take: 15,
    }),
  ]);

  return (
    <div>
      <h1 className="text-2xl font-bold">Tiendita</h1>
      <p className="mt-1 text-sm text-cream/60">
        Mecatos, bebidas y demás — inventario aparte del Catálogo, con costo, margen y
        reabastecimiento propios.
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
                <th className="px-4 py-2">Nombre</th>
                <th className="px-4 py-2">Categoría</th>
                <th className="px-4 py-2">Precio</th>
                <th className="px-4 py-2">Margen</th>
                <th className="px-4 py-2">Stock</th>
                <th className="px-4 py-2">Estado</th>
                <th className="px-4 py-2"></th>
              </tr>
            </thead>
            <tbody>
              {items.map((p) => {
                const lowStock = p.stock !== null && p.minStock !== null && p.stock <= p.minStock;
                const margin = p.costPrice !== null ? p.price - p.costPrice : null;
                const marginPct = margin !== null && p.costPrice! > 0 ? (margin / p.costPrice!) * 100 : null;
                return (
                  <tr key={p.id} className="border-t border-white/5">
                    <td className="px-4 py-2 font-medium">
                      <div className="flex items-center gap-3">
                        {p.imageUrl && (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={p.imageUrl} alt={p.name} className="h-8 w-8 rounded-md object-cover" />
                        )}
                        <div>
                          {p.name}
                          {p.description && <p className="text-xs font-normal text-cream/50">{p.description}</p>}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-2 text-cream/70">{p.category ?? "—"}</td>
                    <td className="px-4 py-2 text-cream/70">{formatCOP(p.price)}</td>
                    <td className="px-4 py-2 text-cream/70">
                      {margin !== null ? (
                        <>
                          {formatCOP(margin)}
                          {marginPct !== null && <span className="text-cream/40"> ({marginPct.toFixed(0)}%)</span>}
                        </>
                      ) : (
                        "—"
                      )}
                    </td>
                    <td className="px-4 py-2">
                      <div className="flex items-center gap-2">
                        <span className="text-cream/70">{p.stock === null ? "—" : p.stock}</span>
                        {lowStock && (
                          <span className="rounded-full bg-red-500/20 px-2 py-0.5 text-[10px] text-red-400">
                            Stock bajo
                          </span>
                        )}
                      </div>
                    </td>
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
                      <div className="flex flex-wrap items-center justify-end gap-3">
                        <form action={sellStoreItem.bind(null, p.id)} className="flex items-center gap-1">
                          <input
                            type="number"
                            name="quantity"
                            min={1}
                            defaultValue={1}
                            className="w-14 rounded-md border border-white/20 bg-ink px-1.5 py-1 text-xs outline-none focus:border-gold"
                          />
                          <select
                            name="paymentMethod"
                            className="rounded-md border border-white/20 bg-ink px-1 py-1 text-xs outline-none focus:border-gold"
                          >
                            <option value="CASH">Efectivo</option>
                            <option value="CARD_IN_PERSON">Tarjeta</option>
                          </select>
                          {business.giftCardsEnabled && (
                            <input
                              type="text"
                              name="giftCardCode"
                              placeholder="Cód. regalo"
                              className="w-20 rounded-md border border-white/20 bg-ink px-1.5 py-1 text-xs uppercase outline-none focus:border-gold"
                            />
                          )}
                          <button className="text-xs text-gold hover:underline">Vender</button>
                        </form>
                        <Link href={`/dashboard/store/${p.id}`} className="text-xs text-gold hover:underline">
                          Editar / Reabastecer
                        </Link>
                        <form action={toggleStoreItemActive.bind(null, p.id)}>
                          <button className="text-xs text-gold hover:underline">
                            {p.active ? "Desactivar" : "Activar"}
                          </button>
                        </form>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {items.length === 0 && (
                <tr>
                  <td className="px-4 py-6 text-center text-cream/40" colSpan={7}>
                    Aún no has agregado productos a la Tiendita.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <h2 className="mt-10 text-lg font-semibold">Ventas recientes</h2>
      <div className="mt-3 overflow-hidden rounded-lg border border-white/10">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-charcoal text-left text-cream/60">
              <tr>
                <th className="px-4 py-2">Fecha</th>
                <th className="px-4 py-2">Producto</th>
                <th className="px-4 py-2">Cantidad</th>
                <th className="px-4 py-2">Total</th>
                <th className="px-4 py-2"></th>
              </tr>
            </thead>
            <tbody>
              {recentSales.map((s) => (
                <tr key={s.id} className="border-t border-white/5">
                  <td className="px-4 py-2 text-cream/70">
                    {s.createdAt.toLocaleDateString("es", { day: "2-digit", month: "2-digit", year: "numeric" })}
                  </td>
                  <td className="px-4 py-2">{s.storeItem.name}</td>
                  <td className="px-4 py-2 text-cream/70">{s.quantity}</td>
                  <td className="px-4 py-2 text-cream/70">{formatCOP(s.total)}</td>
                  <td className="px-4 py-2 text-right">
                    <a href={`/api/receipt/store-sale/${s.id}`} className="text-xs text-gold hover:underline">
                      Recibo
                    </a>
                  </td>
                </tr>
              ))}
              {recentSales.length === 0 && (
                <tr>
                  <td className="px-4 py-6 text-center text-cream/40" colSpan={5}>
                    Aún no hay ventas registradas.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <h2 className="mt-10 text-lg font-semibold">Reabastecimientos recientes</h2>
      <div className="mt-3 overflow-hidden rounded-lg border border-white/10">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-charcoal text-left text-cream/60">
              <tr>
                <th className="px-4 py-2">Fecha</th>
                <th className="px-4 py-2">Producto</th>
                <th className="px-4 py-2">Cantidad</th>
                <th className="px-4 py-2">Costo</th>
                <th className="px-4 py-2">Quién</th>
              </tr>
            </thead>
            <tbody>
              {recentRestocks.map((r) => (
                <tr key={r.id} className="border-t border-white/5">
                  <td className="px-4 py-2 text-cream/70">
                    {r.createdAt.toLocaleDateString("es", { day: "2-digit", month: "2-digit", year: "numeric" })}
                  </td>
                  <td className="px-4 py-2">{r.storeItem.name}</td>
                  <td className="px-4 py-2 text-cream/70">+{r.quantity}</td>
                  <td className="px-4 py-2 text-cream/70">{r.costPrice !== null ? formatCOP(r.costPrice) : "—"}</td>
                  <td className="px-4 py-2 text-cream/70">{r.restockedBy.name}</td>
                </tr>
              ))}
              {recentRestocks.length === 0 && (
                <tr>
                  <td className="px-4 py-6 text-center text-cream/40" colSpan={5}>
                    Aún no hay reabastecimientos registrados.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="mt-8 max-w-lg rounded-lg border border-white/10 bg-charcoal p-6">
        <h2 className="text-lg font-semibold">Agregar producto</h2>
        <form action={createStoreItem} encType="multipart/form-data" className="mt-4 space-y-4">
          <div>
            <label className="text-sm text-cream/70">Nombre</label>
            <input
              name="name"
              required
              placeholder="Papas, gaseosa, galletas..."
              className="mt-1 w-full rounded-md border border-white/20 bg-ink px-3 py-2 outline-none focus:border-gold"
            />
          </div>
          <div>
            <label className="text-sm text-cream/70">Categoría (opcional)</label>
            <input
              name="category"
              placeholder="Bebidas, Snacks, Galletas..."
              className="mt-1 w-full rounded-md border border-white/20 bg-ink px-3 py-2 outline-none focus:border-gold"
            />
          </div>
          <div>
            <label className="text-sm text-cream/70">Imagen (opcional)</label>
            <input
              type="file"
              name="photo"
              accept="image/*"
              className="mt-1 w-full text-sm text-cream/70 file:mr-3 file:rounded-md file:border-0 file:bg-gold file:px-3 file:py-1.5 file:text-sm file:font-semibold file:text-ink"
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
              <label className="text-sm text-cream/70">Precio de venta</label>
              <input
                type="number"
                name="price"
                step="1"
                min={0}
                className="mt-1 w-full rounded-md border border-white/20 bg-ink px-3 py-2 outline-none focus:border-gold"
              />
            </div>
            <div>
              <label className="text-sm text-cream/70">Costo (opcional)</label>
              <input
                type="number"
                name="costPrice"
                step="1"
                min={0}
                placeholder="Para calcular margen"
                className="mt-1 w-full rounded-md border border-white/20 bg-ink px-3 py-2 outline-none focus:border-gold"
              />
            </div>
          </div>
          <div>
            <label className="text-sm text-cream/70">
              Stock inicial (déjalo vacío si no quieres trackear inventario)
            </label>
            <input
              type="number"
              name="stock"
              min={0}
              placeholder="Sin trackear"
              className="mt-1 w-full rounded-md border border-white/20 bg-ink px-3 py-2 outline-none focus:border-gold"
            />
          </div>
          <div>
            <label className="text-sm text-cream/70">
              Stock mínimo (avisa por correo al dueño cuando llegue a este nivel)
            </label>
            <input
              type="number"
              name="minStock"
              min={0}
              placeholder="Sin alerta"
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
