import { requireOwner } from "@/lib/guard";
import { prisma } from "@/lib/db";
import { createLocation, switchLocation } from "@/app/actions/locations";
import { CATEGORY_OPTIONS } from "@/lib/vocabulary";

const ERRORS: Record<string, string> = {
  NOMBRE_REQUERIDO: "El nombre de la sucursal es obligatorio.",
};

export default async function LocationsPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const session = await requireOwner();
  const { error } = await searchParams;

  const locations = await prisma.business.findMany({
    where: { organizationId: session.organizationId },
    orderBy: { createdAt: "asc" },
  });

  return (
    <div>
      <h1 className="text-2xl font-bold">Sucursales</h1>
      <p className="mt-1 text-sm text-cream/60">
        Cada sucursal tiene su propio personal, servicios, horarios y página de reservas. Los
        clientes y su historial se comparten entre todas.
      </p>

      {error && (
        <p className="mt-4 rounded-md bg-red-500/10 px-3 py-2 text-sm text-red-400">
          {ERRORS[error] ?? "Ocurrió un error, intenta de nuevo."}
        </p>
      )}

      <div className="mt-6 overflow-hidden rounded-lg border border-white/10">
        <table className="w-full text-sm">
          <thead className="bg-charcoal text-left text-cream/60">
            <tr>
              <th className="px-4 py-2">Sucursal</th>
              <th className="px-4 py-2">Dirección</th>
              <th className="px-4 py-2">Página pública</th>
              <th className="px-4 py-2"></th>
            </tr>
          </thead>
          <tbody>
            {locations.map((loc) => {
              const isActive = loc.id === session.businessId;
              return (
                <tr key={loc.id} className="border-t border-white/5">
                  <td className="px-4 py-2 font-medium">
                    {loc.name}
                    {isActive && (
                      <span className="ml-2 rounded-full bg-gold/20 px-2 py-0.5 text-[10px] text-gold">
                        activa
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-2 text-cream/70">{loc.address ?? "—"}</td>
                  <td className="px-4 py-2 text-cream/70">/book/{loc.slug}</td>
                  <td className="px-4 py-2 text-right">
                    {!isActive && (
                      <form action={switchLocation.bind(null, loc.id)}>
                        <button className="text-xs text-gold hover:underline">
                          Administrar esta sucursal
                        </button>
                      </form>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="mt-8 max-w-lg rounded-lg border border-white/10 bg-charcoal p-6">
        <h2 className="text-lg font-semibold">Agregar otra sucursal</h2>
        <form action={createLocation} className="mt-4 space-y-4">
          <div>
            <label className="text-sm text-cream/70">Nombre de la sucursal</label>
            <input
              name="name"
              required
              placeholder="Ej. Centro, Norte, Ciudad X"
              className="mt-1 w-full rounded-md border border-white/20 bg-ink px-3 py-2 outline-none focus:border-gold"
            />
          </div>
          <div>
            <label className="text-sm text-cream/70">Tipo de negocio</label>
            <select
              name="category"
              defaultValue="BARBERSHOP"
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
            <label className="text-sm text-cream/70">Dirección</label>
            <input
              name="address"
              className="mt-1 w-full rounded-md border border-white/20 bg-ink px-3 py-2 outline-none focus:border-gold"
            />
          </div>
          <button
            type="submit"
            className="rounded-md bg-gold px-4 py-2 font-semibold text-ink hover:bg-gold/90"
          >
            Crear sucursal
          </button>
        </form>
      </div>
    </div>
  );
}
