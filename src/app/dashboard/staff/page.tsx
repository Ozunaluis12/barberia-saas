import Link from "next/link";
import { requireSession } from "@/lib/guard";
import { prisma } from "@/lib/db";
import { createStaff, toggleStaffActive } from "@/app/actions/staff";
import { getVocabulary } from "@/lib/vocabulary";
import { DAY_LABELS } from "@/lib/days";

const ERRORS: Record<string, string> = {
  NOMBRE_REQUERIDO: "El nombre es obligatorio.",
  COMISION_INVALIDA: "La comisión debe ser un número entre 0 y 100.",
  HORARIO_INVALIDO: "Revisa el horario: la hora de inicio debe ser antes que la de fin.",
  NO_ENCONTRADO: "No se encontró a esa persona.",
};

export default async function StaffPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const session = await requireSession();
  const { error } = await searchParams;
  const business = await prisma.business.findUnique({ where: { id: session.businessId } });
  const vocab = getVocabulary(business?.category ?? "OTHER");

  const staffMembers = await prisma.staff.findMany({
    where: { businessId: session.businessId },
    orderBy: { createdAt: "asc" },
  });

  return (
    <div>
      <h1 className="text-2xl font-bold">{vocab.staffPlural}</h1>

      {error && (
        <p className="mt-4 rounded-md bg-red-500/10 px-3 py-2 text-sm text-red-400">
          {ERRORS[error] ?? "Ocurrió un error, intenta de nuevo."}
        </p>
      )}

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
            {staffMembers.map((s) => (
              <tr key={s.id} className="border-t border-white/5">
                <td className="px-4 py-2 font-medium">{s.name}</td>
                <td className="px-4 py-2 text-cream/70">
                  {s.workStart} - {s.workEnd}
                </td>
                <td className="px-4 py-2 text-cream/70">
                  {s.commissionPercent === null ? "—" : `${s.commissionPercent}%`}
                </td>
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
                    <Link href={`/dashboard/staff/${s.id}`} className="text-xs text-gold hover:underline">
                      Editar
                    </Link>
                    <form action={toggleStaffActive.bind(null, s.id)}>
                      <button className="text-xs text-gold hover:underline">
                        {s.active ? "Desactivar" : "Activar"}
                      </button>
                    </form>
                  </div>
                </td>
              </tr>
            ))}
            {staffMembers.length === 0 && (
              <tr>
                <td className="px-4 py-6 text-center text-cream/40" colSpan={5}>
                  Aún no has agregado {vocab.staffPlural.toLowerCase()}.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="mt-8 max-w-lg rounded-lg border border-white/10 bg-charcoal p-6">
        <h2 className="text-lg font-semibold">Agregar {vocab.staffSingular.toLowerCase()}</h2>
        <form action={createStaff} className="mt-4 space-y-4">
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
            <label className="text-sm text-cream/70">
              % de comisión (déjalo vacío si tu negocio no paga comisión por servicio)
            </label>
            <input
              type="number"
              name="commissionPercent"
              min={0}
              max={100}
              placeholder="Sin comisión"
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
            Guardar {vocab.staffSingular.toLowerCase()}
          </button>
        </form>
      </div>
    </div>
  );
}
