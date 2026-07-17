import Link from "next/link";
import { requireSession } from "@/lib/guard";
import { prisma } from "@/lib/db";
import { logoutAction } from "@/app/actions/auth";

const NAV = [
  { href: "/dashboard", label: "Resumen" },
  { href: "/dashboard/appointments", label: "Citas" },
  { href: "/dashboard/barbers", label: "Barberos" },
  { href: "/dashboard/services", label: "Servicios" },
  { href: "/dashboard/reports", label: "Comisiones" },
];

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await requireSession();
  const shop = await prisma.shop.findUnique({ where: { id: session.shopId } });

  return (
    <div className="flex min-h-screen bg-ink text-cream">
      <aside className="w-60 shrink-0 border-r border-white/10 bg-charcoal p-4">
        <div className="px-2 py-2">
          <p className="text-lg font-bold text-gold">CorteYa</p>
          <p className="truncate text-sm text-cream/60">{shop?.name}</p>
        </div>
        <nav className="mt-6 space-y-1">
          {NAV.map((item) => (
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
            href={`/book/${shop?.slug}`}
            target="_blank"
            className="block text-xs text-gold hover:underline"
          >
            Ver página pública de reservas →
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
