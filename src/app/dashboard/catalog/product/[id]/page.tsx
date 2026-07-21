import Link from "next/link";
import { notFound } from "next/navigation";
import { requireOwner } from "@/lib/guard";
import { prisma } from "@/lib/db";
import { updateProduct } from "@/app/actions/products";

const ERRORS: Record<string, string> = {
  NOMBRE_REQUERIDO: "El nombre es obligatorio.",
  PRECIO_INVALIDO: "El precio no puede ser negativo.",
};

export default async function EditProductPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const session = await requireOwner();
  const { id } = await params;
  const { error } = await searchParams;

  const product = await prisma.product.findFirst({ where: { id, businessId: session.businessId } });
  if (!product) notFound();

  return (
    <div>
      <Link href="/dashboard/catalog" className="text-sm text-cream/50 hover:text-cream">
        ← Volver
      </Link>
      <h1 className="mt-2 text-2xl font-bold">Editar producto</h1>

      {error && (
        <p className="mt-4 rounded-md bg-red-500/10 px-3 py-2 text-sm text-red-400">
          {ERRORS[error] ?? "Ocurrió un error, intenta de nuevo."}
        </p>
      )}

      <form
        action={updateProduct.bind(null, product.id)}
        className="mt-6 max-w-lg space-y-4 rounded-lg border border-white/10 bg-charcoal p-6"
      >
        <div>
          <label className="text-sm text-cream/70">Nombre</label>
          <input
            name="name"
            required
            defaultValue={product.name}
            className="mt-1 w-full rounded-md border border-white/20 bg-ink px-3 py-2 outline-none focus:border-gold"
          />
        </div>
        <div>
          <label className="text-sm text-cream/70">Descripción (opcional)</label>
          <textarea
            name="description"
            rows={2}
            defaultValue={product.description ?? ""}
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
            defaultValue={product.price}
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
  );
}
