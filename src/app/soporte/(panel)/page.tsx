import Link from "next/link";
import { prisma } from "@/lib/db";

const SOON_DAYS = 7;

export default async function SupportHomePage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;
  const query = (q ?? "").trim().toLowerCase();

  const organizations = await prisma.organization.findMany({
    include: { locations: { orderBy: { name: "asc" } } },
    orderBy: { createdAt: "desc" },
  });

  const allBusinesses = organizations.flatMap((org) => org.locations);
  const activeCount = allBusinesses.filter((b) => b.subscriptionStatus === "ACTIVE").length;
  const suspendedCount = allBusinesses.filter((b) => b.subscriptionStatus === "SUSPENDED").length;

  const soonCutoff = new Date(Date.now() + SOON_DAYS * 24 * 60 * 60 * 1000);
  const dueSoon = allBusinesses
    .filter((b) => b.subscriptionStatus === "ACTIVE" && b.subscriptionRenewsAt && b.subscriptionRenewsAt <= soonCutoff)
    .sort((a, b) => (a.subscriptionRenewsAt!.getTime() - b.subscriptionRenewsAt!.getTime()));

  const matchesQuery = (orgName: string, bizName: string, slug: string) =>
    !query || orgName.toLowerCase().includes(query) || bizName.toLowerCase().includes(query) || slug.toLowerCase().includes(query);

  const filteredOrganizations = organizations
    .map((org) => ({
      ...org,
      locations: org.locations.filter((biz) => matchesQuery(org.name, biz.name, biz.slug)),
    }))
    .filter((org) => org.locations.length > 0);

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Empresas</h1>
          <p className="mt-1 text-sm text-cream/60">
            Todas las organizaciones registradas en Turnify y sus sucursales.
          </p>
        </div>
        <Link
          href="/soporte/empresas/nueva"
          className="rounded-md bg-gold px-4 py-2 text-sm font-semibold text-ink hover:bg-gold/90"
        >
          + Nueva empresa
        </Link>
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        <div className="rounded-lg border border-white/10 p-4">
          <p className="text-xs uppercase tracking-wide text-cream/50">Empresas activas</p>
          <p className="mt-1 text-2xl font-bold text-green-400">{activeCount}</p>
        </div>
        <div className="rounded-lg border border-white/10 p-4">
          <p className="text-xs uppercase tracking-wide text-cream/50">Suspendidas</p>
          <p className="mt-1 text-2xl font-bold text-red-400">{suspendedCount}</p>
        </div>
        <div className="rounded-lg border border-white/10 p-4">
          <p className="text-xs uppercase tracking-wide text-cream/50">Vencen en {SOON_DAYS} días o menos</p>
          <p className="mt-1 text-2xl font-bold text-gold">{dueSoon.length}</p>
        </div>
      </div>

      {dueSoon.length > 0 && (
        <div className="mt-4 rounded-lg border border-gold/30 bg-gold/5 p-4">
          <h2 className="text-sm font-semibold text-gold">Próximas a vencer</h2>
          <ul className="mt-2 space-y-1 text-sm">
            {dueSoon.map((b) => (
              <li key={b.id} className="flex items-center justify-between">
                <span>
                  {b.name} <span className="text-cream/40">/{b.slug}</span>
                </span>
                <span className="flex items-center gap-3">
                  <span className={b.subscriptionRenewsAt! < new Date() ? "text-red-400" : "text-cream/70"}>
                    {b.subscriptionRenewsAt!.toLocaleDateString("es")}
                    {b.subscriptionRenewsAt! < new Date() ? " (vencida)" : ""}
                  </span>
                  <Link href={`/soporte/empresas/${b.id}`} className="text-gold hover:underline">
                    Ver →
                  </Link>
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}

      <form className="mt-6" action="/soporte">
        <input
          type="text"
          name="q"
          defaultValue={q ?? ""}
          placeholder="Buscar por nombre o /slug..."
          className="w-full max-w-sm rounded-md border border-white/20 bg-ink px-3 py-2 text-sm outline-none focus:border-gold"
        />
      </form>

      <div className="mt-6 space-y-6">
        {filteredOrganizations.map((org) => (
          <div key={org.id} className="rounded-lg border border-white/10">
            <div className="border-b border-white/10 bg-charcoal px-4 py-2 text-sm font-semibold">
              {org.name}
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="text-left text-cream/60">
                  <tr>
                    <th className="px-4 py-2">Sucursal</th>
                    <th className="px-4 py-2">Plan</th>
                    <th className="px-4 py-2">Estado</th>
                    <th className="px-4 py-2">Renueva</th>
                    <th className="px-4 py-2"></th>
                  </tr>
                </thead>
                <tbody>
                  {org.locations.map((biz) => (
                    <tr key={biz.id} className="border-t border-white/5">
                      <td className="px-4 py-2">
                        <div className="font-medium">{biz.name}</div>
                        <div className="text-xs text-cream/40">/{biz.slug}</div>
                      </td>
                      <td className="px-4 py-2 text-cream/70">{biz.plan}</td>
                      <td className="px-4 py-2">
                        <span
                          className={
                            biz.subscriptionStatus === "SUSPENDED"
                              ? "rounded-full bg-red-500/10 px-2 py-0.5 text-xs text-red-400"
                              : "rounded-full bg-green-500/10 px-2 py-0.5 text-xs text-green-400"
                          }
                        >
                          {biz.subscriptionStatus === "SUSPENDED" ? "Suspendida" : "Activa"}
                        </span>
                      </td>
                      <td className="px-4 py-2 text-cream/70">
                        {biz.subscriptionRenewsAt
                          ? biz.subscriptionRenewsAt.toLocaleDateString("es")
                          : "—"}
                      </td>
                      <td className="px-4 py-2 text-right">
                        <Link href={`/soporte/empresas/${biz.id}`} className="text-gold hover:underline">
                          Administrar →
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ))}
        {filteredOrganizations.length === 0 && (
          <p className="text-center text-cream/40">
            {query ? "Ninguna empresa coincide con la búsqueda." : "Todavía no hay empresas registradas."}
          </p>
        )}
      </div>
    </div>
  );
}
