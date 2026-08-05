import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { requirePermission } from "@/lib/guard";
import { prisma } from "@/lib/db";
import { updateStoreItem, restockStoreItem } from "@/app/actions/store";
import { formatCOP } from "@/lib/money";

const ERRORS: Record<string, string> = {
  NOMBRE_REQUERIDO: "El nombre es obligatorio.",
  PRECIO_INVALIDO: "El precio no puede ser negativo.",
  COSTO_INVALIDO: "El costo no puede ser negativo.",
  STOCK_INVALIDO: "El stock debe ser un número entero mayor o igual a 0.",
  MINSTOCK_INVALIDO: "El stock mínimo debe ser un número entero mayor o igual a 0.",
  CANTIDAD_INVALIDA: "La cantidad a reabastecer debe ser mayor a 0.",
};

export default async function EditStoreItemPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const session = await requirePermission("catalog");
  const { id } = await params;
  const { error } = await searchParams;

  const business = await prisma.business.findUnique({ where: { id: session.businessId } });
  if (!business?.storeEnabled) redirect("/dashboard");

  const item = await prisma.storeItem.findFirst({ where: { id, businessId: session.businessId } });
  if (!item) notFound();

  const [restocks, sales] = await Promise.all([
    prisma.storeRestock.findMany({
      where: { storeItemId: id },
      include: { restockedBy: true },
      orderBy: { createdAt: "desc" },
      take: 20,
    }),
    prisma.storeSale.findMany({
      where: { storeItemId: id },
      orderBy: { createdAt: "desc" },
      take: 20,
    }),
  ]);

  return (
    <div>
      <Link href="/dashboard/store" className="text-sm text-cream/50 hover:text-cream">
        ← Volver a la Tiendita
      </Link>
      <h1 className="mt-2 text-2xl font-bold">Editar producto</h1>

      {error && (
        <p className="mt-4 rounded-md bg-red-500/10 px-3 py-2 text-sm text-red-400">
          {ERRORS[error] ?? "Ocurrió un error, intenta de nuevo."}
        </p>
      )}

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <form
          action={updateStoreItem.bind(null, item.id)}
          encType="multipart/form-data"
          className="space-y-4 rounded-lg border border-white/10 bg-charcoal p-6"
        >
          <div className="flex items-center gap-4">
            {item.imageUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={item.imageUrl} alt={item.name} className="h-14 w-14 rounded-md object-cover" />
            ) : (
              <div className="flex h-14 w-14 items-center justify-center rounded-md bg-white/5 text-xs text-cream/40">
                Sin foto
              </div>
            )}
            <div className="flex-1">
              <label className="text-sm text-cream/70">Imagen (opcional)</label>
              <input
                type="file"
                name="photo"
                accept="image/*"
                className="mt-1 w-full text-sm text-cream/70 file:mr-3 file:rounded-md file:border-0 file:bg-gold file:px-3 file:py-1.5 file:text-sm file:font-semibold file:text-ink"
              />
            </div>
          </div>
          <div>
            <label className="text-sm text-cream/70">Nombre</label>
            <input
              name="name"
              required
              defaultValue={item.name}
              className="mt-1 w-full rounded-md border border-white/20 bg-ink px-3 py-2 outline-none focus:border-gold"
            />
          </div>
          <div>
            <label className="text-sm text-cream/70">Categoría (opcional)</label>
            <input
              name="category"
              defaultValue={item.category ?? ""}
              placeholder="Bebidas, Snacks, Galletas..."
              className="mt-1 w-full rounded-md border border-white/20 bg-ink px-3 py-2 outline-none focus:border-gold"
            />
          </div>
          <div>
            <label className="text-sm text-cream/70">Descripción (opcional)</label>
            <textarea
              name="description"
              rows={2}
              defaultValue={item.description ?? ""}
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
                defaultValue={item.price}
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
                defaultValue={item.costPrice ?? ""}
                placeholder="Para calcular margen"
                className="mt-1 w-full rounded-md border border-white/20 bg-ink px-3 py-2 outline-none focus:border-gold"
              />
            </div>
          </div>
          <div>
            <label className="text-sm text-cream/70">
              Stock (déjalo vacío si no quieres trackear inventario)
            </label>
            <input
              type="number"
              name="stock"
              min={0}
              placeholder="Sin trackear"
              defaultValue={item.stock ?? ""}
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
              defaultValue={item.minStock ?? ""}
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

        <div className="space-y-6">
          <div className="rounded-lg border border-white/10 bg-charcoal p-6">
            <h2 className="text-lg font-semibold">Reabastecer</h2>
            <p className="mt-1 text-sm text-cream/60">
              Suma unidades al stock y deja un registro de cuándo entraron y a qué costo — no
              reemplaza el número, lo acumula.
            </p>
            <form action={restockStoreItem.bind(null, item.id)} className="mt-4 space-y-3">
              <div>
                <label className="text-sm text-cream/70">Cantidad que entra</label>
                <input
                  type="number"
                  name="quantity"
                  min={1}
                  required
                  className="mt-1 w-full rounded-md border border-white/20 bg-ink px-3 py-2 outline-none focus:border-gold"
                />
              </div>
              <div>
                <label className="text-sm text-cream/70">Costo unitario de este lote (opcional)</label>
                <input
                  type="number"
                  name="costPrice"
                  step="1"
                  min={0}
                  placeholder={item.costPrice !== null ? String(item.costPrice) : "Se guarda como el costo actual"}
                  className="mt-1 w-full rounded-md border border-white/20 bg-ink px-3 py-2 outline-none focus:border-gold"
                />
              </div>
              <div>
                <label className="text-sm text-cream/70">Nota (opcional)</label>
                <input
                  name="note"
                  placeholder="Proveedor, factura, etc."
                  className="mt-1 w-full rounded-md border border-white/20 bg-ink px-3 py-2 outline-none focus:border-gold"
                />
              </div>
              <button
                type="submit"
                className="rounded-md bg-gold px-4 py-2 font-semibold text-ink hover:bg-gold/90"
              >
                Reabastecer
              </button>
            </form>
          </div>

          <div className="rounded-lg border border-white/10 p-4">
            <h3 className="text-sm font-semibold text-cream/80">Historial de reabastecimiento</h3>
            <div className="mt-3 max-h-64 overflow-y-auto">
              <table className="w-full text-xs">
                <tbody>
                  {restocks.map((r) => (
                    <tr key={r.id} className="border-t border-white/5">
                      <td className="py-1.5 text-cream/50">
                        {r.createdAt.toLocaleDateString("es", { day: "2-digit", month: "2-digit" })}
                      </td>
                      <td className="py-1.5 text-cream/70">+{r.quantity}</td>
                      <td className="py-1.5 text-cream/50">
                        {r.costPrice !== null ? formatCOP(r.costPrice) : "—"}
                      </td>
                      <td className="py-1.5 text-cream/50">{r.restockedBy.name}</td>
                    </tr>
                  ))}
                  {restocks.length === 0 && (
                    <tr>
                      <td className="py-4 text-center text-cream/40" colSpan={4}>
                        Sin reabastecimientos todavía.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div className="rounded-lg border border-white/10 p-4">
            <h3 className="text-sm font-semibold text-cream/80">Ventas de este producto</h3>
            <div className="mt-3 max-h-64 overflow-y-auto">
              <table className="w-full text-xs">
                <tbody>
                  {sales.map((s) => (
                    <tr key={s.id} className="border-t border-white/5">
                      <td className="py-1.5 text-cream/50">
                        {s.createdAt.toLocaleDateString("es", { day: "2-digit", month: "2-digit" })}
                      </td>
                      <td className="py-1.5 text-cream/70">-{s.quantity}</td>
                      <td className="py-1.5 text-cream/50">{formatCOP(s.total)}</td>
                    </tr>
                  ))}
                  {sales.length === 0 && (
                    <tr>
                      <td className="py-4 text-center text-cream/40" colSpan={3}>
                        Sin ventas todavía.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
