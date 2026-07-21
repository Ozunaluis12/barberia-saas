import Link from "next/link";
import { notFound } from "next/navigation";
import { requirePermission } from "@/lib/guard";
import { prisma } from "@/lib/db";
import { updateStaff } from "@/app/actions/staff";
import { getVocabulary } from "@/lib/vocabulary";
import { DAY_LABELS } from "@/lib/days";
import Avatar from "@/components/Avatar";

const ERRORS: Record<string, string> = {
  NOMBRE_REQUERIDO: "El nombre es obligatorio.",
  COMISION_INVALIDA: "La comisión debe ser un número entre 0 y 100.",
  HORARIO_INVALIDO: "Revisa el horario: la hora de inicio debe ser antes que la de fin.",
};

export default async function EditStaffPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const session = await requirePermission("staff");
  const { id } = await params;
  const { error } = await searchParams;

  const staff = await prisma.staff.findFirst({ where: { id, businessId: session.businessId } });
  if (!staff) notFound();

  const business = await prisma.business.findUnique({ where: { id: session.businessId } });
  const vocab = getVocabulary(business?.category ?? "OTHER");
  const workDaysSet = new Set(staff.workDays.split(","));

  return (
    <div>
      <Link href="/dashboard/staff" className="text-sm text-cream/50 hover:text-cream">
        ← Volver
      </Link>
      <h1 className="mt-2 text-2xl font-bold">Editar {vocab.staffSingular.toLowerCase()}</h1>

      {error && (
        <p className="mt-4 rounded-md bg-red-500/10 px-3 py-2 text-sm text-red-400">
          {ERRORS[error] ?? "Ocurrió un error, intenta de nuevo."}
        </p>
      )}

      <form
        action={updateStaff.bind(null, staff.id)}
        encType="multipart/form-data"
        className="mt-6 max-w-lg space-y-4 rounded-lg border border-white/10 bg-charcoal p-6"
      >
        <div className="flex items-center gap-4">
          <Avatar src={staff.photoUrl} name={staff.name} size={56} />
          <div className="flex-1">
            <label className="text-sm text-cream/70">Foto (opcional)</label>
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
            defaultValue={staff.name}
            className="mt-1 w-full rounded-md border border-white/20 bg-ink px-3 py-2 outline-none focus:border-gold"
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-sm text-cream/70">Hora de inicio</label>
            <input
              type="time"
              name="workStart"
              defaultValue={staff.workStart}
              className="mt-1 w-full rounded-md border border-white/20 bg-ink px-3 py-2 outline-none focus:border-gold"
            />
          </div>
          <div>
            <label className="text-sm text-cream/70">Hora de fin</label>
            <input
              type="time"
              name="workEnd"
              defaultValue={staff.workEnd}
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
            defaultValue={staff.commissionPercent ?? ""}
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
                  defaultChecked={workDaysSet.has(d.value)}
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
          Guardar cambios
        </button>
      </form>
    </div>
  );
}
