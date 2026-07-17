import Link from "next/link";
import { signupAction } from "@/app/actions/auth";

const ERRORS: Record<string, string> = {
  DATOS_INVALIDOS: "Revisa los datos: la contraseña debe tener al menos 6 caracteres.",
  EMAIL_EN_USO: "Ese correo ya está registrado. Intenta iniciar sesión.",
};

export default async function SignupPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;

  return (
    <main className="flex min-h-screen items-center justify-center bg-ink px-4 text-cream">
      <div className="w-full max-w-md rounded-lg border border-white/10 bg-charcoal p-8">
        <Link href="/" className="text-lg font-bold text-gold">
          CorteYa
        </Link>
        <h1 className="mt-4 text-2xl font-bold">Crea tu barbería</h1>
        <p className="mt-1 text-sm text-cream/60">
          Empieza gratis. Sin tarjeta de crédito.
        </p>

        {error && (
          <p className="mt-4 rounded-md bg-red-500/10 px-3 py-2 text-sm text-red-400">
            {ERRORS[error] ?? "Ocurrió un error, intenta de nuevo."}
          </p>
        )}

        <form action={signupAction} className="mt-6 space-y-4">
          <div>
            <label className="text-sm text-cream/70">Nombre de la barbería</label>
            <input
              name="shopName"
              required
              className="mt-1 w-full rounded-md border border-white/20 bg-ink px-3 py-2 outline-none focus:border-gold"
              placeholder="Barbería Estilo Urbano"
            />
          </div>
          <div>
            <label className="text-sm text-cream/70">Tu nombre</label>
            <input
              name="ownerName"
              required
              className="mt-1 w-full rounded-md border border-white/20 bg-ink px-3 py-2 outline-none focus:border-gold"
              placeholder="Luis Ozuna"
            />
          </div>
          <div>
            <label className="text-sm text-cream/70">Correo</label>
            <input
              type="email"
              name="email"
              required
              className="mt-1 w-full rounded-md border border-white/20 bg-ink px-3 py-2 outline-none focus:border-gold"
              placeholder="tu@correo.com"
            />
          </div>
          <div>
            <label className="text-sm text-cream/70">Contraseña</label>
            <input
              type="password"
              name="password"
              required
              minLength={6}
              className="mt-1 w-full rounded-md border border-white/20 bg-ink px-3 py-2 outline-none focus:border-gold"
              placeholder="Mínimo 6 caracteres"
            />
          </div>
          <button
            type="submit"
            className="w-full rounded-md bg-gold px-4 py-2 font-semibold text-ink hover:bg-gold/90"
          >
            Crear mi barbería
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-cream/60">
          ¿Ya tienes cuenta?{" "}
          <Link href="/login" className="text-gold hover:underline">
            Inicia sesión
          </Link>
        </p>
      </div>
    </main>
  );
}
