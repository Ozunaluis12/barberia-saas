import Link from "next/link";
import { requestPasswordReset } from "@/app/actions/auth";

export default async function ForgotPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ sent?: string }>;
}) {
  const { sent } = await searchParams;

  return (
    <main className="flex min-h-screen items-center justify-center bg-ink px-4 text-cream">
      <div className="w-full max-w-md rounded-lg border border-white/10 bg-charcoal p-8">
        <Link href="/" className="text-lg font-bold text-gold">
          Turnify
        </Link>
        <h1 className="mt-4 text-2xl font-bold">Recuperar contraseña</h1>

        {sent ? (
          <p className="mt-6 rounded-md bg-green-500/10 px-3 py-3 text-sm text-green-400">
            Si existe una cuenta con ese correo, te enviamos un enlace para restablecer tu
            contraseña. Revisa tu bandeja de entrada (y spam).
          </p>
        ) : (
          <>
            <p className="mt-1 text-sm text-cream/60">
              Escribe el correo con el que te registraste y te enviamos un enlace para elegir una
              nueva contraseña.
            </p>
            <form action={requestPasswordReset} className="mt-6 space-y-4">
              <div>
                <label className="text-sm text-cream/70">Correo</label>
                <input
                  type="email"
                  name="email"
                  required
                  className="mt-1 w-full rounded-md border border-white/20 bg-ink px-3 py-2 outline-none focus:border-gold"
                />
              </div>
              <button
                type="submit"
                className="w-full rounded-md bg-gold px-4 py-2 font-semibold text-ink hover:bg-gold/90"
              >
                Enviar enlace de recuperación
              </button>
            </form>
          </>
        )}

        <p className="mt-6 text-center text-sm text-cream/60">
          <Link href="/login" className="text-gold hover:underline">
            Volver a iniciar sesión
          </Link>
        </p>
      </div>
    </main>
  );
}
