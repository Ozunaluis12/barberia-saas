import Link from "next/link";
import { notFound } from "next/navigation";
import { requireOwner } from "@/lib/guard";
import { prisma } from "@/lib/db";
import { updateTeamMemberPermissions } from "@/app/actions/team";

const PERMISSION_LABELS: Record<string, string> = {
  staff: "Personal",
  catalog: "Catálogo",
  reports: "Reportes",
  settings: "Configuración",
};

export default async function EditTeamMemberPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await requireOwner();
  const { id } = await params;

  const member = await prisma.user.findFirst({ where: { id, businessId: session.businessId } });
  if (!member || member.role === "OWNER") notFound();

  const current = new Set(member.permissions ? member.permissions.split(",") : []);
  const availableStaff = await prisma.staff.findMany({
    where: {
      businessId: session.businessId,
      OR: [{ linkedUser: null }, { id: member.staffId ?? "" }],
    },
    orderBy: { name: "asc" },
  });

  return (
    <div>
      <Link href="/dashboard/team" className="text-sm text-cream/50 hover:text-cream">
        ← Volver
      </Link>
      <h1 className="mt-2 text-2xl font-bold">Permisos de {member.name}</h1>
      <p className="mt-1 text-sm text-cream/60">
        Resumen, Citas, Clientes y Reseñas siempre están disponibles para esta cuenta. Marca qué
        más puede ver.
      </p>

      <form
        action={updateTeamMemberPermissions.bind(null, member.id)}
        className="mt-6 max-w-lg space-y-4 rounded-lg border border-white/10 bg-charcoal p-6"
      >
        <div>
          <label className="text-sm text-cream/70">
            Vincular con personal del roster (opcional, para que solo pueda abrir/cerrar su
            propia caja)
          </label>
          <select
            name="staffId"
            defaultValue={member.staffId ?? ""}
            className="mt-1 w-full rounded-md border border-white/20 bg-ink px-3 py-2 outline-none focus:border-gold"
          >
            <option value="">Sin vincular</option>
            {availableStaff.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </div>
        <div className="flex flex-wrap gap-3">
          {Object.entries(PERMISSION_LABELS).map(([value, label]) => (
            <label key={value} className="flex items-center gap-1 text-sm">
              <input
                type="checkbox"
                name="permissions"
                value={value}
                defaultChecked={current.has(value)}
              />
              {label}
            </label>
          ))}
        </div>
        <button
          type="submit"
          className="rounded-md bg-gold px-4 py-2 font-semibold text-ink hover:bg-gold/90"
        >
          Guardar permisos
        </button>
      </form>
    </div>
  );
}
