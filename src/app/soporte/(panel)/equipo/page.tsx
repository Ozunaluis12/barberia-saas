import { prisma } from "@/lib/db";
import { requireSupportSession } from "@/lib/supportGuard";
import { createSupportUserAction, toggleSupportUserActiveAction } from "@/app/actions/support";

const ERROR_LABEL: Record<string, string> = {
  DATOS_INVALIDOS: "Completa nombre, correo y una contraseña de al menos 6 caracteres.",
  EMAIL_EN_USO: "Ya existe una cuenta de soporte con ese correo.",
  ULTIMA_CUENTA_SOPORTE: "No puedes desactivar la única cuenta de soporte activa.",
};

export default async function SupportTeamPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const session = await requireSupportSession();
  const { error } = await searchParams;

  const members = await prisma.supportUser.findMany({ orderBy: { createdAt: "asc" } });
  const logs = await prisma.auditLog.findMany({
    where: { organizationId: null },
    orderBy: { createdAt: "desc" },
    take: 30,
  });

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold">Equipo de soporte</h1>
        <p className="mt-1 text-sm text-cream/60">
          Cuentas con acceso total a todas las empresas. Trátalas con el mismo cuidado que una
          contraseña maestra.
        </p>
      </div>

      {error && (
        <p className="rounded-md bg-red-500/10 px-3 py-2 text-sm text-red-400">
          {ERROR_LABEL[error] ?? "Ocurrió un error."}
        </p>
      )}

      <section className="rounded-lg border border-white/10 p-4">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-left text-cream/60">
              <tr>
                <th className="px-2 py-2">Nombre</th>
                <th className="px-2 py-2">Correo</th>
                <th className="px-2 py-2">Estado</th>
                <th className="px-2 py-2"></th>
              </tr>
            </thead>
            <tbody>
              {members.map((m) => (
                <tr key={m.id} className="border-t border-white/5">
                  <td className="px-2 py-2">
                    {m.name}
                    {m.id === session.supportUserId && <span className="ml-2 text-xs text-cream/40">(tú)</span>}
                  </td>
                  <td className="px-2 py-2 text-cream/70">{m.email}</td>
                  <td className="px-2 py-2">
                    <span className={m.active ? "text-green-400" : "text-red-400"}>
                      {m.active ? "Activa" : "Desactivada"}
                    </span>
                  </td>
                  <td className="px-2 py-2 text-right">
                    <form action={toggleSupportUserActiveAction}>
                      <input type="hidden" name="supportUserId" value={m.id} />
                      <button type="submit" className="text-gold hover:underline">
                        {m.active ? "Desactivar" : "Reactivar"}
                      </button>
                    </form>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <hr className="my-5 border-white/10" />

        <h3 className="text-sm font-semibold text-cream/80">Agregar cuenta de soporte</h3>
        <p className="mt-1 text-xs text-cream/50">
          Escribe una contraseña temporal y compártela por fuera — a diferencia de las cuentas de
          negocio, aquí no se manda por correo.
        </p>
        <form action={createSupportUserAction} className="mt-3 grid gap-3 sm:grid-cols-4">
          <div>
            <label className="text-xs text-cream/60">Nombre</label>
            <input
              type="text"
              name="name"
              required
              className="mt-1 w-full rounded-md border border-white/20 bg-ink px-3 py-2 text-sm outline-none focus:border-gold"
            />
          </div>
          <div>
            <label className="text-xs text-cream/60">Correo</label>
            <input
              type="email"
              name="email"
              required
              className="mt-1 w-full rounded-md border border-white/20 bg-ink px-3 py-2 text-sm outline-none focus:border-gold"
            />
          </div>
          <div>
            <label className="text-xs text-cream/60">Contraseña temporal</label>
            <input
              type="text"
              name="password"
              required
              minLength={6}
              className="mt-1 w-full rounded-md border border-white/20 bg-ink px-3 py-2 text-sm outline-none focus:border-gold"
            />
          </div>
          <div className="flex items-end">
            <button type="submit" className="rounded-md bg-gold px-4 py-2 text-sm font-semibold text-ink hover:bg-gold/90">
              Agregar
            </button>
          </div>
        </form>
      </section>

      <section className="rounded-lg border border-white/10 p-4">
        <h2 className="font-semibold">Actividad interna de soporte</h2>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-left text-cream/60">
              <tr>
                <th className="px-2 py-2">Fecha</th>
                <th className="px-2 py-2">Quién</th>
                <th className="px-2 py-2">Acción</th>
                <th className="px-2 py-2">Detalle</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((l) => (
                <tr key={l.id} className="border-t border-white/5">
                  <td className="px-2 py-2 text-cream/70">
                    {l.createdAt.toLocaleString("es", {
                      day: "2-digit",
                      month: "2-digit",
                      year: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </td>
                  <td className="px-2 py-2 font-medium">{l.userName}</td>
                  <td className="px-2 py-2 text-cream/70">{l.action}</td>
                  <td className="px-2 py-2 text-cream/50">{l.details ?? "—"}</td>
                </tr>
              ))}
              {logs.length === 0 && (
                <tr>
                  <td className="px-2 py-6 text-center text-cream/40" colSpan={4}>
                    Todavía no hay entradas registradas.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
