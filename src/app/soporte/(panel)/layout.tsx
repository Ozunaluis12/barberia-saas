import Link from "next/link";
import { requireSupportSession } from "@/lib/supportGuard";
import { supportLogoutAction } from "@/app/actions/supportAuth";

export default async function SupportLayout({ children }: { children: React.ReactNode }) {
  const session = await requireSupportSession();

  return (
    <div className="min-h-screen bg-ink text-cream">
      <header className="flex items-center justify-between border-b border-white/10 bg-charcoal px-6 py-4">
        <div>
          <p className="text-sm uppercase tracking-widest text-gold">Turnify · Soporte</p>
          <Link href="/soporte" className="text-lg font-bold hover:text-gold">
            Empresas
          </Link>
        </div>
        <div className="flex items-center gap-4 text-sm">
          <span className="text-cream/60">{session.name}</span>
          <form action={supportLogoutAction}>
            <button type="submit" className="text-cream/60 hover:text-gold">
              Cerrar sesión
            </button>
          </form>
        </div>
      </header>
      <main className="mx-auto max-w-5xl px-6 py-8">{children}</main>
    </div>
  );
}
