import Link from "next/link";
import { requireOwner } from "@/lib/guard";
import { prisma } from "@/lib/db";
import { createTeamMember, toggleTeamMemberActive } from "@/app/actions/team";

const ERRORS: Record<string, string> = {
  DATOS_INVALIDOS: "Revisa los datos: la contraseña debe tener al menos 6 caracteres.",
  EMAIL_EN_USO: "Ese correo ya está registrado.",
};

const PERMISSION_LABELS: Record<string, string> = {
  staff: "Personal",
  catalog: "Catálogo",
  reports: "Reportes",
  settings: "Configuración",
};

export default async function TeamPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const session = await requireOwner();
  const { error } = await searchParams;

  const [members, unlinkedStaff] = await Promise.all([
    prisma.user.findMany({
      where: { businessId: session.businessId },
      include: { linkedStaff: true },
      orderBy: { createdAt: "asc" },
    }),
    prisma.staff.findMany({
      where: { businessId: session.businessId, linkedUser: null },
      orderBy: { name: "asc" },
    }),
  ]);

  return (
    <div>
      <h1 className="text-2xl font-bold">Equipo</h1>
      <p className="mt-1 text-sm text-cream/60">
        Resumen, Citas, Clientes y Reseñas están disponibles para toda cuenta de{" "}
        <span className="text-gold">Personal</span>. Elige qué más puede ver cada quien —
        Personal, Catálogo, Reportes y Configuración son opcionales; Equipo y Sucursales son
        siempre exclusivos del dueño.
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
              <th className="px-4 py-2">Nombre</th>
              <th className="px-4 py-2">Correo</th>
              <th className="px-4 py-2">Rol</th>
              <th className="px-4 py-2">Personal del roster</th>
              <th className="px-4 py-2">Permisos adicionales</th>
              <th className="px-4 py-2">Estado</th>
              <th className="px-4 py-2"></th>
            </tr>
          </thead>
          <tbody>
            {members.map((m) => (
              <tr key={m.id} className="border-t border-white/5">
                <td className="px-4 py-2 font-medium">{m.name}</td>
                <td className="px-4 py-2 text-cream/70">{m.email}</td>
                <td className="px-4 py-2 text-cream/70">
                  {m.role === "OWNER" ? "Dueño" : "Personal"}
                </td>
                <td className="px-4 py-2 text-cream/70">{m.linkedStaff?.name ?? "—"}</td>
                <td className="px-4 py-2 text-cream/70">
                  {m.role === "OWNER"
                    ? "Todos"
                    : m.permissions
                      ? m.permissions
                          .split(",")
                          .map((p) => PERMISSION_LABELS[p] ?? p)
                          .join(", ")
                      : "Ninguno"}
                </td>
                <td className="px-4 py-2">
                  <span
                    className={`rounded-full px-2 py-1 text-xs ${
                      m.active ? "bg-green-500/20 text-green-400" : "bg-white/10 text-cream/50"
                    }`}
                  >
                    {m.active ? "Activo" : "Desactivado"}
                  </span>
                </td>
                <td className="px-4 py-2 text-right">
                  {m.role !== "OWNER" && (
                    <div className="flex justify-end gap-3">
                      <Link href={`/dashboard/team/${m.id}`} className="text-xs text-gold hover:underline">
                        Editar permisos
                      </Link>
                      <form action={toggleTeamMemberActive.bind(null, m.id)}>
                        <button className="text-xs text-gold hover:underline">
                          {m.active ? "Desactivar" : "Activar"}
                        </button>
                      </form>
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-8 max-w-lg rounded-lg border border-white/10 bg-charcoal p-6">
        <h2 className="text-lg font-semibold">Agregar cuenta de personal</h2>
        <form action={createTeamMember} className="mt-4 space-y-4">
          <div>
            <label className="text-sm text-cream/70">Nombre</label>
            <input
              name="name"
              required
              className="mt-1 w-full rounded-md border border-white/20 bg-ink px-3 py-2 outline-none focus:border-gold"
            />
          </div>
          <div>
            <label className="text-sm text-cream/70">Correo</label>
            <input
              type="email"
              name="email"
              required
              className="mt-1 w-full rounded-md border border-white/20 bg-ink px-3 py-2 outline-none focus:border-gold"
            />
          </div>
          <div>
            <label className="text-sm text-cream/70">Contraseña temporal</label>
            <input
              type="password"
              name="password"
              required
              minLength={6}
              className="mt-1 w-full rounded-md border border-white/20 bg-ink px-3 py-2 outline-none focus:border-gold"
            />
          </div>
          <div>
            <label className="text-sm text-cream/70">
              Vincular con personal del roster (opcional, para que solo pueda abrir/cerrar su
              propia caja)
            </label>
            <select
              name="staffId"
              defaultValue=""
              className="mt-1 w-full rounded-md border border-white/20 bg-ink px-3 py-2 outline-none focus:border-gold"
            >
              <option value="">Sin vincular</option>
              {unlinkedStaff.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-sm text-cream/70">Permisos adicionales</label>
            <div className="mt-2 flex flex-wrap gap-3">
              {Object.entries(PERMISSION_LABELS).map(([value, label]) => (
                <label key={value} className="flex items-center gap-1 text-sm">
                  <input type="checkbox" name="permissions" value={value} />
                  {label}
                </label>
              ))}
            </div>
          </div>
          <button
            type="submit"
            className="rounded-md bg-gold px-4 py-2 font-semibold text-ink hover:bg-gold/90"
          >
            Crear cuenta
          </button>
        </form>
      </div>
    </div>
  );
}
