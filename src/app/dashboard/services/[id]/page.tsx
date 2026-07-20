import Link from "next/link";
import { notFound } from "next/navigation";
import { requireOwner } from "@/lib/guard";
import { prisma } from "@/lib/db";
import { updateService } from "@/app/actions/services";

const ERRORS: Record<string, string> = {
  NOMBRE_REQUERIDO: "El nombre es obligatorio.",
  DURACION_INVALIDA: "La duración debe ser un número mayor a 0.",
  PRECIO_INVALIDO: "El precio no puede ser negativo.",
};

export default async function EditServicePage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const session = await requireOwner();
  const { id } = await params;
  const { error } = await searchParams;

  const service = await prisma.service.findFirst({ where: { id, businessId: session.businessId } });
  if (!service) notFound();

  return (
    <div>
      <Link href="/dashboard/services" className="text-sm text-cream/50 hover:text-cream">
        ← Volver
      </Link>
      <h1 className="mt-2 text-2xl font-bold">Editar servicio</h1>

      {error && (
        <p className="mt-4 rounded-md bg-red-500/10 px-3 py-2 text-sm text-red-400">
          {ERRORS[error] ?? "Ocurrió un error, intenta de nuevo."}
        </p>
      )}

      <form
        action={updateService.bind(null, service.id)}
        className="mt-6 max-w-lg space-y-4 rounded-lg border border-white/10 bg-charcoal p-6"
      >
        <div>
          <label className="text-sm text-cream/70">Nombre</label>
          <input
            name="name"
            required
            defaultValue={service.name}
            className="mt-1 w-full rounded-md border border-white/20 bg-ink px-3 py-2 outline-none focus:border-gold"
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-sm text-cream/70">Duración (minutos)</label>
            <input
              type="number"
              name="durationMinutes"
              defaultValue={service.durationMinutes}
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
              defaultValue={service.price}
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
    </div>
  );
}
