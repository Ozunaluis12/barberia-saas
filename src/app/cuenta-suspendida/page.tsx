import Link from "next/link";
import { logoutAction } from "@/app/actions/auth";

export default function CuentaSuspendidaPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-ink px-4 text-cream">
      <div className="w-full max-w-md rounded-lg border border-white/10 bg-charcoal p-8 text-center">
        <Link href="/" className="text-lg font-bold text-gold">
          Turnify
        </Link>
        <h1 className="mt-4 text-2xl font-bold">Cuenta suspendida</h1>
        <p className="mt-3 text-sm text-cream/70">
          El acceso de tu negocio está temporalmente suspendido, generalmente por un pago de
          suscripción pendiente. Contacta a soporte para reactivarlo.
        </p>
        <form action={logoutAction} className="mt-6">
          <button
            type="submit"
            className="w-full rounded-md bg-gold px-4 py-2 font-semibold text-ink hover:bg-gold/90"
          >
            Cerrar sesión
          </button>
        </form>
      </div>
    </main>
  );
}
