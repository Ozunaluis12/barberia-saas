import { requireSession } from "@/lib/guard";
import { prisma } from "@/lib/db";
import { createBarber, toggleBarberActive } from "@/app/actions/barbers";

const DAY_LABELS = [
  { value: "0", label: "Dom" },
  { value: "1", label: "Lun" },
  { value: "2", label: "Mar" },
  { value: "3", label: "Mié" },
  { value: "4", label: "Jue" },
  { value: "5", label: "Vie" },
  { value: "6", label: "Sáb" },
];

export default async function BarbersPage() {
  const session = await requireSession();
  const barbers = await prisma.barber.findMany({
    where: { shopId: session.shopId },
    orderBy: { createdAt: "asc" },
  });

  return (
    <div>
      <h1 className="text-2xl font-bold">Barberos</h1>

      <div className="mt-6 overflow-hidden rounded-lg border border-white/10">
        <table className="w-full text-sm">
          <thead className="bg-charcoal text-left text-cream/60">
            <tr>
              <th className="px-4 py-2">Nombre</th>
              <th className="px-4 py-2">Horario</th>
              <th className="px-4 py-2">Comisión</th>
              <th className="px-4 py-2">Estado</th>
              <th className="px-4 py-2"></th>
            </tr>
          </thead>
          <tbody>
            {barbers.map((b) => (
              <tr key={b.id} className="border-t border-white/5">
                <td className="px-4 py-2 font-medium">{b.name}</td>
                <td className="px-4 py-2 text-cream/70">
                  {b.workStart} - {b.workEnd}
                </td>
                <td className="px-4 py-2 text-cream/70">{b.commissionPercent}%</td>
                <td className="px-4 py-2">
                  <span
                    className={`rounded-full px-2 py-1 text-xs ${
                      b.active ? "bg-green-500/20 text-green-400" : "bg-white/10 text-cream/50"
                    }`}
                  >
                    {b.active ? "Activo" : "Inactivo"}
                  </span>
                </td>
                <td className="px-4 py-2 text-right">
                  <form action={toggleBarberActive.bind(null, b.id)}>
                    <button className="text-xs text-gold hover:underline">
                      {b.active ? "Desactivar" : "Activar"}
                    </button>
                  </form>
                </td>
              </tr>
            ))}
            {barbers.length === 0 && (
              <tr>
                <td className="px-4 py-6 text-center text-cream/40" colSpan={5}>
                  Aún no has agregado barberos.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="mt-8 max-w-lg rounded-lg border border-white/10 bg-charcoal p-6">
        <h2 className="text-lg font-semibold">Agregar barbero</h2>
        <form action={createBarber} className="mt-4 space-y-4">
          <div>
            <label className="text-sm text-cream/70">Nombre</label>
            <input
              name="name"
              required
              className="mt-1 w-full rounded-md border border-white/20 bg-ink px-3 py-2 outline-none focus:border-gold"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm text-cream/70">Hora de inicio</label>
              <input
                type="time"
                name="workStart"
                defaultValue="09:00"
                className="mt-1 w-full rounded-md border border-white/20 bg-ink px-3 py-2 outline-none focus:border-gold"
              />
            </div>
            <div>
              <label className="text-sm text-cream/70">Hora de fin</label>
              <input
                type="time"
                name="workEnd"
                defaultValue="19:00"
                className="mt-1 w-full rounded-md border border-white/20 bg-ink px-3 py-2 outline-none focus:border-gold"
              />
            </div>
          </div>
          <div>
            <label className="text-sm text-cream/70">% de comisión para el barbero</label>
            <input
              type="number"
              name="commissionPercent"
              defaultValue={50}
              min={0}
              max={100}
              className="mt-1 w-full rounded-md border border-white/20 bg-ink px-3 py-2 outline-none focus:border-gold"
            />
          </div>
          <div>
            <label className="text-sm text-cream/70">Días que trabaja</label>
            <div className="mt-2 flex flex-wrap gap-3">
              {DAY_LABELS.map((d) => (
                <label key={d.value} className="flex items-center gap-1 text-sm">
                  <input
                    type="checkbox"
                    name="workDays"
                    value={d.value}
                    defaultChecked={d.value !== "0"}
                  />
                  {d.label}
                </label>
              ))}
            </div>
          </div>
          <button
            type="submit"
            className="rounded-md bg-gold px-4 py-2 font-semibold text-ink hover:bg-gold/90"
          >
            Guardar barbero
          </button>
        </form>
      </div>
    </div>
  );
}
