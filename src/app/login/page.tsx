import Link from "next/link";
import { loginAction } from "@/app/actions/auth";
import PasswordField from "./PasswordField";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;

  return (
    <main className="flex min-h-screen items-center justify-center bg-ink px-4 text-cream">
      <div className="w-full max-w-md rounded-lg border border-white/10 bg-charcoal p-8">
        <Link href="/" className="text-lg font-bold text-gold">
          Turnify
        </Link>
        <h1 className="mt-4 text-2xl font-bold">Iniciar sesión</h1>

        {error && (
          <p className="mt-4 rounded-md bg-red-500/10 px-3 py-2 text-sm text-red-400">
            {error === "CUENTA_DESACTIVADA"
              ? "Esta cuenta fue desactivada. Contacta al dueño del negocio."
              : "Correo o contraseña incorrectos."}
          </p>
        )}

        <form action={loginAction} className="mt-6 space-y-4">
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
            <label className="text-sm text-cream/70">Contraseña</label>
            <PasswordField />
          </div>
          <button
            type="submit"
            className="w-full rounded-md bg-gold px-4 py-2 font-semibold text-ink hover:bg-gold/90"
          >
            Entrar
          </button>
        </form>

        <p className="mt-4 text-center text-sm">
          <Link href="/forgot-password" className="text-gold hover:underline">
            ¿Olvidaste tu contraseña?
          </Link>
        </p>

        <p className="mt-4 text-center text-sm text-cream/60">
          ¿No tienes cuenta?{" "}
          <Link href="/signup" className="text-gold hover:underline">
            Crea tu negocio
          </Link>
        </p>
      </div>
    </main>
  );
}
