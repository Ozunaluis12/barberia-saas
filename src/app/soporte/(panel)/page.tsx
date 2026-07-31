import Link from "next/link";
import { prisma } from "@/lib/db";

export default async function SupportHomePage() {
  const organizations = await prisma.organization.findMany({
    include: { locations: { orderBy: { name: "asc" } } },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div>
      <h1 className="text-2xl font-bold">Empresas</h1>
      <p className="mt-1 text-sm text-cream/60">
        Todas las organizaciones registradas en Turnify y sus sucursales.
      </p>

      <div className="mt-6 space-y-6">
        {organizations.map((org) => (
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
        {organizations.length === 0 && (
          <p className="text-center text-cream/40">Todavía no hay empresas registradas.</p>
        )}
      </div>
    </div>
  );
}
