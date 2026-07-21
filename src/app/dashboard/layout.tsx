import Link from "next/link";
import { requireSession } from "@/lib/guard";
import { prisma } from "@/lib/db";
import { logoutAction } from "@/app/actions/auth";
import { getVocabulary } from "@/lib/vocabulary";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await requireSession();
  const business = await prisma.business.findUnique({ where: { id: session.businessId } });
  const vocab = getVocabulary(business?.category ?? "OTHER");

  const isOwner = session.role === "OWNER";
  const perms = session.permissions ? session.permissions.split(",") : [];
  const can = (key: string) => isOwner || perms.includes(key);

  const nav = [
    { href: "/dashboard", label: "Resumen" },
    { href: "/dashboard/appointments", label: "Citas" },
    { href: "/dashboard/calendar", label: "Calendario" },
    { href: "/dashboard/register", label: "Caja" },
    ...(can("staff") ? [{ href: "/dashboard/staff", label: vocab.staffPlural }] : []),
    ...(can("catalog") ? [{ href: "/dashboard/services", label: "Servicios" }] : []),
    ...(can("catalog") ? [{ href: "/dashboard/catalog", label: "Catálogo" }] : []),
    { href: "/dashboard/clients", label: "Clientes" },
    { href: "/dashboard/reviews", label: "Reseñas" },
    ...(can("reports") ? [{ href: "/dashboard/reports", label: "Reportes" }] : []),
    ...(isOwner ? [{ href: "/dashboard/team", label: "Equipo" }] : []),
    ...(isOwner ? [{ href: "/dashboard/locations", label: "Sucursales" }] : []),
    ...(can("settings") ? [{ href: "/dashboard/settings", label: "Configuración" }] : []),
  ];

  return (
    <div className="flex min-h-screen bg-ink text-cream">
      <aside className="w-60 shrink-0 border-r border-white/10 bg-charcoal p-4">
        <div className="px-2 py-2">
          <p className="text-lg font-bold text-gold">Turnify</p>
          <p className="truncate text-sm text-cream/60">{business?.name}</p>
          {isOwner && (
            <Link href="/dashboard/locations" className="text-xs text-gold hover:underline">
              Cambiar de sucursal →
            </Link>
          )}
        </div>
        <nav className="mt-6 space-y-1">
          {nav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="block rounded-md px-3 py-2 text-sm hover:bg-white/5"
            >
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="mt-8 space-y-2 px-2">
          <Link
            href={`/book/${business?.slug}`}
            target="_blank"
            className="block text-xs text-gold hover:underline"
          >
            Ver página pública de reservas →
          </Link>
          <Link
            href={`/catalogo/${business?.slug}`}
            target="_blank"
            className="block text-xs text-gold hover:underline"
          >
            Ver catálogo público →
          </Link>
          <form action={logoutAction}>
            <button className="text-xs text-cream/50 hover:text-cream">Cerrar sesión</button>
          </form>
        </div>
      </aside>
      <main className="flex-1 p-8">{children}</main>
    </div>
  );
}
