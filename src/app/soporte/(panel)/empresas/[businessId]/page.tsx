import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import {
  setBusinessStatusAction,
  updateSubscriptionAction,
  toggleStaffActiveAction,
} from "@/app/actions/support";

const ACTION_LABEL: Record<string, string> = {
  SUPPORT_SUSPEND_BUSINESS: "Soporte suspendió la empresa",
  SUPPORT_ACTIVATE_BUSINESS: "Soporte reactivó la empresa",
  SUPPORT_UPDATE_SUBSCRIPTION: "Soporte actualizó la suscripción",
  SUPPORT_ACTIVATE_STAFF: "Soporte reactivó una cuenta de personal",
  SUPPORT_DEACTIVATE_STAFF: "Soporte desactivó una cuenta de personal",
};

function toDateInputValue(date: Date | null): string {
  if (!date) return "";
  return date.toISOString().slice(0, 10);
}

export default async function SupportBusinessDetailPage({
  params,
}: {
  params: Promise<{ businessId: string }>;
}) {
  const { businessId } = await params;

  const business = await prisma.business.findUnique({
    where: { id: businessId },
    include: { organization: true, users: { orderBy: { name: "asc" } } },
  });
  if (!business) notFound();

  const logs = await prisma.auditLog.findMany({
    where: { organizationId: business.organizationId },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  return (
    <div className="space-y-8">
      <div>
        <p className="text-sm text-cream/50">{business.organization.name}</p>
        <h1 className="text-2xl font-bold">{business.name}</h1>
        <p className="text-sm text-cream/40">/{business.slug}</p>
      </div>

      <section className="rounded-lg border border-white/10 p-4">
        <h2 className="font-semibold">Estado de la cuenta</h2>
        <p className="mt-1 text-sm text-cream/60">
          Estado actual:{" "}
          <span className={business.subscriptionStatus === "SUSPENDED" ? "text-red-400" : "text-green-400"}>
            {business.subscriptionStatus === "SUSPENDED" ? "Suspendida" : "Activa"}
          </span>
          {business.subscriptionStatus === "SUSPENDED" && business.suspendedReason && (
            <> — {business.suspendedReason}</>
          )}
        </p>

        {business.subscriptionStatus === "SUSPENDED" ? (
          <form action={setBusinessStatusAction} className="mt-4">
            <input type="hidden" name="businessId" value={business.id} />
            <input type="hidden" name="status" value="ACTIVE" />
            <button type="submit" className="rounded-md bg-gold px-4 py-2 font-semibold text-ink hover:bg-gold/90">
              Reactivar empresa
            </button>
          </form>
        ) : (
          <form action={setBusinessStatusAction} className="mt-4 space-y-2">
            <input type="hidden" name="businessId" value={business.id} />
            <input type="hidden" name="status" value="SUSPENDED" />
            <label className="text-sm text-cream/70">Motivo (opcional)</label>
            <textarea
              name="reason"
              rows={2}
              className="w-full rounded-md border border-white/20 bg-ink px-3 py-2 text-sm outline-none focus:border-gold"
              placeholder="Ej: pago de suscripción vencido"
            />
            <button type="submit" className="rounded-md bg-red-500/20 px-4 py-2 font-semibold text-red-300 hover:bg-red-500/30">
              Suspender empresa
            </button>
          </form>
        )}
      </section>

      <section className="rounded-lg border border-white/10 p-4">
        <h2 className="font-semibold">Suscripción</h2>
        <form action={updateSubscriptionAction} className="mt-4 grid gap-4 sm:grid-cols-2">
          <input type="hidden" name="businessId" value={business.id} />
          <div>
            <label className="text-sm text-cream/70">Plan</label>
            <select
              name="plan"
              defaultValue={business.plan}
              className="mt-1 w-full rounded-md border border-white/20 bg-ink px-3 py-2 text-sm outline-none focus:border-gold"
            >
              <option value="GRATIS">GRATIS</option>
              <option value="PRO">PRO</option>
            </select>
          </div>
          <div>
            <label className="text-sm text-cream/70">Próxima renovación</label>
            <input
              type="date"
              name="subscriptionRenewsAt"
              defaultValue={toDateInputValue(business.subscriptionRenewsAt)}
              className="mt-1 w-full rounded-md border border-white/20 bg-ink px-3 py-2 text-sm outline-none focus:border-gold"
            />
          </div>
          <div className="sm:col-span-2">
            <label className="text-sm text-cream/70">Notas (método de pago, acuerdos, etc.)</label>
            <textarea
              name="subscriptionNotes"
              rows={3}
              defaultValue={business.subscriptionNotes ?? ""}
              className="mt-1 w-full rounded-md border border-white/20 bg-ink px-3 py-2 text-sm outline-none focus:border-gold"
            />
          </div>
          <div className="sm:col-span-2">
            <button type="submit" className="rounded-md bg-gold px-4 py-2 font-semibold text-ink hover:bg-gold/90">
              Guardar
            </button>
          </div>
        </form>
      </section>

      <section className="rounded-lg border border-white/10 p-4">
        <h2 className="font-semibold">Personal con acceso</h2>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-left text-cream/60">
              <tr>
                <th className="px-2 py-2">Nombre</th>
                <th className="px-2 py-2">Correo</th>
                <th className="px-2 py-2">Rol</th>
                <th className="px-2 py-2">Estado</th>
                <th className="px-2 py-2"></th>
              </tr>
            </thead>
            <tbody>
              {business.users.map((u) => (
                <tr key={u.id} className="border-t border-white/5">
                  <td className="px-2 py-2">{u.name}</td>
                  <td className="px-2 py-2 text-cream/70">{u.email}</td>
                  <td className="px-2 py-2 text-cream/70">{u.role}</td>
                  <td className="px-2 py-2">
                    <span className={u.active ? "text-green-400" : "text-red-400"}>
                      {u.active ? "Activo" : "Desactivado"}
                    </span>
                  </td>
                  <td className="px-2 py-2 text-right">
                    <form action={toggleStaffActiveAction}>
                      <input type="hidden" name="userId" value={u.id} />
                      <input type="hidden" name="businessId" value={business.id} />
                      <button type="submit" className="text-gold hover:underline">
                        {u.active ? "Desactivar" : "Reactivar"}
                      </button>
                    </form>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="rounded-lg border border-white/10 p-4">
        <h2 className="font-semibold">Auditoría de la organización</h2>
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
                  <td className="px-2 py-2 text-cream/70">{ACTION_LABEL[l.action] ?? l.action}</td>
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
