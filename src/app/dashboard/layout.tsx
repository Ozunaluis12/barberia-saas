import { requireSession } from "@/lib/guard";
import { prisma } from "@/lib/db";
import { logoutAction } from "@/app/actions/auth";
import { getVocabulary } from "@/lib/vocabulary";
import DashboardShell from "./DashboardShell";

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
    { href: "/dashboard/waitlist", label: "Lista de espera" },
    { href: "/dashboard/register", label: "Caja" },
    ...(can("staff") ? [{ href: "/dashboard/staff", label: vocab.staffPlural }] : []),
    ...(can("catalog") ? [{ href: "/dashboard/services", label: "Servicios" }] : []),
    ...(can("catalog") ? [{ href: "/dashboard/catalog", label: "Catálogo" }] : []),
    ...(can("catalog") ? [{ href: "/dashboard/coupons", label: "Cupones" }] : []),
    { href: "/dashboard/clients", label: "Clientes" },
    { href: "/dashboard/reviews", label: "Reseñas" },
    ...(can("reports") ? [{ href: "/dashboard/reports", label: "Reportes" }] : []),
    ...(can("reports") ? [{ href: "/dashboard/analytics", label: "Analítica" }] : []),
    ...(isOwner ? [{ href: "/dashboard/team", label: "Equipo" }] : []),
    ...(isOwner ? [{ href: "/dashboard/locations", label: "Sucursales" }] : []),
    ...(isOwner ? [{ href: "/dashboard/broadcast", label: "Difusión" }] : []),
    ...(isOwner ? [{ href: "/dashboard/audit", label: "Auditoría" }] : []),
    ...(can("settings") ? [{ href: "/dashboard/settings", label: "Configuración" }] : []),
  ];

  return (
    <DashboardShell
      navItems={nav}
      businessName={business?.name}
      isOwner={isOwner}
      businessSlug={business?.slug}
      logoutAction={logoutAction}
    >
      {children}
    </DashboardShell>
  );
}
